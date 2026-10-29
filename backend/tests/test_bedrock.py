from ai.bedrock_service import BedrockExplainerService
from ai.chat_assistant import CloudGuardChatAssistant


def test_bedrock_explainer_length_constraint():
    service = BedrockExplainerService()
    rec = service.generate_recommendation(
        title="Unattached 2TB io2 Provisioned IOPS EBS Volume",
        category="cost",
        severity="high",
        resource_id="vol-0f9c2d1b7a6e4310a",
        evidence={"size_gib": 2048, "iops": 10000},
        est_monthly_saving_usd=778.24,
    )

    words = rec.split()
    assert len(words) <= 60, f"Recommendation exceeded 60 words: count was {len(words)}"
    assert len(words) > 5


def test_chat_assistant_grounding_and_citations():
    assistant = CloudGuardChatAssistant()
    mock_findings = [
        {
            "id": "cg-f-001",
            "title": "SSH Port 22 Open to 0.0.0.0/0 on Bastion",
            "service": "EC2",
            "category": "security",
            "severity": "critical",
            "resource_id": "sg-04a91f82c310b14ea",
            "est_monthly_saving_usd": 0,
        },
        {
            "id": "cg-f-002",
            "title": "Idle c5.4xlarge EC2 Instance (< 2% CPU)",
            "service": "EC2",
            "category": "cost",
            "severity": "high",
            "resource_id": "i-0b817f9c31c2d4e5f",
            "est_monthly_saving_usd": 489.6,
        },
    ]

    res = assistant.answer_query(
        query="Why did my bill increase or how can I save cost?",
        findings=mock_findings,
    )

    assert "content" in res
    assert len(res["content"]) > 10
    assert "citations" in res
    assert len(res["citations"]) > 0
    # First citation should reference the cost finding
    assert any(c["id"] == "cg-f-002" for c in res["citations"])
