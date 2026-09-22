"""extract_frames' alert-name join (formatter.py): a frame is labelled with
the Alert_Name of whichever active rule's day/time window covers its
capture timestamp, looked up deterministically via get_alerts_by_camera —
never left to the LLM to guess, and left blank rather than guessed when
zero or more than one rule matches."""

import app.formatter as formatter
from app.state import ToolResult


def _recent_alerts_result(camera: str, images: list[str]) -> ToolResult:
    return ToolResult(
        tool_name="get_recent_alerts", ok=True, error_code=None,
        data={"alerts": [{"cameraName": camera, "images": images}]},
    )


def _rule(name, start, end, days, status="active"):
    return {"Alert_Name": name, "Start_Time": start, "End_Time": end, "Days_Active": days, "Alert_Status": status}


def test_single_matching_active_rule_is_attached(monkeypatch):
    monkeypatch.setattr(
        formatter, "_alert_name_lookup",
        lambda cameras: {"cam1": [_rule("Night-Alert", "18:00", "09:00", ["Wednesday"])]},
    )
    results = [_recent_alerts_result("cam1", ["/x/2026-09-17 02:30:00_alert.jpg"])]
    frames = formatter.extract_frames(results)
    assert len(frames) == 1
    assert frames[0]["alert_name"] == "Night-Alert"


def test_no_matching_rule_leaves_alert_name_none(monkeypatch):
    monkeypatch.setattr(
        formatter, "_alert_name_lookup",
        lambda cameras: {"cam1": [_rule("Day-Alert", "07:00", "19:00", ["Wednesday"])]},
    )
    # 2026-09-17 is a Thursday — capture time falls outside the rule's day.
    results = [_recent_alerts_result("cam1", ["/x/2026-09-17 12:00:00_alert.jpg"])]
    frames = formatter.extract_frames(results)
    assert frames[0]["alert_name"] is None


def test_ambiguous_overlapping_rules_are_not_guessed(monkeypatch):
    monkeypatch.setattr(
        formatter, "_alert_name_lookup",
        lambda cameras: {
            "cam1": [
                _rule("Rule-A", "00:00", "23:59", ["Thursday"]),
                _rule("Rule-B", "10:00", "14:00", ["Thursday"]),
            ]
        },
    )
    results = [_recent_alerts_result("cam1", ["/x/2026-09-17 12:00:00_alert.jpg"])]
    frames = formatter.extract_frames(results)
    assert frames[0]["alert_name"] is None


def test_inactive_rule_is_ignored(monkeypatch):
    monkeypatch.setattr(
        formatter, "_alert_name_lookup",
        lambda cameras: {"cam1": [_rule("Paused-Alert", "00:00", "23:59", ["Thursday"], status="paused")]},
    )
    results = [_recent_alerts_result("cam1", ["/x/2026-09-17 12:00:00_alert.jpg"])]
    frames = formatter.extract_frames(results)
    assert frames[0]["alert_name"] is None


def test_overnight_window_matches_across_midnight():
    rule = _rule("Night-Alert", "18:00", "09:00", ["Wednesday"])
    from datetime import datetime
    # Wednesday 23:00 — same-day tail of the window.
    assert formatter._rule_covers_timestamp(rule, datetime(2026, 9, 16, 23, 0))
    # Thursday 05:00 — carried over from Wednesday's activation.
    assert formatter._rule_covers_timestamp(rule, datetime(2026, 9, 17, 5, 0))
    # Thursday 12:00 — outside the window entirely.
    assert not formatter._rule_covers_timestamp(rule, datetime(2026, 9, 17, 12, 0))


def test_no_alert_rules_available_leaves_frames_unlabelled(monkeypatch):
    monkeypatch.setattr(formatter, "_alert_name_lookup", lambda cameras: {})
    results = [_recent_alerts_result("cam1", ["/x/2026-09-17 12:00:00_alert.jpg"])]
    frames = formatter.extract_frames(results)
    assert len(frames) == 1
    assert frames[0]["alert_name"] is None
