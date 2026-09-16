"""Live Monitoring tools — Phase 1, green. Read-only, current state.

Was REST-snapshot only (Section 1.2 called Socket.IO push a future
adapter). Found live 2026-09-16: the real backend has no separate
online/offline "push" channel to consume instead — see app/socket_probe.py
for what was actually probed and why. Both tools now also verify, via a
brief live Socket.IO subscription, whether each camera the REST snapshot
names is actually emitting frames right now — a real freshness upgrade on
top of the snapshot, not a replacement for it, so the formatter must still
label these answers as a snapshot (Section 9's existing "Snapshot · as of
HH:MM" UI treatment applies to the whole answer, verification included)."""

from pydantic import BaseModel

from app.node_client import get, redact_cameras
from app.socket_probe import probe_streaming
from app.tool_registry import ToolSpec, register_tool


def _annotate_verified_streaming(cameras) -> list:
    """Adds a `verified_streaming` bool to each camera record: True/False
    once actually checked, absent if verification wasn't attempted (a
    malformed record, or no Camera_Name to check). Never invented — this is
    a real, just-taken measurement or nothing."""
    if not isinstance(cameras, list):
        return cameras
    names = [c.get("Camera_Name") for c in cameras if isinstance(c, dict) and c.get("Camera_Name")]
    verified = probe_streaming(names)
    for cam in cameras:
        if isinstance(cam, dict) and cam.get("Camera_Name") in verified:
            cam["verified_streaming"] = verified[cam["Camera_Name"]]
    return cameras


class GetLiveCamerasInput(BaseModel):
    pass


def _get_live_cameras(_: GetLiveCamerasInput) -> dict:
    result = get("/api/active/getLiveCamera")
    cameras = redact_cameras(result.get("info", result))
    return {"cameras": _annotate_verified_streaming(cameras)}


class GetSpotlightCamerasInput(BaseModel):
    pass


def _get_spotlight_cameras(_: GetSpotlightCamerasInput) -> dict:
    result = get("/api/active/getSpotlightCamera")
    cameras = redact_cameras(result.get("info", result))
    return {"cameras": _annotate_verified_streaming(cameras)}


def register() -> None:
    register_tool(
        ToolSpec(
            name="get_live_cameras",
            domain="live_monitoring",
            description=(
                "Get the current live status of all cameras. Includes a real-time verification pass "
                "(verified_streaming: true/false per camera) confirming whether video frames are "
                "actually arriving right now, on top of the underlying snapshot."
            ),
            input_model=GetLiveCamerasInput,
            handler=_get_live_cameras,
        )
    )
    register_tool(
        ToolSpec(
            name="get_spotlight_cameras",
            domain="live_monitoring",
            description=(
                "Get the current spotlighted/highlighted cameras shown on the monitor page. Includes "
                "the same real-time verified_streaming check as get_live_cameras."
            ),
            input_model=GetSpotlightCamerasInput,
            handler=_get_spotlight_cameras,
        )
    )
