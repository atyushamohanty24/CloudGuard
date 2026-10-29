from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import uuid


class Category(str, Enum):
    COST = "cost"
    SECURITY = "security"


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class FindingStatus(str, Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class RemediationSnippet(BaseModel):
    cli: str
    terraform: str
    console_url: Optional[str] = None


class Finding(BaseModel):
    id: str = Field(default_factory=lambda: f"cg-f-{uuid.uuid4().hex[:8]}")
    category: Category
    severity: Severity
    title: str
    resource_id: str
    resource_type: str
    service: str
    region: str
    evidence: Dict[str, Any]
    est_monthly_saving_usd: float = 0.0
    status: FindingStatus = FindingStatus.OPEN
    first_seen: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    last_seen: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    ai_recommendation: str = ""
    remediation_snippet: RemediationSnippet

    def to_dynamodb_item(self) -> Dict[str, Any]:
        """Convert finding model to DynamoDB serialized dictionary."""
        return {
            "id": self.id,
            "category": self.category.value,
            "severity": self.severity.value,
            "title": self.title,
            "resource_id": self.resource_id,
            "resource_type": self.resource_type,
            "service": self.service,
            "region": self.region,
            "evidence": self.evidence,
            "est_monthly_saving_usd": str(self.est_monthly_saving_usd),
            "status": self.status.value,
            "first_seen": self.first_seen,
            "last_seen": self.last_seen,
            "ai_recommendation": self.ai_recommendation,
            "remediation_cli": self.remediation_snippet.cli,
            "remediation_tf": self.remediation_snippet.terraform,
        }


class CostDataPoint(BaseModel):
    month: str
    total_spend: float
    ec2_spend: float
    ebs_spend: float
    s3_spend: float
    rds_spend: float
    other_spend: float
    potential_savings: float
    anomaly: Optional[Dict[str, Any]] = None


class PostureScore(BaseModel):
    security_score: int
    cost_score: int
    overall_score: int
    trend_vs_last_month: int
    ai_headline: str


class SummaryMetrics(BaseModel):
    posture: PostureScore
    total_monthly_waste: float
    total_projected_annual_waste: float
    open_critical_count: int
    open_high_count: int
    open_medium_count: int
    open_low_count: int
    total_findings_count: int
    resolved_findings_count: int
    total_resources_scanned: int
    active_regions: List[str]
    last_scan_time: str
