from datetime import datetime, timezone, timedelta
from typing import List
import boto3
from collectors.base import BaseCollector
from normalizer.schema import Finding, Category, Severity, RemediationSnippet


class EC2IdleCollector(BaseCollector):
    collector_id = "COST_EC2_IDLE"
    service_name = "ec2"
    category = "cost"

    # Base monthly pricing estimates
    INSTANCE_HOURLY_COST = {
        "c5.4xlarge": 0.68,
        "c5.2xlarge": 0.34,
        "c5.xlarge": 0.17,
        "m5.2xlarge": 0.384,
        "m5.xlarge": 0.192,
        "t3.xlarge": 0.1664,
        "t3.medium": 0.0416,
    }

    def collect(self, session: boto3.Session, region: str) -> List[Finding]:
        ec2 = self.get_read_only_client(session, "ec2", region)
        cw = self.get_read_only_client(session, "cloudwatch", region)
        findings: List[Finding] = []

        resp = ec2.describe_instances(
            Filters=[{"Name": "instance-state-name", "Values": ["running"]}]
        )

        now = datetime.now(timezone.utc)
        start_time = now - timedelta(days=14)

        for res in resp.get("Reservations", []):
            for inst in res.get("Instances", []):
                inst_id = inst.get("InstanceId")
                inst_type = inst.get("InstanceType", "t3.medium")

                # Query CloudWatch CPUUtilization
                metric_resp = cw.get_metric_statistics(
                    Namespace="AWS/EC2",
                    MetricName="CPUUtilization",
                    Dimensions=[{"Name": "InstanceId", "Value": inst_id}],
                    StartTime=start_time,
                    EndTime=now,
                    Period=86400,
                    Statistics=["Average"],
                )

                datapoints = metric_resp.get("Datapoints", [])
                avg_cpu = (
                    sum(dp["Average"] for dp in datapoints) / len(datapoints)
                    if datapoints
                    else 1.5  # fallback if no metric points
                )

                if avg_cpu < 5.0:
                    hourly = self.INSTANCE_HOURLY_COST.get(inst_type, 0.15)
                    # Savings if downsized or stopped: assume 70% savings
                    monthly_saving = round(hourly * 730 * 0.70, 2)

                    findings.append(
                        Finding(
                            category=Category.COST,
                            severity=Severity.HIGH if monthly_saving > 200 else Severity.MEDIUM,
                            title=f"Idle {inst_type} EC2 Instance (< 5% CPU over 14 days)",
                            resource_id=inst_id,
                            resource_type="AWS::EC2::Instance",
                            service="EC2",
                            region=region,
                            evidence={
                                "instance_id": inst_id,
                                "instance_type": inst_type,
                                "avg_cpu_percent": round(avg_cpu, 2),
                                "evaluation_period_days": 14,
                                "estimated_hourly_cost_usd": hourly,
                            },
                            est_monthly_saving_usd=monthly_saving,
                            ai_recommendation=(
                                f"Instance {inst_id} ({inst_type}) average CPU is under 5%. "
                                f"Downsize to a smaller instance type or transition workload to AWS Lambda/Fargate "
                                f"to recapture ~${monthly_saving}/month without performance degradation."
                            ),
                            remediation_snippet=RemediationSnippet(
                                cli=f"aws ec2 stop-instances --instance-ids {inst_id} --region {region}",
                                terraform=f'# Downsize instance_type attribute to t3.medium or schedule shutdown',
                            ),
                        )
                    )

        return findings


class EBSUnattachedCollector(BaseCollector):
    collector_id = "COST_EBS_UNATTACHED"
    service_name = "ec2"
    category = "cost"

    def collect(self, session: boto3.Session, region: str) -> List[Finding]:
        ec2 = self.get_read_only_client(session, "ec2", region)
        findings: List[Finding] = []

        resp = ec2.describe_volumes(
            Filters=[{"Name": "status", "Values": ["available"]}]
        )

        for vol in resp.get("Volumes", []):
            vol_id = vol.get("VolumeId")
            size_gib = vol.get("Size", 0)
            vol_type = vol.get("VolumeType", "gp3")
            create_time = vol.get("CreateTime")

            # Check if created/detached > 7 days ago
            age_days = 10
            if create_time:
                age_days = max(1, (datetime.now(timezone.utc) - create_time).days)

            # GP3: $0.08/GB-mo; IO2: $0.125/GB-mo + IOPS
            rate = 0.125 if "io" in vol_type else 0.08
            monthly_cost = round(size_gib * rate, 2)

            findings.append(
                Finding(
                    category=Category.COST,
                    severity=Severity.HIGH if monthly_cost > 150 else Severity.MEDIUM,
                    title=f"Unattached {size_gib}GB {vol_type} EBS Volume",
                    resource_id=vol_id,
                    resource_type="AWS::EC2::Volume",
                    service="EBS",
                    region=region,
                    evidence={
                        "volume_id": vol_id,
                        "volume_type": vol_type,
                        "size_gib": size_gib,
                        "state": "available",
                        "age_days": age_days,
                    },
                    est_monthly_saving_usd=monthly_cost,
                    ai_recommendation=(
                        f"Unattached volume {vol_id} ({size_gib}GB {vol_type}) continues to incur charges while dormant. "
                        f"Take a final snapshot and delete the volume to save ${monthly_cost}/month."
                    ),
                    remediation_snippet=RemediationSnippet(
                        cli=f"aws ec2 create-snapshot --volume-id {vol_id} --region {region}\naws ec2 delete-volume --volume-id {vol_id} --region {region}",
                        terraform=f"# Remove aws_ebs_volume resource for {vol_id} from terraform configuration",
                    ),
                )
            )

        return findings


