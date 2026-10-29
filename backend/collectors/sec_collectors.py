from datetime import datetime, timezone, timedelta
from typing import List
import boto3
from collectors.base import BaseCollector
from normalizer.schema import Finding, Category, Severity, RemediationSnippet


class SecurityGroupAdminPortCollector(BaseCollector):
    collector_id = "SEC_SG_OPEN_ADMIN"
    service_name = "ec2"
    category = "security"

    DANGEROUS_PORTS = {22: "SSH", 3389: "RDP"}

    def collect(self, session: boto3.Session, region: str) -> List[Finding]:
        ec2 = self.get_read_only_client(session, "ec2", region)
        findings: List[Finding] = []

        resp = ec2.describe_security_groups()

        for sg in resp.get("SecurityGroups", []):
            sg_id = sg.get("GroupId")
            sg_name = sg.get("GroupName")

            for perm in sg.get("IpPermissions", []):
                from_port = perm.get("FromPort")
                to_port = perm.get("ToPort")

                # Check if 22 or 3389 fall within the port range
                matching_ports = [
                    p for p in self.DANGEROUS_PORTS
                    if from_port is not None and to_port is not None and from_port <= p <= to_port
                ]

                if not matching_ports:
                    continue

                # Check for 0.0.0.0/0 or ::/0
                has_global_ipv4 = any(
                    ip.get("CidrIp") == "0.0.0.0/0" for ip in perm.get("IpRanges", [])
                )
                has_global_ipv6 = any(
                    ip.get("CidrIpv6") == "::/0" for ip in perm.get("Ipv6Ranges", [])
                )

                if has_global_ipv4 or has_global_ipv6:
                    port_names = ", ".join(f"{self.DANGEROUS_PORTS[p]} ({p})" for p in matching_ports)
                    findings.append(
                        Finding(
                            category=Category.SECURITY,
                            severity=Severity.CRITICAL,
                            title=f"Security Group '{sg_name}' Exposes {port_names} to 0.0.0.0/0",
                            resource_id=sg_id,
                            resource_type="AWS::EC2::SecurityGroup",
                            service="EC2",
                            region=region,
                            evidence={
                                "group_id": sg_id,
                                "group_name": sg_name,
                                "exposed_ports": matching_ports,
                                "protocol": perm.get("IpProtocol"),
                                "cidr": "0.0.0.0/0",
                            },
                            est_monthly_saving_usd=0.0,
                            ai_recommendation=(
                                f"Inbound administrative port(s) {port_names} open to the Internet risk credential brute-forcing. "
                                f"Immediately restrict CIDR ingress to your corporate VPN/office IP or transition to AWS SSM Session Manager."
                            ),
                            remediation_snippet=RemediationSnippet(
                                cli=f"aws ec2 revoke-security-group-ingress --group-id {sg_id} --protocol tcp --port {matching_ports[0]} --cidr 0.0.0.0/0 --region {region}",
                                terraform=f"resource \"aws_security_group_rule\" \"restricted_admin\" {{\n  security_group_id = \"{sg_id}\"\n  type = \"ingress\"\n  from_port = {matching_ports[0]}\n  to_port = {matching_ports[0]}\n  protocol = \"tcp\"\n  cidr_blocks = [\"10.0.0.0/16\"]\n}}",
                            ),
                        )
                    )

        return findings


class S3PublicBucketCollector(BaseCollector):
    collector_id = "SEC_S3_PUBLIC"
    service_name = "s3"
    category = "security"

    def collect(self, session: boto3.Session, region: str) -> List[Finding]:
        s3 = self.get_read_only_client(session, "s3", region)
        findings: List[Finding] = []

        resp = s3.list_buckets()

        for b in resp.get("Buckets", []):
            bucket_name = b.get("Name")
            is_public = False
            reasons = []

            # Check Public Access Block
            try:
                pab_resp = s3.get_public_access_block(Bucket=bucket_name)
                conf = pab_resp.get("PublicAccessBlockConfiguration", {})
                if not conf.get("BlockPublicAcls") or not conf.get("BlockPublicPolicy"):
                    is_public = True
                    reasons.append("PublicAccessBlock disabled or partial")
            except Exception:
                # If NoSuchPublicAccessBlockConfiguration, bucket has no block!
                is_public = True
                reasons.append("No PublicAccessBlock configured")

            if is_public:
                findings.append(
                    Finding(
                        category=Category.SECURITY,
                        severity=Severity.CRITICAL,
                        title=f"S3 Bucket '{bucket_name}' Lacks Public Access Block",
                        resource_id=bucket_name,
                        resource_type="AWS::S3::Bucket",
                        service="S3",
                        region=region,
                        evidence={
                            "bucket_name": bucket_name,
                            "reasons": reasons,
                        },
                        est_monthly_saving_usd=0.0,
                        ai_recommendation=(
                            f"Bucket '{bucket_name}' has incomplete or missing Block Public Access settings, risking external data exfiltration. "
                            f"Enable all four Public Access Block settings immediately."
                        ),
                        remediation_snippet=RemediationSnippet(
                            cli=f"aws s3api put-public-access-block --bucket {bucket_name} --public-access-block-configuration \"BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true\"",
                            terraform=f"resource \"aws_s3_bucket_public_access_block\" \"{bucket_name.replace('-', '_')}\" {{\n  bucket = \"{bucket_name}\"\n  block_public_acls = true\n  block_public_policy = true\n  ignore_public_acls = true\n  restrict_public_buckets = true\n}}",
                        ),
                    )
                )

        return findings


