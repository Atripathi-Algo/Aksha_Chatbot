"""
Thin client for the existing Node backend (AkshaV2-UIUX/backend). No tool
ever calls httpx directly — everything goes through here so timeout,
retry, and degraded-service handling live in one place, per the Section 3.3
tool error contract.
"""

import os

import httpx

from app.logging_config import get_logger

logger = get_logger(component="node_client")

NODE_API_BASE_URL = os.getenv("NODE_API_BASE_URL", "http://localhost:5000")
TIMEOUT_SECONDS = float(os.getenv("NODE_API_TIMEOUT_SECONDS", "5"))


class NodeApiError(Exception):
    def __init__(self, error_code: str, message: str, retryable: bool = False):
        self.error_code = error_code
        self.message = message
        self.retryable = retryable
        super().__init__(message)


def _handle_response(resp: httpx.Response, url: str) -> dict:
    if resp.status_code >= 500:
        logger.warning("node_api_server_error", url=url, status=resp.status_code)
        raise NodeApiError("DEPENDENCY_FAILURE", f"Node backend returned {resp.status_code}.", retryable=True)
    if resp.status_code >= 400:
        logger.info("node_api_client_error", url=url, status=resp.status_code)
        raise NodeApiError("NOT_FOUND" if resp.status_code == 404 else "VALIDATION", resp.text[:300], retryable=False)
    try:
        return resp.json()
    except ValueError as e:
        raise NodeApiError("DEPENDENCY_FAILURE", "Node backend returned a non-JSON response.", retryable=False) from e


def get(path: str, params: dict | None = None) -> dict:
    """GET against the Node backend. Raises NodeApiError on any failure —
    callers (tools) catch this and turn it into a ToolResult with ok=False,
    never letting a raw exception reach the agent or the user."""
    url = f"{NODE_API_BASE_URL}{path}"
    try:
        resp = httpx.get(url, params=params, timeout=TIMEOUT_SECONDS)
    except httpx.ConnectError as e:
        logger.warning("node_api_unreachable", url=url, error=str(e))
        raise NodeApiError("SERVICE_UNAVAILABLE", "The Node backend is not reachable right now.", retryable=True) from e
    except httpx.TimeoutException as e:
        logger.warning("node_api_timeout", url=url, error=str(e))
        raise NodeApiError("TIMEOUT", "The Node backend did not respond in time.", retryable=True) from e
    return _handle_response(resp, url)


def post(path: str, json_body: dict) -> dict:
    """POST against the Node backend — same error containment as get()."""
    url = f"{NODE_API_BASE_URL}{path}"
    try:
        resp = httpx.post(url, json=json_body, timeout=TIMEOUT_SECONDS)
    except httpx.ConnectError as e:
        logger.warning("node_api_unreachable", url=url, error=str(e))
        raise NodeApiError("SERVICE_UNAVAILABLE", "The Node backend is not reachable right now.", retryable=True) from e
    except httpx.TimeoutException as e:
        logger.warning("node_api_timeout", url=url, error=str(e))
        raise NodeApiError("TIMEOUT", "The Node backend did not respond in time.", retryable=True) from e
    return _handle_response(resp, url)
