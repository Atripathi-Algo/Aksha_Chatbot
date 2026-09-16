"""Timeline & Sequence tools — Phase 2, orange (see note below).

The catalog's design (SUPPORT_CHATBOT_AGENT_CATALOG.md, "Timeline and
Sequence Agent") wanted event, evidence, processing and notification
timestamps in one sortable schema — that was its "minor backend change".
Probed live 2026-09-16: the deployed backend exposes exactly one time signal
for alert events — the capture timestamp embedded in each alert image's
filename (".../2026-09-16 12:35:26_alert.jpg") from /api/recentAlert/:hours,
the same per-camera buckets alert_investigation's get_recent_alerts and
formatter.extract_frames already read. No event/processing/notification
times exist anywhere (every richer alert route 404s), and that backend is a
compiled image this repo can't change. So this builds an honest EVIDENCE
timeline from what's real, and labels it exactly that — the agent's prompt
forbids presenting it as event or notification time.

Ordering, episode grouping and gap arithmetic are computed here
deterministically (same principle as formatter.extract_analytics): a model
reliably preserves an order it is handed, but is unreliable at sorting and
doing time arithmetic across a list of timestamps itself. Episodes — runs
of consecutive frames on one camera with no gap longer than `gap_minutes`
— are the unit returned, not individual frames: a busy camera emits
thousands of per-second frames, which would blow straight past
compact_results_json's cap and silently truncate other cameras out of what
the model sees (the exact failure tools_insights.py hit on 2026-09-04).
"""

from datetime import datetime

from pydantic import BaseModel, Field

from app.formatter import _ALERT_IMAGE_TS_RE, _matches_camera_filter
from app.node_client import get
from app.tool_registry import ToolSpec, register_tool

MAX_EPISODES = 40
TIMESTAMP_KIND = "evidence_capture_time"
NOT_AVAILABLE = ["event_time", "processing_time", "notification_time"]


def _parse_capture_time(url: str) -> datetime | None:
    match = _ALERT_IMAGE_TS_RE.search(url)
    if not match:
        return None
    try:
        return datetime.strptime(f"{match.group(1)} {match.group(2)}", "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None


def build_timeline(buckets, camera_filter: list[str] | None, gap_minutes: int) -> dict:
    """Pure function over get_recent_alerts' {cameraName, images} buckets."""
    events: list[tuple[datetime, str]] = []
    for bucket in buckets if isinstance(buckets, list) else []:
        if not isinstance(bucket, dict):
            continue
        camera = bucket.get("cameraName")
        images = bucket.get("images")
        if not camera or not isinstance(images, list):
            continue
        if not _matches_camera_filter(camera, camera_filter):
            continue
        for url in images:
            if isinstance(url, str):
                ts = _parse_capture_time(url)
                if ts is not None:
                    events.append((ts, str(camera)))

    events.sort()

    gap_seconds = gap_minutes * 60
    episodes: list[dict] = []
    open_by_camera: dict[str, dict] = {}
    for ts, camera in events:
        current = open_by_camera.get(camera)
        if current and (ts - current["_last"]).total_seconds() <= gap_seconds:
            current["_last"] = ts
            current["frame_count"] += 1
            continue
        episode = {"camera": camera, "start": ts, "_last": ts, "frame_count": 1}
        open_by_camera[camera] = episode
        episodes.append(episode)

    episodes.sort(key=lambda e: (e["start"], e["camera"]))

    rows = []
    previous_end_by_camera: dict[str, datetime] = {}
    for ep in episodes:
        end = ep["_last"]
        prev_end = previous_end_by_camera.get(ep["camera"])
        rows.append({
            "camera": ep["camera"],
            "start": ep["start"].isoformat(sep=" "),
            "end": end.isoformat(sep=" "),
            "duration_seconds": int((end - ep["start"]).total_seconds()),
            "frame_count": ep["frame_count"],
            "gap_before_seconds": int((ep["start"] - prev_end).total_seconds()) if prev_end else None,
        })
        previous_end_by_camera[ep["camera"]] = end

    truncated = len(rows) > MAX_EPISODES
    return {
        "timestamp_kind": TIMESTAMP_KIND,
        "episodes": rows[-MAX_EPISODES:] if truncated else rows,
        "episode_count": len(rows),
        "episodes_truncated_to_most_recent": MAX_EPISODES if truncated else None,
        "total_frames": len(events),
        "first_seen": events[0][0].isoformat(sep=" ") if events else None,
        "last_seen": events[-1][0].isoformat(sep=" ") if events else None,
        "cameras": sorted({e[1] for e in events}),
        "gap_minutes_used_to_split_episodes": gap_minutes,
        "not_available": NOT_AVAILABLE,
    }


class GetAlertTimelineInput(BaseModel):
    hours: int = Field(default=24, ge=1, le=168, description="How many hours back to build the timeline over.")
    camera_names: list[str] = Field(default_factory=list, description="Restrict to these cameras, as the operator named them. Empty means all.")
    gap_minutes: int = Field(default=5, ge=1, le=240, description="Consecutive alert frames on one camera closer than this are one episode; a longer gap starts a new one.")


def _get_alert_timeline(params: GetAlertTimelineInput) -> dict:
    # Same route and unwrap as tools_alerts._get_recent_alerts — the response
    # wraps the per-camera buckets under a singular "alert" key.
    raw = get(f"/api/recentAlert/{params.hours}")
    buckets = raw.get("alert", raw) if isinstance(raw, dict) else raw
    result = build_timeline(buckets, params.camera_names or None, params.gap_minutes)
    result["window_hours"] = params.hours
    result["requested_cameras"] = params.camera_names
    return result


def register() -> None:
    register_tool(
        ToolSpec(
            name="get_alert_timeline",
            domain="timeline",
            description=(
                "Build a chronological timeline of alert activity over the last N hours: alert frames grouped "
                "into episodes per camera (start, end, duration, frame count, gap since that camera's previous "
                "episode), ordered oldest to newest. Timestamps are evidence CAPTURE times from the alert images — "
                "the only time signal this backend has; event, processing and notification times are not "
                "available. Pass camera_names to focus on specific cameras."
            ),
            input_model=GetAlertTimelineInput,
            handler=_get_alert_timeline,
        )
    )