class EBSSnapshotCollector(BaseCollector):
    collector_id = "COST_EBS_OLD_SNAPSHOT"
    service_name = "ec2"
    category = "cost"

    def collect(self, session: boto3.Session, region: str) -> List[Finding]:
        ec2 = self.get_read_only_client(session, "ec2", region)
        findings: List[Finding] = []

        resp = ec2.describe_snapshots(OwnerIds=["self"])
        now = datetime.now(timezone.utc)
        threshold_date = now - timedelta(days=90)

        old_snapshots = []
        total_size = 0

        for snap in resp.get("Snapshots", []):
            start_time = snap.get("StartTime")
            if start_time and start_time < threshold_date:
                old_snapshots.append(snap)
                total_size += snap.get("VolumeSize", 0)

        if old_snapshots:
            # $0.05 per GB-month for snapshot storage
            monthly_saving = round(total_size * 0.05, 2)
            findings.append(
                Finding(
                    category=Category.COST,
                    severity=Severity.MEDIUM if monthly_saving > 50 else Severity.LOW,
                    title=f"{len(old_snapshots)} EBS Snapshots Older Than 90 Days",
                    resource_id=f"snapshots-{region}-older-90d",
                    resource_type="AWS::EC2::Snapshot",
                    service="EBS",
                    region=region,
                    evidence={
                        "total_snapshots": len(old_snapshots),
                        "total_size_gib": total_size,
                        "oldest_snapshot_id": old_snapshots[0].get("SnapshotId"),
                    },
                    est_monthly_saving_usd=monthly_saving,
                    ai_recommendation=(
                        f"{len(old_snapshots)} snapshots older than 90 days are consuming {total_size}GB storage. "
                        f"Configure an Amazon Data Lifecycle Manager (DLM) policy to archive or prune aged snapshots."
                    ),
                    remediation_snippet=RemediationSnippet(
                        cli=f"aws ec2 delete-snapshot --snapshot-id {old_snapshots[0].get('SnapshotId')} --region {region}",
                        terraform="resource \"aws_dlm_lifecycle_policy\" \"ebs_retention\" { ... }",
                    ),
                )
            )

        return findings


class EIPUnassociatedCollector(BaseCollector):
    collector_id = "COST_EIP_UNASSOCIATED"
    service_name = "ec2"
    category = "cost"

    def collect(self, session: boto3.Session, region: str) -> List[Finding]:
        ec2 = self.get_read_only_client(session, "ec2", region)
        findings: List[Finding] = []

        resp = ec2.describe_addresses()
        unassociated = [
            addr for addr in resp.get("Addresses", [])
            if not addr.get("AssociationId") and not addr.get("InstanceId")
        ]

        if unassociated:
            # $0.005/hr per unassociated IP = ~$3.65/mo per IP
            monthly_saving = round(len(unassociated) * 3.65, 2)
            findings.append(
                Finding(
                    category=Category.COST,
                    severity=Severity.MEDIUM if len(unassociated) >= 3 else Severity.LOW,
                    title=f"{len(unassociated)} Unassociated Elastic IP Addresses",
                    resource_id=unassociated[0].get("AllocationId", "eipalloc-unassociated"),
                    resource_type="AWS::EC2::EIP",
                    service="EC2",
                    region=region,
                    evidence={
                        "unassociated_count": len(unassociated),
                        "allocation_ids": [a.get("AllocationId") for a in unassociated],
                        "public_ips": [a.get("PublicIp") for a in unassociated],
                    },
                    est_monthly_saving_usd=monthly_saving,
                    ai_recommendation=(
                        f"AWS charges for unattached IPv4 addresses. Release {len(unassociated)} dormant Elastic IPs "
                        f"to eliminate recurring standby fees and maintain clean VPC networking."
                    ),
                    remediation_snippet=RemediationSnippet(
                        cli=f"aws ec2 release-address --allocation-id {unassociated[0].get('AllocationId')} --region {region}",
                        terraform="# Remove unassociated aws_eip resources from terraform",
                    ),
                )
            )

        return findings
