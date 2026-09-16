"""Camera Troubleshooting tools — Phase 2, orange (see note below).

The catalog's design (SUPPORT_CHATBOT_AGENT_CATALOG.md, "Camera
Troubleshooting Agent") wanted last-seen time, RTSP health, service state
and recent sanitized backend errors exposed through a diagnostic response —
that was the "minor backend change" it flagged. Probed live 2026-09-16:
none of that exists on the deployed node_backend (/api/myAlert,
/api/investigation, /api/alertHistory and the per-camera recentAlert
variant all 404), and that backend is a compiled image this repo can't
change. So this is built only from what IS real today:

- the camera record itself (Status, Surveillance_Status, Live, Active, FPS,
  PausedTime) — the same fields tools_errors.py's glossary documents with
  meanings verified in source, so every diagnosis below is grounded in a
  status value whose meaning was confirmed, not guessed;
- a real-time frame probe (app/socket_probe.py) as the RTSP-health proxy —
  the only live signal this backend gives about whether video is actually
  arriving. It never reads or exposes the RTSP link itself.

Diagnosis is DETERMINISTIC (a rule table, not LLM reasoning) — same
principle as formatter.extract_analytics: a model is unreliable at inventing
consistent structured diagnoses turn after turn, and a wrong "likely cause"
here sends an operator off to fix the wrong thing. Each row carries the
observed signal, likely cause, a confidence label and the recommended next
step the catalog asks for. Signals this backend cannot provide are listed
explicitly in `not_available` — structural honesty the agent's prompt then
reinforces — rather than silently inferred.
"""

import os

from pydantic import BaseModel, Field

from app.formatter import _matches_camera_filter
from app.node_client import get, redact_cameras
from app.socket_probe import probe_streaming
from app.tool_registry import ToolSpec, register_tool

# FPS on a camera record is the CONFIGURED capture rate (a setting, e.g. 3),
# not a measured delivery rate — nothing in this API measures actual frame
# rate. Below this configured value we flag it as an observation about
# configuration, never as "measured low FPS".
LOW_CONFIGURED_FPS = 2

NOT_AVAILABLE = [
    "last_seen_time",
    "recent_backend_errors",
    "measured_fps",
    "detection_pipeline_health",
]

# Longer than socket_probe's default: a "no frames arriving" result here
# turns directly into a "check your network / RTSP connection" diagnosis, so
# a false negative sends an operator to fix a camera that's fine. A
# diagnostic call can afford the extra seconds; a wrong diagnosis can't be
# afforded at all. 6s measured reliable on every run (see socket_probe.py).
DIAGNOSTIC_PROBE_SECONDS = float(os.getenv("DIAGNOSTIC_PROBE_TIMEOUT_SECONDS", "6.0"))


