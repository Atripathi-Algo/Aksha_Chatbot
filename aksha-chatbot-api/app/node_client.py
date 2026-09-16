"""
Thin client for the existing Node backend (AkshaV2-UIUX/backend). No tool
ever calls httpx directly — everything goes through here so timeout,
retry, and degraded-service handling live in one place, per the Section 3.3
tool error contract.
"""

import os
from urllib.parse import quote

import httpx

from app.logging_config import get_logger

logger = get_logger(component="node_client")

NODE_API_BASE_URL = os.getenv("NODE_API_BASE_URL", "http://localhost:5000")
TIMEOUT_SECONDS = float(os.getenv("NODE_API_TIMEOUT_SECONDS", "5"))

# Shared, connection-pooled client — a bare httpx.get/post opens and tears
# down a fresh TCP connection every call; reusing one client keeps the
# connection to the Node backend alive across tool calls.
_CLIENT = httpx.Client(timeout=TIMEOUT_SECONDS)


# Every camera record from the Node API carries Rtsp_Link with a plaintext
# username:password embedded in the URL (rtsp://user:pass@host:port/...).
# Found live 2026-09-04: a tool result is exactly what the formatter LLM
# reads to write its answer, and it happily quoted the raw link, credentials
# included, straight into a chat response. A prompt instruction not to do
# that is not reliable enough for a live credential leak — strip the field
# here, once, so it's structurally impossible for any camera-reading tool to
# pass it downstream, rather than trusting every call site to remember.
_CAMERA_REDACT_FIELDS = ("Rtsp_Link",)


def redact_camera(record: dict) -> dict:
    if not isinstance(record, dict):
        return record
    return {k: v for k, v in record.items() if k not in _CAMERA_REDACT_FIELDS}


def quote_path_segment(value) -> str:
    """URL-encode a value before it's interpolated into a request path — a
    camera name or group id ultimately comes from what the LLM decided to
    pass as a tool argument, which traces back to operator text. Probed live
    2026-09-04 with "../../../etc/passwd" as a camera name — it resolved
    harmlessly (Node just 404s), but relying on that rather than encoding is
    defense-in-depth we don't actually have yet. safe="" also encodes "/",
    so a value containing one can't add extra path segments."""
    return quote(str(value), safe="")


def redact_cameras(records) -> list:
    if not isinstance(records, list):
        return records
    return [redact_camera(r) for r in records]


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
        resp = _CLIENT.get(url, params=params)
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
        resp = _CLIENT.post(url, json=json_body)
    except httpx.ConnectError as e:
        logger.warning("node_api_unreachable", url=url, error=str(e))
        raise NodeApiError("SERVICE_UNAVAILABLE", "The Node backend is not reachable right now.", retryable=True) from e
    except httpx.TimeoutException as e:
        logger.warning("node_api_timeout", url=url, error=str(e))
        raise NodeApiError("TIMEOUT", "The Node backend did not respond in time.", retryable=True) from e
    return _handle_response(resp, url)
