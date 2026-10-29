import json
import boto3
from moto import mock_aws
from api.handler import lambda_handler


def test_api_get_root():
    event = {
        "httpMethod": "GET",
        "rawPath": "/",
    }
    resp = lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["status"] == "online"
    assert "endpoints" in body


def test_api_options_preflight():
    event = {
        "httpMethod": "OPTIONS",
        "rawPath": "/summary",
    }
    resp = lambda_handler(event, None)
    assert resp["statusCode"] == 200
    assert "Access-Control-Allow-Origin" in resp["headers"]


def test_api_get_health():
    event = {
        "httpMethod": "GET",
        "rawPath": "/health",
    }
    resp = lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["status"] == "healthy"


def test_api_get_summary():
    event = {
        "httpMethod": "GET",
        "rawPath": "/summary",
    }
    resp = lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert "posture" in body
    assert body["posture"]["overall_score"] > 0
    assert "total_monthly_waste" in body


def test_api_get_findings_empty():
    event = {
        "httpMethod": "GET",
        "rawPath": "/findings",
    }
    resp = lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert "findings" in body
    assert isinstance(body["findings"], list)


def test_api_get_finding_by_id_with_dynamodb(session):
    dynamodb = session.resource("dynamodb", region_name="us-east-1")
    table = dynamodb.create_table(
        TableName="cloudguard_findings",
        KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )
    table.put_item(
        Item={
            "id": "find-test-1",
            "title": "Open Port 22 SSH",
            "category": "security",
            "severity": "critical",
        }
    )

    # Test get all findings
    event_all = {
        "httpMethod": "GET",
        "rawPath": "/findings",
    }
    resp_all = lambda_handler(event_all, None)
    assert resp_all["statusCode"] == 200
    body_all = json.loads(resp_all["body"])
    assert body_all["count"] >= 1

    # Test get finding by ID (found)
    event_id = {
        "httpMethod": "GET",
        "rawPath": "/findings/find-test-1",
    }
    resp_id = lambda_handler(event_id, None)
    assert resp_id["statusCode"] == 200
    body_id = json.loads(resp_id["body"])
    assert body_id["id"] == "find-test-1"

    # Test get finding by ID (not found)
    event_404 = {
        "httpMethod": "GET",
        "rawPath": "/findings/non-existent-id",
    }
    resp_404 = lambda_handler(event_404, None)
    assert resp_404["statusCode"] == 404


def test_api_get_costs_trend():
    event = {
        "httpMethod": "GET",
        "rawPath": "/costs/trend",
    }
    resp = lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert "cost_trend" in body
    assert len(body["cost_trend"]) > 0


def test_api_post_chat():
    event = {
        "httpMethod": "POST",
        "rawPath": "/chat",
        "body": json.dumps({"query": "What are my top security risks?"}),
    }
    resp = lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert "content" in body
    assert "citations" in body


def test_api_post_scan():
    event = {
        "httpMethod": "POST",
        "rawPath": "/scan",
    }
    resp = lambda_handler(event, None)
    assert resp["statusCode"] == 202
    body = json.loads(resp["body"])
    assert body["status"] == "ACCEPTED"


def test_api_not_found():
    event = {
        "httpMethod": "GET",
        "rawPath": "/non-existent",
    }
    resp = lambda_handler(event, None)
    assert resp["statusCode"] == 404