def diagnose_camera(cam: dict, verified_streaming: bool | None) -> dict:
    """Pure rule table over one camera record + its live frame check. Rules
    are ordered most-specific/most-deliberate first: an operator-chosen
    state (surveillance stopped, feed paused) explains a missing feed fully,
    so it wins over the generic 'no frames arriving' rule."""
    name = cam.get("Camera_Name")
    status = cam.get("Status")
    surveillance = cam.get("Surveillance_Status")
    live = cam.get("Live")
    fps = cam.get("FPS")

    row = {
        "camera": name,
        "status": status,
        "surveillance_status": surveillance,
        "live": live,
        "configured_fps": fps,
        "verified_streaming": verified_streaming,
        "healthy": False,
    }

    if surveillance == "stop":
        row.update(
            observed_signal="Surveillance_Status is 'stop' — the live view shows a black placeholder instead of the feed.",
            likely_cause="Monitoring was manually stopped for this camera by an operator; this is a deliberate state, not a fault.",
            confidence="high",
            next_step="If this wasn't intentional, use the camera's menu 'Start' option to resume monitoring.",
        )
        return row

    if live is False:
        row.update(
            observed_signal="Live is false — the feed is paused. PausedTime marks the last frame before pausing.",
            likely_cause="An operator paused the feed with the Play/Pause control; deliberate, not a fault.",
            confidence="high",
            next_step="Use the Play control on the camera to resume the live feed.",
        )
        return row

    if status == "offline":
        row.update(
            observed_signal="Status is 'offline' — the backend does not currently have a connection to this camera.",
            likely_cause="The camera is powered off, unreachable over the network, or its RTSP stream can't be opened.",
            confidence="medium",
            next_step="Check the camera is powered on and reachable on the network, verify its RTSP connection settings, then refresh the camera status.",
        )
        return row

    if verified_streaming is False:
        row.update(
            observed_signal="Configured as active, but no video frames arrived during a live check just now.",
            likely_cause="The detection pipeline can't currently read frames from this camera's stream — the same condition that raises an 'RTSP Error' alert (network drop or RTSP connection failure).",
            confidence="medium",
            next_step="Check the camera's network connection and RTSP connection settings. A recovery notification is sent automatically once the pipeline reconnects.",
        )
        return row

    if status == "creating" and verified_streaming is True:
        row.update(
            observed_signal="Status still reads 'creating', but video frames are actually arriving right now.",
            likely_cause="The status label is stale — 'creating' is a transient provisioning state, and this camera has clearly finished provisioning since it's streaming.",
            confidence="high",
            next_step="No action needed for the feed. The label should clear on refresh; if it never does, that's a cosmetic backend status issue, not a video problem.",
            healthy=True,
        )
        return row

    if status == "creating":
        row.update(
            observed_signal="Status is 'creating' and no frames were confirmed yet.",
            likely_cause="The camera was just added and the backend is still provisioning it — transient, not an error.",
            confidence="high",
            next_step="Wait a moment and refresh. If it stays in 'creating' for long with no video, treat it as a provisioning problem and check the RTSP connection settings.",
        )
        return row

    if isinstance(fps, (int, float)) and fps < LOW_CONFIGURED_FPS:
        row.update(
            observed_signal=f"Configured FPS is {fps} — a low capture rate setting (this is the configured value, not a measured rate).",
            likely_cause="The camera is configured to capture very few frames per second, so the feed will look choppy or delayed by design.",
            confidence="high",
            next_step="If smoother video is needed, raise the camera's FPS setting in its configuration. Otherwise this is working as configured.",
            healthy=True,
        )
        return row

    row.update(
        observed_signal="Active, monitoring started, feed not paused, and video frames confirmed arriving just now.",
        likely_cause="No problem detected from the signals this system exposes.",
        confidence="high" if verified_streaming is True else "medium",
        next_step="No action needed. Use the 'Watch live' control on the camera's name to view it.",
        healthy=True,
    )
    return row


def build_diagnoses(cameras: list, verified: dict[str, bool]) -> dict:
    diagnoses = [
        diagnose_camera(cam, verified.get(cam.get("Camera_Name")))
        for cam in cameras
        if isinstance(cam, dict)
    ]
    # Problems first, so a "which cameras have issues" answer leads with them.
    diagnoses.sort(key=lambda d: (d["healthy"], str(d["camera"])))
    return {
        "diagnoses": diagnoses,
        "cameras_checked": len(diagnoses),
        "cameras_with_issues": sum(1 for d in diagnoses if not d["healthy"]),
        "fps_note": "configured_fps is the camera's capture-rate setting, not a measured delivery rate — this API has no measured FPS.",
        "not_available": NOT_AVAILABLE,
    }


class DiagnoseCamerasInput(BaseModel):
    camera_names: list[str] = Field(
        default_factory=list,
        description="Cameras to diagnose, as the operator named them. Empty means every camera.",
    )


def _diagnose_cameras(params: DiagnoseCamerasInput) -> dict:
    raw = get("/api/camera")
    cameras = redact_cameras(raw.get("cameras", raw) if isinstance(raw, dict) else raw)
    if not isinstance(cameras, list):
        cameras = []
    if params.camera_names:
        cameras = [c for c in cameras if isinstance(c, dict) and _matches_camera_filter(c.get("Camera_Name"), params.camera_names)]
    names = [c.get("Camera_Name") for c in cameras if isinstance(c, dict) and c.get("Camera_Name")]
    verified = probe_streaming(names, timeout_seconds=DIAGNOSTIC_PROBE_SECONDS)
    result = build_diagnoses(cameras, verified)
    result["requested_cameras"] = params.camera_names
    return result


def register() -> None:
    register_tool(
        ToolSpec(
            name="diagnose_cameras",
            domain="camera_troubleshooting",
            description=(
                "Diagnose camera and video-feed problems. Returns one deterministic diagnosis per camera "
                "(observed signal, likely cause, confidence, recommended next step) built from the camera's "
                "real status fields plus a live check of whether video frames are actually arriving right now. "
                "Pass camera_names to focus on specific cameras; empty checks all of them. Also returns "
                "`not_available` — the diagnostic signals this backend does not expose."
            ),
            input_model=DiagnoseCamerasInput,
            handler=_diagnose_cameras,
        )
    )
