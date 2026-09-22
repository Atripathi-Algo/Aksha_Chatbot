"""Analytics' hourly-trend chart data: tools_insights.py's 24-slot histogram
(computed once, from the same per-alert timestamps peak_alert_time_hour
already reduces to a single number) and formatter.py's pass-through of it
into extract_analytics' rows."""

from app.formatter import extract_analytics
from app.state import ToolResult
from app.tools_insights import _hourly_alert_counts, _prepare_camera_report


def test_hourly_alert_counts_buckets_by_hour():
    alerts = {
        "2026-09-17 06:06:49": {"timestamp": "2026-09-17 06:06:49"},
        "2026-09-17 06:07:05": {"timestamp": "2026-09-17 06:07:05"},
        "2026-09-17 13:00:00": {"timestamp": "2026-09-17 13:00:00"},
    }
    counts = _hourly_alert_counts(alerts)
    assert len(counts) == 24
    assert counts[6] == 2
    assert counts[13] == 1
    assert sum(counts) == 3


def test_hourly_alert_counts_empty_and_malformed_are_safe():
    assert _hourly_alert_counts({}) == [0] * 24
    assert _hourly_alert_counts({"x": {"timestamp": "not-a-timestamp"}}) == [0] * 24
    assert _hourly_alert_counts(None) == [0] * 24


def test_prepare_camera_report_attaches_histogram_and_drops_raw_alerts():
    cameras = {
        "cam3": {
            "total_alerts_generated": 2,
            "object_detection_alerts": {"person": 2},
            "alerts": {
                "2026-09-17 06:06:49": {"timestamp": "2026-09-17 06:06:49"},
                "2026-09-17 06:07:05": {"timestamp": "2026-09-17 06:07:05"},
            },
        }
    }
    result = _prepare_camera_report(cameras)
    assert "alerts" not in result["cam3"]
    assert result["cam3"]["hourly_alert_counts"][6] == 2


def test_extract_analytics_includes_hourly_counts_row():
    hourly = [0] * 24
    hourly[6] = 5
    results = [
        ToolResult(
            tool_name="get_insight_report", ok=True,
            data={"cam3": {"total_alerts_generated": 5, "hourly_alert_counts": hourly}},
        )
    ]
    rows = extract_analytics(results)
    assert len(rows) == 1
    assert rows[0]["hourly_counts"] == hourly


def test_extract_analytics_malformed_hourly_counts_omitted():
    results = [
        ToolResult(
            tool_name="get_insight_report", ok=True,
            data={"cam3": {"total_alerts_generated": 5, "hourly_alert_counts": [1, 2, 3]}},
        )
    ]
    rows = extract_analytics(results)
    assert rows[0]["hourly_counts"] is None
