"""Live Monitoring tools — Phase 1, green. Read-only, current state only.
Socket.IO live-push is not wired up here (Section 1.2 calls it a future
adapter); this reads the same REST snapshot the frontend's monitor page
uses, so answers must be labeled accordingly by the formatter."""

from pydantic import BaseModel

from app.node_client import get
from app.tool_registry import ToolSpec, register_tool


class GetLiveCamerasInput(BaseModel):
    pass


def _get_live_cameras(_: GetLiveCamerasInput) -> dict:
    result = get("/api/active/getLiveCamera")
    return {"cameras": result.get("info", result)}


class GetSpotlightCamerasInput(BaseModel):
    pass


def _get_spotlight_cameras(_: GetSpotlightCamerasInput) -> dict:
    result = get("/api/active/getSpotlightCamera")
    return {"cameras": result.get("info", result)}


def register() -> None:
    register_tool(
        ToolSpec(
            name="get_live_cameras",
            domain="live_monitoring",
            description="Get the current live status of all cameras — a snapshot, not a real-time push.",
            input_model=GetLiveCamerasInput,
            handler=_get_live_cameras,
        )
    )
    register_tool(
        ToolSpec(
            name="get_spotlight_cameras",
            domain="live_monitoring",
            description="Get the current spotlighted/highlighted cameras shown on the monitor page.",
            input_model=GetSpotlightCamerasInput,
            handler=_get_spotlight_cameras,
        )
    )
