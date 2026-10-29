"""
Local development server for CloudGuard AI backend API.
Emulates API Gateway HTTP API and routes requests to lambda_handler.
Zero external dependencies required (uses standard library http.server).
"""

import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.handler import lambda_handler


class CloudGuardLocalHandler(BaseHTTPRequestHandler):
    def _handle_request(self, method: str):
        parsed = urlparse(self.path)
        path = parsed.path
        query_params = {k: v[0] if len(v) == 1 else v for k, v in parse_qs(parsed.query).items()}

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else ""

        event = {
            "rawPath": path,
            "path": path,
            "httpMethod": method,
            "queryStringParameters": query_params,
            "requestContext": {
                "http": {
                    "method": method,
                    "path": path,
                }
            },
            "body": body,
        }

        response = lambda_handler(event, None)
        status_code = response.get("statusCode", 200)
        headers = response.get("headers", {})
        resp_body = response.get("body", "")

        self.send_response(status_code)
        for k, v in headers.items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(resp_body.encode("utf-8"))

    def do_GET(self):
        self._handle_request("GET")

    def do_POST(self):
        self._handle_request("POST")

    def do_OPTIONS(self):
        self._handle_request("OPTIONS")

    def log_message(self, format, *args):
        print(f"[API] {args[0]} - {args[1]}")


def run(port: int = 8000):
    server = HTTPServer(("0.0.0.0", port), CloudGuardLocalHandler)
    print("==================================================")
    print("  CloudGuard AI - Local Backend API Server")
    print(f"  Listening on: http://localhost:{port}")
    print("  Endpoints: /summary, /findings, /costs/trend, /chat, /scan")
    print("  Press Ctrl+C to stop.")
    print("==================================================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        server.server_close()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run(port)

