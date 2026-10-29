from digest.weekly_digest import generate_weekly_digest, lambda_handler


def test_generate_weekly_digest():
    mock_findings = [
        {
            "id": "cg-1",
            "title": "Open Bastion SSH",
            "severity": "critical",
            "status": "open",
            "resource_id": "sg-12345",
            "ai_recommendation": "Restrict CIDR",
            "est_monthly_saving_usd": 0.0,
        },
        {
            "id": "cg-2",
            "title": "Unattached EBS",
            "severity": "high",
            "status": "open",
            "resource_id": "vol-99999",
            "ai_recommendation": "Delete volume",
            "est_monthly_saving_usd": 120.0,
        },
    ]

    digest = generate_weekly_digest(mock_findings)
    assert "text" in digest
    assert "html" in digest
    assert "CloudGuard AI" in digest["text"]
    assert "$120.00" in digest["text"]
    assert "Open Bastion SSH" in digest["html"]


def test_weekly_digest_lambda_handler():
    resp = lambda_handler({}, None)
    assert resp["statusCode"] == 200
