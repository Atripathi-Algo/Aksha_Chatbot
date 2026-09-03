"""Alert Investigation tools — Phase 1, green, basic (non-image) scope only.
Per Section 0.1a: cross-alert image correlation is Phase 2."""

from pydantic import BaseModel, Field

from app.node_client import get
from app.tool_registry import ToolSpec, register_tool


class GetRecentAlertsInput(BaseModel):
    hours: int = Field(default=24, ge=1, le=168, description="How many hours back to search.")


def _get_recent_alerts(params: GetRecentAlertsInput) -> dict:
    # The deployed backend's real route is /api/recentAlert/:hours/:camera_name
    # (a required second segment) — confirmed 2026-08-25 by black-box probing
    # against the actual running node_backend container, which does not match
    # the single-segment /recentAlert/:hours route this tool originally
    # targeted from reading AkshaV2-UIUX/backend source. "all" is the
    # wildcard for "every camera", matching what the endpoint accepts.
    alerts = get(f"/api/recentAlert/{params.hours}/all")
    return {"alerts": alerts, "window_hours": params.hours}


class GetAlertsByCameraInput(BaseModel):
    camera_name: str = Field(description="Exact camera name as configured in Aksha, e.g. 'Camera 12'.")


def _get_alerts_by_camera(params: GetAlertsByCameraInput) -> dict:
    alerts = get(f"/api/alert/{params.camera_name}")
    return {"alerts": alerts, "camera_name": params.camera_name}


def register() -> None:
    register_tool(
        ToolSpec(
            name="get_recent_alerts",
            domain="alert_investigation",
            description="Get alerts triggered within the last N hours, across all cameras.",
            input_model=GetRecentAlertsInput,
            handler=_get_recent_alerts,
        )
    )
    register_tool(
        ToolSpec(
            name="get_alerts_by_camera",
            domain="alert_investigation",
            description="Get the alert rule configuration for a specific camera by name.",
            input_model=GetAlertsByCameraInput,
            handler=_get_alerts_by_camera,
        )
    )
