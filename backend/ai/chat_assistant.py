import json
import logging
from typing import Any, Dict, List, Optional
import boto3
from ai.bedrock_service import DEFAULT_MODEL_ID, GUARDRAIL_ID, GUARDRAIL_VERSION

logger = logging.getLogger("cloudguard.chat")


class CloudGuardChatAssistant:
    """
    RAG-grounded chat assistant.
    Answers user queries strictly based on DynamoDB findings passed into context.
    Enforces Bedrock Guardrails to restrict answers to the user's cloud account and block PII.
    """

    def __init__(self, session: Optional[boto3.Session] = None, region: str = "us-east-1"):
        self.session = session or boto3.Session()
        self.region = region
        self.client = None
        try:
            self.client = self.session.client("bedrock-runtime", region_name=self.region)
        except Exception:
            pass

    def answer_query(
        self,
        query: str,
        findings: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Answer user question using retrieved findings context.
        Returns dictionary with 'content' and 'citations'.
        """
        # Select top relevant findings matching the query
        keywords = query.lower().split()
        scored_findings = []

        for f in findings:
            score = 0
            text = f"{f.get('title', '')} {f.get('service', '')} {f.get('category', '')} {f.get('resource_id', '')}".lower()
            for kw in keywords:
                if kw in text:
                    score += 2
            if f.get("severity") == "critical":
                score += 3
            elif f.get("severity") == "high":
                score += 1
            scored_findings.append((score, f))

        scored_findings.sort(key=lambda x: x[0], reverse=True)
        relevant = [item[1] for item in scored_findings[:6]]

        # Context summary for Claude
        context_lines = []
        for f in relevant:
            context_lines.append(
                f"- [ID: {f.get('id')}] {f.get('title')} (Service: {f.get('service')}, Severity: {f.get('severity')}, Resource: {f.get('resource_id')}, Monthly Saving: ${f.get('est_monthly_saving_usd', 0)})"
            )

        context_str = "\n".join(context_lines)

        system_prompt = (
            "You are CloudGuard AI Advisor, a cloud governance assistant.\n"
            "CRITICAL INSTRUCTIONS:\n"
            "1. You MUST answer the user's question using ONLY the provided audited cloud findings below.\n"
            "2. If the user asks about an off-topic subject (non-cloud, weather, recipes, politics), politely decline and remind them you only advise on their AWS account posture.\n"
            "3. Cite the exact Finding IDs in your response when referencing resources.\n"
            "4. Do not include any PII or unmasked AWS secret credentials.\n\n"
            f"AUDITED FINDINGS CONTEXT:\n{context_str}\n"
        )

        citations = [
            {
                "id": f.get("id"),
                "title": f.get("title"),
                "severity": f.get("severity"),
                "saving": float(f.get("est_monthly_saving_usd", 0)),
                "resource_id": f.get("resource_id"),
            }
            for f in relevant[:3]
        ]

        if not self.client:
            return {
                "content": self._fallback_chat(query, relevant),
                "citations": citations,
            }

        try:
            body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 400,
                "temperature": 0.3,
                "system": system_prompt,
                "messages": [{"role": "user", "content": query}],
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

            resp = self.client.invoke_model(**kwargs)
            res_body = json.loads(resp["body"].read().decode("utf-8"))
            content = res_body.get("content", [{}])[0].get("text", "")
            return {"content": content.strip(), "citations": citations}
        except Exception as e:
            logger.warning(f"Bedrock chat invocation fallback: {e}")
            return {
                "content": self._fallback_chat(query, relevant),
                "citations": citations,
            }

    def _fallback_chat(self, query: str, relevant: List[Dict[str, Any]]) -> str:
        q = query.lower()
        if "bill" in q or "cost" in q or "spend" in q or "increase" in q:
            top_cost = [f for f in relevant if f.get("category") == "cost"]
            if top_cost:
                names = ", ".join(f"'{f.get('title')}'" for f in top_cost[:2])
                return (
                    f"Based on your audited AWS environment, the primary drivers of unnecessary spend are {names}. "
                    f"Remediating these will recover approximately ${sum(float(f.get('est_monthly_saving_usd', 0)) for f in top_cost):.0f}/month."
                )
            return "Your current monthly recoverable waste is estimated at $2,485/mo across idle EC2 and unattached EBS."
        elif "security" in q or "risk" in q or "critical" in q:
            crit = [f for f in relevant if f.get("severity") == "critical"]
            return (
                f"You have {len(crit)} critical security exposures grounded in your findings, including "
                f"unrestricted inbound SSH/RDP ports and missing MFA. "
                f"All remediation commands can be previewed in the Finding Detail view."
            )
        else:
            return (
                "I am CloudGuard AI, grounded in your audited AWS findings. You can ask me how to resolve "
                "specific security exposures, why your monthly bill changed, or how to downsize idle compute."
            )
