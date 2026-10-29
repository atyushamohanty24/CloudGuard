import json
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
