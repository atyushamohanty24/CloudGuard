#!/usr/bin/env python3
"""
CloudGuard AI — DynamoDB Findings Seeder
Populates the CloudGuard DynamoDB findings table with sample findings across
EC2, EBS, S3, IAM, and RDS domains for testing live API Gateway integrations.
"""

import os
import sys
import boto3

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from normalizer.schema import Finding, Category, Severity, FindingStatus, RemediationSnippet

TABLE_NAME = os.getenv("DYNAMODB_FINDINGS_TABLE", "cloudguard-ai-findings-prod")
REGION = os.getenv("AWS_REGION", "us-east-1")


SAMPLE_SEED_ITEMS = [
    Finding(
        id="cg-f-001",
        category=Category.SECURITY,
        severity=Severity.CRITICAL,
        title="SSH Port 22 Open to 0.0.0.0/0 on Bastion Security Group",
        resource_id="sg-04a91f82c310b14ea",
        resource_type="AWS::EC2::SecurityGroup",
        service="EC2",
        region="us-east-1",
        evidence={
            "group_name": "prod-bastion-public-sg",
            "vpc_id": "vpc-018274619a8f2",
            "ingress_port": 22,
            "cidr": "0.0.0.0/0",
        },
        est_monthly_saving_usd=0.0,
        status=FindingStatus.OPEN,
        ai_recommendation=(
            "Port 22 is globally accessible, inviting automated brute-force attacks. "
            "Immediately restrict ingress to your corporate VPN CIDR or transition access to "
            "AWS Systems Manager Session Manager, which removes open inbound ports entirely."
        ),
        remediation_snippet=RemediationSnippet(
            cli="aws ec2 revoke-security-group-ingress --group-id sg-04a91f82c310b14ea --protocol tcp --port 22 --cidr 0.0.0.0/0",
            terraform="resource \"aws_security_group_rule\" \"bastion_ssh\" {\n  # Revoke global CIDR\n}",
        ),
    ),
    Finding(
        id="cg-f-002",
        category=Category.COST,
        severity=Severity.HIGH,
        title="Idle c5.4xlarge EC2 Instance (< 2% CPU over 14 days)",
        resource_id="i-0b817f9c31c2d4e5f",
        resource_type="AWS::EC2::Instance",
        service="EC2",
        region="us-east-1",
        evidence={
            "instance_name": "analytics-worker-primary",
            "instance_type": "c5.4xlarge",
            "avg_cpu_percent": 1.84,
        },
        est_monthly_saving_usd=489.6,
        status=FindingStatus.OPEN,
        ai_recommendation=(
            "This 16-vCPU instance runs virtually idle. Downsize to c5.large for $61/month or "
            "replace with an EventBridge-triggered ECS Fargate task to eliminate idle compute spend entirely."
        ),
        remediation_snippet=RemediationSnippet(
            cli="aws ec2 stop-instances --instance-ids i-0b817f9c31c2d4e5f",
            terraform="# Modify instance_type to c5.large in terraform",
        ),
    ),
    Finding(
        id="cg-f-003",
        category=Category.SECURITY,
        severity=Severity.CRITICAL,
        title="Public S3 Bucket Exposing Raw Data Lake Backups",
        resource_id="corp-analytics-lake-backups-prod",
        resource_type="AWS::S3::Bucket",
        service="S3",
        region="us-west-2",
        evidence={
            "bucket_name": "corp-analytics-lake-backups-prod",
            "acl": "AllUsers: READ",
        },
        est_monthly_saving_usd=0.0,
        status=FindingStatus.OPEN,
        ai_recommendation=(
            "The bucket ACL grants world-readable permissions to all Internet users. "
            "Enable AWS S3 Account-level and Bucket-level Block Public Access immediately to close external read access."
        ),
        remediation_snippet=RemediationSnippet(
            cli="aws s3api put-public-access-block --bucket corp-analytics-lake-backups-prod --public-access-block-configuration \"BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true\"",
            terraform="# Set block_public_acls = true",
        ),
    ),
    Finding(
        id="cg-f-004",
        category=Category.COST,
        severity=Severity.HIGH,
        title="Unattached 2TB io2 Provisioned IOPS EBS Volume",
        resource_id="vol-0f9c2d1b7a6e4310a",
        resource_type="AWS::EC2::Volume",
        service="EBS",
        region="us-east-1",
        evidence={
            "size_gib": 2048,
            "volume_type": "io2",
            "state": "available",
            "unattached_days": 28,
        },
        est_monthly_saving_usd=778.24,
        status=FindingStatus.OPEN,
        ai_recommendation=(
            "This high-performance io2 volume was detached 28 days ago and continues to incur provisioned IOPS charges. "
            "Create a final snapshot and delete the volume to recapture $778/month immediately."
        ),
        remediation_snippet=RemediationSnippet(
            cli="aws ec2 create-snapshot --volume-id vol-0f9c2d1b7a6e4310a\naws ec2 delete-volume --volume-id vol-0f9c2d1b7a6e4310a",
            terraform="# Delete aws_ebs_volume resource",
        ),
    ),
    Finding(
        id="cg-f-005",
        category=Category.SECURITY,
        severity=Severity.CRITICAL,
        title="IAM Admin User 'devops-lead' Lacks MFA",
        resource_id="arn:aws:iam::123456789012:user/devops-lead",
        resource_type="AWS::IAM::User",
        service="IAM",
        region="global",
        evidence={
            "username": "devops-lead",
            "has_console_password": True,
            "mfa_active": False,
        },
        est_monthly_saving_usd=0.0,
        status=FindingStatus.OPEN,
        ai_recommendation=(
            "An administrative user with console login credentials lacks multi-factor authentication. "
            "Enforce virtual MFA immediately or migrate console access to AWS IAM Identity Center (SSO)."
        ),
        remediation_snippet=RemediationSnippet(
            cli="aws iam create-virtual-mfa-device --virtual-mfa-device-name devops-lead-mfa --outfile QRCode.png",
            terraform="# Enforce MFA policy in IAM group",
        ),
    ),
]


def seed_findings():
    print(f"Connecting to DynamoDB in {REGION}...")
    ddb = boto3.resource("dynamodb", region_name=REGION)
    table = ddb.Table(TABLE_NAME)

    print(f"Seeding {len(SAMPLE_SEED_ITEMS)} findings into '{TABLE_NAME}'...")
    with table.batch_writer() as batch:
        for item in SAMPLE_SEED_ITEMS:
            batch.put_item(Item=item.to_dynamodb_item())
            print(f"  + Seeded: {item.id} — {item.title}")

    print("\n✓ Successfully seeded findings table.")


if __name__ == "__main__":
    seed_findings()
