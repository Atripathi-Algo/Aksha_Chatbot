"""
Thin client for the existing ServiceAPI (AkshaV2-UIUX-adjacent `ServiceAPI/`),
the additional backend service on :4000 — image analysis, alert-report
analysis, per-camera insight heatmaps. Mirrors app/node_client.py's shape
(same timeout/error containment) so a future tool built on this follows the
same "never let a raw exception reach the agent" contract.

Not wired into any tool yet — this is connectivity groundwork only. Several
ServiceAPI routes (/Surveillance, /DockerClean, /Notifications) run shell
commands that start/stop containers and MUST NOT be exposed to the chatbot;
only read/analysis routes (/ImageAnalysis, /AlertReportAnalyzer, /Insight)
are candidates for a future tool, and each needs its own scoping decision
before that happens.
"""

import os

import httpx

from app.logging_config import get_logger

logger = get_logger(component="service_api_client")

SERVICE_API_BASE_URL = os.getenv("SERVICE_API_BASE_URL", "http://localhost:4000")
TIMEOUT_SECONDS = float(os.getenv("SERVICE_API_TIMEOUT_SECONDS", "15"))  # image analysis is slower than a plain data lookup

# Mirrors app/node_client.py's shared-client reasoning — reuse the pooled
# connection across calls instead of opening a fresh one each time.
_CLIENT = httpx.Client(timeout=TIMEOUT_SECONDS)


class ServiceApiError(Exception):
    def __init__(self, error_code: str, message: str, retryable: bool = False):
        self.error_code = error_code
        self.message = message
        self.retryable = retryable
        super().__init__(message)


def _handle_response(resp: httpx.Response, url: str) -> dict:
    if resp.status_code >= 500:
        logger.warning("service_api_server_error", url=url, status=resp.status_code)
        raise ServiceApiError("DEPENDENCY_FAILURE", f"ServiceAPI returned {resp.status_code}.", retryable=True)
    if resp.status_code >= 400:
        logger.info("service_api_client_error", url=url, status=resp.status_code)
        raise ServiceApiError("VALIDATION", resp.text[:300], retryable=False)
    try:
        return resp.json()
    except ValueError as e:
        raise ServiceApiError("DEPENDENCY_FAILURE", "ServiceAPI returned a non-JSON response.", retryable=False) from e


def post(path: str, json_body: dict) -> dict:
    url = f"{SERVICE_API_BASE_URL}{path}"
    try:
        resp = _CLIENT.post(url, json=json_body)
    except httpx.ConnectError as e:
        logger.warning("service_api_unreachable", url=url, error=str(e))
        raise ServiceApiError("SERVICE_UNAVAILABLE", "ServiceAPI is not reachable right now.", retryable=True) from e
    except httpx.TimeoutException as e:
        logger.warning("service_api_timeout", url=url, error=str(e))
        raise ServiceApiError("TIMEOUT", "ServiceAPI did not respond in time.", retryable=True) from e
    return _handle_response(resp, url)
