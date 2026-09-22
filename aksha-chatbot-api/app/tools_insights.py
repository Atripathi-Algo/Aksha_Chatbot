"""Insights & Analytics tools — Phase 1, green.
Matches the exact contract in AkshaV2-UIUX/backend/src/routes/insightReport.js:
all four of startDate/endDate/startTime/endTime are required by that route,
so the tool schema requires them too rather than defaulting silently."""

from datetime import date as date_cls, datetime

from pydantic import BaseModel, Field, model_validator

from app.aksha_data import read_insight_report
from app.node_client import NodeApiError, post
from app.tool_registry import ToolSpec, register_tool

# read_insight_report opens one JSON file per day in the range with no cap —
# a query spanning "since last year" reads hundreds of files for a single
# turn. This bounds it at the Pydantic validation step, before the handler
# ever runs, so it fails the same clean way any other bad tool input does
# (ToolResult ok=False, error_code="VALIDATION") rather than just being slow.
MAX_REPORT_RANGE_DAYS = 92


class GetInsightReportInput(BaseModel):
    start_date: str = Field(description="YYYY-MM-DD")
    end_date: str = Field(description="YYYY-MM-DD")
    start_time: str = Field(default="00:00:00", description="HH:MM:SS")
    end_time: str = Field(default="23:59:59", description="HH:MM:SS")
    camera_names: list[str] = Field(default_factory=list, description="Empty means all cameras.")

    @model_validator(mode="after")
    def _check_range(self):
        start = date_cls.fromisoformat(self.start_date)
        end = date_cls.fromisoformat(self.end_date)
        span = (end - start).days
        if span < 0:
            raise ValueError("end_date is before start_date.")
        if span > MAX_REPORT_RANGE_DAYS:
            raise ValueError(
                f"Date range too large ({span} days) — insight reports are capped at "
                f"{MAX_REPORT_RANGE_DAYS} days per query to keep responses fast. Ask for a "
                "narrower range (e.g. a specific week or month) instead."
            )
        return self


def _hourly_alert_counts(alerts: dict) -> list[int]:
    """24-slot histogram (index 0 = 00:00) for the Analytics hourly-trend
    chart — computed here, once, from the same per-alert timestamps
    peak_alert_time_hour already reduces to a single number, before this
    function's caller drops `alerts` for size (see the docstring below)."""
    counts = [0] * 24
    if not isinstance(alerts, dict):
        return counts
    for alert in alerts.values():
        if not isinstance(alert, dict):
            continue
        try:
            hour = datetime.strptime(alert.get("timestamp", ""), "%Y-%m-%d %H:%M:%S").hour
        except ValueError:
            continue
        counts[hour] += 1
    return counts


def _prepare_camera_report(cameras: dict) -> dict:
    """Sort by alert count, highest first — dict insertion order is what the
    LLM sees in compact_results_json, and a model reliably preserves the
    order data already arrives in far more than it reliably re-sorts prose on
    its own. Also drops each camera's raw per-alert `alerts` dict: found live
    2026-09-04, a busy camera's thousands of individually-timestamped alert
    records blew straight past compact_results_json's 12000-char cap, and
    the truncation silently cut a second, quieter camera's summary out of
    what the formatter ever saw — it never omitted that camera on purpose,
    it just never received its data. Insights only needs the aggregates
    (total_alerts_generated, object_detection_alerts, peak/active hours);
    per-alert timestamp detail is Alert Investigation's domain, not this
    one's, and doesn't belong in a counting/trend answer regardless. The one
    exception is hourly_alert_counts (Analytics' hourly-trend chart) — a
    24-int histogram is negligible size next to the raw records it's
    computed from, so it's attached here, once, right before `alerts` itself
    is dropped."""
    if not isinstance(cameras, dict):
        return cameras
    trimmed = {}
    for name, info in cameras.items():
        info = info or {}
        entry = {k: v for k, v in info.items() if k != "alerts"}
        entry["hourly_alert_counts"] = _hourly_alert_counts(info.get("alerts") or {})
        trimmed[name] = entry
    return dict(
        sorted(trimmed.items(), key=lambda item: item[1].get("total_alerts_generated", 0), reverse=True)
    )


def _get_insight_report(params: GetInsightReportInput) -> dict:
    local_report = read_insight_report(
        params.start_date,
        params.end_date,
        params.start_time,
        params.end_time,
        params.camera_names,
    )
    if local_report is not None:
        return _prepare_camera_report(local_report)

    body = {
        "startDate": params.start_date,
        "endDate": params.end_date,
        "startTime": params.start_time,
        "endTime": params.end_time,
        "cameras": params.camera_names,
    }
    try:
        raw = post("/api/insightReport", body)
    except NodeApiError as e:
        # Confirmed live 2026-08-25: this route 400s with "No data found for
        # the requested date range" when no report files exist yet for that
        # window — a legitimate empty result, not a broken request. Surfacing
        # it as ok=True with no data lets the agent say "no data for that
        # range" instead of a misleading "service unavailable, try again".
        if e.error_code == "VALIDATION" and "no data found" in e.message.lower():
            return {}
        raise
    # Found live 2026-09-04: this live-Node path wraps the same per-camera
    # data the local-file path (read_insight_report, above) returns
    # unwrapped — {"cameras": {name: {...}}} here vs {name: {...}} there.
    # suggest_follow_ups (and the sort above) both read tool_results.data as
    # the flat {camera_name: {...}} shape directly; left wrapped, a query
    # that falls back to this path (no cached report file yet) silently lost
    # its camera names for follow-ups and never got sorted. Normalize to the
    # same unwrapped shape regardless of which path answered.
    cameras = raw.get("cameras", raw) if isinstance(raw, dict) else raw
    return _prepare_camera_report(cameras)


def register() -> None:
    register_tool(
        ToolSpec(
            name="get_insight_report",
            domain="insights_analytics",
            description="Get alert counts and object-detection breakdowns per camera over a date/time range.",
            input_model=GetInsightReportInput,
            handler=_get_insight_report,
        )
    )
