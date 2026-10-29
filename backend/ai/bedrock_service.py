import json
import logging
import os
from typing import Any, Dict, Optional
import boto3

logger = logging.getLogger("cloudguard.bedrock")

DEFAULT_MODEL_ID = os.getenv(
    "BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0"
)
GUARDRAIL_ID = os.getenv("BEDROCK_GUARDRAIL_ID", "")
GUARDRAIL_VERSION = os.getenv("BEDROCK_GUARDRAIL_VERSION", "DRAFT")


class BedrockExplainerService:
    """Generates concise, plain-English <=60-word remediation recommendations via Bedrock Claude."""

    def __init__(self, session: Optional[boto3.Session] = None, region: str = "us-east-1"):
        self.session = session or boto3.Session()
        self.region = region
        self.client = None
        try:
            self.client = self.session.client("bedrock-runtime", region_name=self.region)
        except Exception as e:
            logger.warning(f"Could not initialize bedrock-runtime client: {e}")

    def generate_recommendation(
        self,
        title: str,
        category: str,
        severity: str,
        resource_id: str,
        evidence: Dict[str, Any],
        est_monthly_saving_usd: float = 0.0,
    ) -> str:
        """
        Generate <= 60-word actionable advice for a specific finding.
        Uses Bedrock Claude 3.5 Sonnet if available, or returns high-quality fallback.
        """
        prompt = (
            f"You are CloudGuard AI, an expert AWS security and FinOps advisor.\n"
            f"Provide an actionable, plain-English recommendation for the following finding in AT MOST 60 WORDS.\n"
            f"Explain what is wrong, why it matters, and the exact immediate action to take.\n"
            f"Finding: {title}\n"
            f"Category: {category}\n"
            f"Severity: {severity}\n"
            f"Resource: {resource_id}\n"
            f"Evidence: {json.dumps(evidence)}\n"
            f"Potential Saving: ${est_monthly_saving_usd}/mo\n"
        )

        if not self.client:
            return self._fallback_recommendation(title, category, est_monthly_saving_usd)

        try:
            body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 120,
                "temperature": 0.2,
                "messages": [{"role": "user", "content": prompt}],
            }

            kwargs = {
                "modelId": DEFAULT_MODEL_ID,
                "contentType": "application/json",
                "accept": "application/json",
                "body": json.dumps(body),
            }

            if GUARDRAIL_ID:
                kwargs["guardrailIdentifier"] = GUARDRAIL_ID
                kwargs["guardrailVersion"] = GUARDRAIL_VERSION

            response = self.client.invoke_model(**kwargs)
            res_body = json.loads(response["body"].read().decode("utf-8"))
            content = res_body.get("content", [{}])[0].get("text", "")
            return content.strip()
        except Exception as e:
            logger.warning(f"Bedrock invocation failed ({e}). Using deterministic fallback.")
            return self._fallback_recommendation(title, category, est_monthly_saving_usd)

    def _fallback_recommendation(self, title: str, category: str, saving: float) -> str:
        """Deterministic high-quality fallback advice adhering strictly to <= 60 words."""
        if category == "cost":
            return (
                f"{title}. This resource incurs recurring AWS charges without productive utilization. "
                f"Decommission or downsize this asset immediately to eliminate wasteful spend and recover "
                f"${saving:.0f}/month."
            )
        else:
            return (
                f"{title}. Unrestricted access or missing access controls expose your account to lateral movement "
                f"and automated credential stuffing. Restrict CIDR ingress or enforce MFA immediately."
            )
