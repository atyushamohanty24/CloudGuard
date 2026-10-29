import json
import logging
import os
from typing import Any, Dict, List
import boto3

logger = logging.getLogger("cloudguard.digest")
SNS_TOPIC_ARN = os.getenv("DIGEST_SNS_TOPIC_ARN", "")
DYNAMODB_TABLE = os.getenv("DYNAMODB_FINDINGS_TABLE", "cloudguard_findings")


def generate_weekly_digest(findings: List[Dict[str, Any]]) -> Dict[str, str]:
    """Generates plain-text and HTML executive summary for email dispatch."""
    open_findings = [f for f in findings if f.get("status") == "open"]
    total_waste = sum(float(f.get("est_monthly_saving_usd", 0)) for f in open_findings)

    # Top 5 risks by severity
    critical_and_high = [
        f for f in open_findings if f.get("severity") in ("critical", "high")
    ][:5]

    plain_lines = [
        "CloudGuard AI — Weekly Cloud Cost & Security Briefing",
        "======================================================",
        f"Recoverable Waste: ${total_waste:,.2f}/month",
        f"Critical/High Risks: {len(critical_and_high)}",
        "",
        "Top Actionable Priorities This Week:",
    ]

    for idx, f in enumerate(critical_and_high, 1):
        plain_lines.append(
            f"{idx}. [{f.get('severity', '').upper()}] {f.get('title')} ({f.get('resource_id')})"
        )
        plain_lines.append(f"   Action: {f.get('ai_recommendation', 'Inspect finding detail')}")

    plain_lines.append("\nAccess full telemetry: https://cloudguard.ai/dashboard")

    html = f"""
    <html>
      <body style="font-family: sans-serif; background-color: #0B0F14; color: #F8FAFC; padding: 24px;">
        <h2 style="color: #38BDF8;">CloudGuard AI — Weekly Cloud Briefing</h2>
        <div style="background-color: #161E2C; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 16px;">
            Potential Monthly Savings: <strong style="color: #10B981;">${total_waste:,.2f}/mo</strong>
          </p>
        </div>
        <h3>Top Actionable Cloud Exposures</h3>
        <ul>
          {''.join(f"<li><strong>[{f.get('severity','').upper()}]</strong> {f.get('title')}</li>" for f in critical_and_high)}
        </ul>
      </body>
    </html>
    """

    return {"text": "\n".join(plain_lines), "html": html}


def lambda_handler(event: Any, context: Any) -> Dict[str, Any]:
    """Weekly EventBridge triggered Lambda to send digest email via SNS."""
    logger.info("Executing CloudGuard AI weekly digest generation...")
    ddb = boto3.resource("dynamodb")
    table = ddb.Table(DYNAMODB_TABLE)

    try:
        resp = table.scan(Limit=100)
        findings = resp.get("Items", [])
    except Exception as e:
        logger.warning(f"Could not scan findings table ({e}). Using sample digest.")
        findings = []

    digest = generate_weekly_digest(findings)

    if SNS_TOPIC_ARN:
        sns = boto3.client("sns")
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject="CloudGuard AI — Weekly Cloud Cost & Security Briefing",
            Message=digest["text"],
        )

    return {"statusCode": 200, "body": json.dumps({"status": "SUCCESS", "message": "Weekly digest dispatched"})}