class IAMMFACollector(BaseCollector):
    collector_id = "SEC_IAM_USER_NO_MFA"
    service_name = "iam"
    category = "security"

    def collect(self, session: boto3.Session, region: str) -> List[Finding]:
        iam = self.get_read_only_client(session, "iam")
        findings: List[Finding] = []

        resp = iam.list_users()

        for user in resp.get("Users", []):
            username = user.get("UserName")
            user_arn = user.get("Arn")

            # Check if user has console login profile
            has_login_profile = False
            try:
                iam.get_login_profile(UserName=username)
                has_login_profile = True
            except Exception:
                has_login_profile = False

            if not has_login_profile:
                continue

            # Check MFA devices
            mfa_resp = iam.list_mfa_devices(UserName=username)
            mfa_devices = mfa_resp.get("MFADevices", [])

            if not mfa_devices:
                findings.append(
                    Finding(
                        category=Category.SECURITY,
                        severity=Severity.CRITICAL,
                        title=f"IAM Console User '{username}' Lacks MFA Device",
                        resource_id=user_arn,
                        resource_type="AWS::IAM::User",
                        service="IAM",
                        region="global",
                        evidence={
                            "username": username,
                            "user_arn": user_arn,
                            "console_access_enabled": True,
                            "mfa_devices_count": 0,
                        },
                        est_monthly_saving_usd=0.0,
                        ai_recommendation=(
                            f"User '{username}' possesses console credentials without multi-factor authentication. "
                            f"Enforce virtual MFA device registration or migrate authentication to AWS IAM Identity Center (SSO)."
                        ),
                        remediation_snippet=RemediationSnippet(
                            cli=f"aws iam create-virtual-mfa-device --virtual-mfa-device-name {username}-mfa --outfile QRCode.png",
                            terraform=f"# Enforce MFA in account password policy or group boundary policy",
                        ),
                    )
                )

        return findings


class IAMAccessKeyAgeCollector(BaseCollector):
    collector_id = "SEC_IAM_OLD_ACCESS_KEYS"
    service_name = "iam"
    category = "security"

    def collect(self, session: boto3.Session, region: str) -> List[Finding]:
        iam = self.get_read_only_client(session, "iam")
        findings: List[Finding] = []

        resp = iam.list_users()
        now = datetime.now(timezone.utc)
        threshold_date = now - timedelta(days=90)

        for user in resp.get("Users", []):
            username = user.get("UserName")
            keys_resp = iam.list_access_keys(UserName=username)

            for key in keys_resp.get("AccessKeyMetadata", []):
                key_id = key.get("AccessKeyId")
                create_date = key.get("CreateDate")
                status = key.get("Status")

                if status == "Active" and create_date and create_date < threshold_date:
                    age_days = (now - create_date).days
                    findings.append(
                        Finding(
                            category=Category.SECURITY,
                            severity=Severity.HIGH,
                            title=f"IAM Access Key '{key_id}' for '{username}' is {age_days} Days Old (> 90d)",
                            resource_id=f"{username}/{key_id}",
                            resource_type="AWS::IAM::AccessKey",
                            service="IAM",
                            region="global",
                            evidence={
                                "username": username,
                                "access_key_id": key_id,
                                "age_days": age_days,
                                "created_date": create_date.isoformat(),
                            },
                            est_monthly_saving_usd=0.0,
                            ai_recommendation=(
                                f"Active access key {key_id} ({username}) exceeds the 90-day CIS rotation standard. "
                                f"Rotate credentials or migrate workload automation to AWS IAM OIDC roles without static keys."
                            ),
                            remediation_snippet=RemediationSnippet(
                                cli=f"aws iam update-access-key --user-name {username} --access-key-id {key_id} --status Inactive",
                                terraform="# Transition IAM users with static keys to temporary IAM roles with STS AssumeRole",
                            ),
                        )
                    )

        return findings


class EBSUnencryptedCollector(BaseCollector):
    collector_id = "SEC_EBS_UNENCRYPTED"
    service_name = "ec2"
    category = "security"

    def collect(self, session: boto3.Session, region: str) -> List[Finding]:
        ec2 = self.get_read_only_client(session, "ec2", region)
        findings: List[Finding] = []

        resp = ec2.describe_volumes()

        for vol in resp.get("Volumes", []):
            vol_id = vol.get("VolumeId")
            encrypted = vol.get("Encrypted", False)

            if not encrypted:
                size_gib = vol.get("Size", 0)
                findings.append(
                    Finding(
                        category=Category.SECURITY,
                        severity=Severity.HIGH,
                        title=f"Unencrypted EBS Volume '{vol_id}' ({size_gib}GB)",
                        resource_id=vol_id,
                        resource_type="AWS::EC2::Volume",
                        service="EBS",
                        region=region,
                        evidence={
                            "volume_id": vol_id,
                            "encrypted": False,
                            "size_gib": size_gib,
                            "state": vol.get("State"),
                        },
                        est_monthly_saving_usd=0.0,
                        ai_recommendation=(
                            f"Volume {vol_id} lacks KMS encryption at rest. "
                            f"Create a snapshot, copy it with KMS encryption enabled, replace the volume, and enable default EBS encryption."
                        ),
                        remediation_snippet=RemediationSnippet(
                            cli=f"aws ec2 enable-ebs-encryption-by-default --region {region}",
                            terraform="resource \"aws_ebs_encryption_by_default\" \"default\" {\n  enabled = true\n}",
                        ),
                    )
                )

        return findings
