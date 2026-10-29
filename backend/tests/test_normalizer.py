import pytest
from normalizer.schema import Finding, Category, Severity, FindingStatus, RemediationSnippet


def test_finding_creation_and_defaults():
    finding = Finding(
        category=Category.COST,
        severity=Severity.HIGH,
        title="Idle c5.4xlarge EC2 Instance",
        resource_id="i-0123456789abcdef0",
        resource_type="AWS::EC2::Instance",
        service="EC2",
        region="us-east-1",
        evidence={"avg_cpu": 1.2},
        est_monthly_saving_usd=489.6,
        remediation_snippet=RemediationSnippet(
            cli="aws ec2 stop-instances --instance-ids i-0123456789abcdef0",
            terraform="# downsize instance",
        ),
    )

    assert finding.id.startswith("cg-f-")
    assert finding.status == FindingStatus.OPEN
    assert finding.est_monthly_saving_usd == 489.6
    assert finding.first_seen is not None


def test_finding_dynamodb_serialization():
    finding = Finding(
        category=Category.SECURITY,
        severity=Severity.CRITICAL,
        title="Open Port 22 SSH",
        resource_id="sg-12345",
        resource_type="AWS::EC2::SecurityGroup",
        service="EC2",
        region="us-east-1",
        evidence={"port": 22},
        est_monthly_saving_usd=0.0,
        remediation_snippet=RemediationSnippet(
            cli="aws ec2 revoke-security-group-ingress",
            terraform="# terraform rule",
        ),
    )

    ddb_item = finding.to_dynamodb_item()
    assert ddb_item["category"] == "security"
    assert ddb_item["severity"] == "critical"
    assert ddb_item["remediation_cli"] == "aws ec2 revoke-security-group-ingress"
    assert ddb_item["status"] == "open"
