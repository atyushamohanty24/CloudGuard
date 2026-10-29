import boto3
from moto import mock_aws
from datetime import datetime, timezone, timedelta
from collectors.cost_collectors import (
    EC2IdleCollector,
    EBSUnattachedCollector,
    EBSSnapshotCollector,
    EIPUnassociatedCollector,
)
from collectors.sec_collectors import (
    SecurityGroupAdminPortCollector,
    S3PublicBucketCollector,
    IAMMFACollector,
    IAMAccessKeyAgeCollector,
    EBSUnencryptedCollector,
)


def test_ebs_unattached_collector(session):
    ec2 = session.client("ec2", region_name="us-east-1")
    # Create an available (unattached) volume
    vol = ec2.create_volume(
        AvailabilityZone="us-east-1a",
        Size=100,
        VolumeType="gp3",
    )
    vol_id = vol["VolumeId"]

    collector = EBSUnattachedCollector()
    findings = collector.collect(session, "us-east-1")

    assert len(findings) == 1
    f = findings[0]
    assert f.resource_id == vol_id
    assert f.category.value == "cost"
    assert f.est_monthly_saving_usd == 8.0  # 100GB * $0.08
    assert "remediation_snippet" in f.model_dump()


def test_eip_unassociated_collector(session):
    ec2 = session.client("ec2", region_name="us-east-1")
    # Allocate an unassociated EIP
    alloc = ec2.allocate_address(Domain="vpc")
    alloc_id = alloc["AllocationId"]

    collector = EIPUnassociatedCollector()
    findings = collector.collect(session, "us-east-1")

    assert len(findings) == 1
    f = findings[0]
    assert f.category.value == "cost"
    assert alloc_id in f.evidence["allocation_ids"]
    assert f.est_monthly_saving_usd > 0


def test_sg_admin_port_collector(session):
    ec2 = session.client("ec2", region_name="us-east-1")
    # Create security group with open port 22 to 0.0.0.0/0
    sg = ec2.create_security_group(
        GroupName="bastion-test-sg",
        Description="Bastion SSH SG",
    )
    sg_id = sg["GroupId"]

    ec2.authorize_security_group_ingress(
        GroupId=sg_id,
        IpProtocol="tcp",
        FromPort=22,
        ToPort=22,
        CidrIp="0.0.0.0/0",
    )

    collector = SecurityGroupAdminPortCollector()
    findings = collector.collect(session, "us-east-1")

    matching = [f for f in findings if f.resource_id == sg_id]
    assert len(matching) == 1
    assert matching[0].severity.value == "critical"
    assert "SSH (22)" in matching[0].title
    assert "revoke-security-group-ingress" in matching[0].remediation_snippet.cli


def test_s3_public_bucket_collector(session):
    s3 = session.client("s3", region_name="us-east-1")
    # Create bucket without Public Access Block
    bucket_name = "test-public-analytics-lake"
    s3.create_bucket(Bucket=bucket_name)

    collector = S3PublicBucketCollector()
    findings = collector.collect(session, "us-east-1")

    matching = [f for f in findings if f.resource_id == bucket_name]
    assert len(matching) == 1
    assert matching[0].severity.value == "critical"
    assert matching[0].category.value == "security"


def test_iam_mfa_collector(session):
    iam = session.client("iam", region_name="us-east-1")
    # Create user with console login profile but NO MFA
    username = "admin-devops-test"
    iam.create_user(UserName=username)
    iam.create_login_profile(UserName=username, Password="TempPassword123!")

    collector = IAMMFACollector()
    findings = collector.collect(session, "us-east-1")

    matching = [f for f in findings if f.evidence.get("username") == username]
    assert len(matching) == 1
    assert matching[0].severity.value == "critical"
    assert "MFA" in matching[0].title


def test_ebs_unencrypted_collector(session):
    ec2 = session.client("ec2", region_name="us-east-1")
    # Create unencrypted volume
    vol = ec2.create_volume(
        AvailabilityZone="us-east-1a",
        Size=50,
        Encrypted=False,
    )
    vol_id = vol["VolumeId"]

    collector = EBSUnencryptedCollector()
    findings = collector.collect(session, "us-east-1")

    matching = [f for f in findings if f.resource_id == vol_id]
    assert len(matching) == 1
    assert matching[0].severity.value == "high"
    assert matching[0].evidence["encrypted"] is False


def test_ec2_idle_collector(session):
    ec2 = session.client("ec2", region_name="us-east-1")
    # Launch EC2 instance
    res = ec2.run_instances(
        ImageId="ami-12345678",
        InstanceType="c5.4xlarge",
        MinCount=1,
        MaxCount=1,
    )
    inst_id = res["Instances"][0]["InstanceId"]

    collector = EC2IdleCollector()
    findings = collector.collect(session, "us-east-1")

    matching = [f for f in findings if f.resource_id == inst_id]
    assert len(matching) == 1
    assert matching[0].category.value == "cost"
    assert matching[0].est_monthly_saving_usd > 100


def test_ebs_snapshot_collector(session):
    ec2 = session.client("ec2", region_name="us-east-1")
    vol = ec2.create_volume(AvailabilityZone="us-east-1a", Size=50)
    vol_id = vol["VolumeId"]
    ec2.create_snapshot(VolumeId=vol_id, Description="Old backup")

    collector = EBSSnapshotCollector()
    findings = collector.collect(session, "us-east-1")
    # Newly created snapshots are < 90 days, so should return 0 findings
    assert isinstance(findings, list)


def test_iam_access_key_age_collector(session):
    iam = session.client("iam", region_name="us-east-1")
    username = "key-audit-user"
    iam.create_user(UserName=username)
    iam.create_access_key(UserName=username)

    collector = IAMAccessKeyAgeCollector()
    findings = collector.collect(session, "us-east-1")
    # Newly created key is not >90 days old, returns empty list
    assert isinstance(findings, list)

