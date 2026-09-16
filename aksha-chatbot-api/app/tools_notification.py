"""Notification tools — Phase 1, green, read-only. Never sends mail — the
agent must distinguish 'configured recipient' from 'confirmed delivery',
per Section 1.2, since delivery-confirmation logs don't exist yet."""

from pydantic import BaseModel, Field

from app.node_client import NodeApiError, get, quote_path_segment
from app.tool_registry import ToolSpec, register_tool


def _strip_secrets(value):
    """Recursively drop any 'bot_token' key, at any nesting depth. Found live
    2026-09-04, same shape as node_client.py's Rtsp_Link redaction: the
    Telegram integration token is currently an empty string in this
    deployment, but the instant someone configures a bot it becomes a real
    credential flowing straight through get_notification_config /
    get_group_notification into the LLM's context. /api/email_notification
    carries it top-level; /api/notification/group/:id nests it under
    config.telegram.bot_token — recursing rather than hardcoding one path
    covers both without relying on remembering the exact shape."""
    if isinstance(value, dict):
        return {k: _strip_secrets(v) for k, v in value.items() if k != "bot_token"}
    if isinstance(value, list):
        return [_strip_secrets(v) for v in value]
    return value


class GetNotificationConfigInput(BaseModel):
    pass


def _get_notification_config(_: GetNotificationConfigInput) -> dict:
    try:
        return _strip_secrets(get("/api/email_notification"))
    except NodeApiError as e:
        # Confirmed live 2026-08-25: this route 404s with "No notification
        # configuration found" when no config doc has been saved yet — a
        # legitimate empty state (nothing configured), not a broken request.
        if e.error_code == "NOT_FOUND":
            return {"configured": False}
        raise


class GetGroupNotificationInput(BaseModel):
    group_id: str = Field(description="Camera group id or name, exactly as given by the operator.")


def _get_group_notification(params: GetGroupNotificationInput) -> dict:
    try:
        return _strip_secrets(get(f"/api/notification/group/{quote_path_segment(params.group_id)}"))
    except NodeApiError as e:
        # This tool cannot tell "this group exists but has no notification
        # config" apart from "no group by this id/name exists at all" — the
        # endpoint 404s identically either way, and this agent has no tool to
        # cross-check camera_operations' group list. Found live 2026-08-25
        # (Section 9f): the formatter previously phrased this as
        # "notifications are disabled", which asserts the group exists when
        # it might not. Also confirmed live 2026-08-29: passing a camera
        # group NAME (e.g. "Warehouse-A") instead of its real Mongo ObjectId
        # gets a distinct real error, "Invalid group ID" (400/VALIDATION) —
        # the endpoint requires an actual ObjectId and never resolves names
        # itself. Both cases collapse to the same honest "can't tell" answer
        # via the `note` field, so the formatter has to acknowledge the
        # ambiguity instead of picking one reading.
        if e.error_code == "NOT_FOUND" or (e.error_code == "VALIDATION" and "invalid group id" in e.message.lower()):
            return {
                "configured": False,
                "group_id": params.group_id,
                "note": "No notification configuration was found for this identifier. This could mean the group has no notification settings configured, that no camera group by this name/id exists at all, or that this isn't the group's real ID (this endpoint requires the group's actual database ID, not its display name) — this tool cannot distinguish those. Check Camera Operations for the exact group first if unsure.",
            }
        raise


def register() -> None:
    register_tool(
        ToolSpec(
            name="get_notification_config",
            domain="notification",
            description="Get the global email notification configuration — recipients and enabled channels.",
            input_model=GetNotificationConfigInput,
            handler=_get_notification_config,
        )
    )
    register_tool(
        ToolSpec(
            name="get_group_notification",
            domain="notification",
            description="Get email/mobile/Telegram notification settings for a specific camera group by id.",
            input_model=GetGroupNotificationInput,
            handler=_get_group_notification,
        )
    )
