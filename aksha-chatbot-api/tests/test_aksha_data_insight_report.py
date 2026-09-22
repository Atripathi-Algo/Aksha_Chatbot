"""read_insight_report's multi-day merge (app/aksha_data.py).

Found live 2026-09-18 while building the Analytics hourly-trend chart: each
day's own report file keys its per-camera alerts dict by time-of-day only
("06:06:49"), which is safe within one file but collides silently once
several days are merged into one dict — two different days sharing a
same-second alert time (routine on a busy camera) overwrote one real alert
with another. total_alerts_generated stayed correct (incremented per loop
iteration, not from the merged dict's length), but the merged `alerts` dict
itself — and everything downstream of it (peak_alert_time_hour,
most_active_hour_for_each_object, and the new hourly_alert_counts) — quietly
undercounted for any multi-day query. The fix keys the merge by each alert's
own full-date `timestamp` field instead of the file-local time-only key."""

import json

from app.aksha_data import read_insight_report


def _write_report(tmp_path, day: str, camera: str, alerts: dict):
    report_dir = tmp_path / "insight_report"
    report_dir.mkdir(exist_ok=True)
    (report_dir / f"{day}.json").write_text(json.dumps({camera: {"alerts": alerts}}))


def test_same_time_of_day_alerts_on_different_days_do_not_collide(tmp_path, monkeypatch):
    monkeypatch.setattr("app.aksha_data.AKSHA_DATA_PATH", tmp_path)
    _write_report(tmp_path, "2026-09-17", "cam3", {
        "06:06:49": {"object": "person", "timestamp": "2026-09-17 06:06:49"},
    })
    _write_report(tmp_path, "2026-09-18", "cam3", {
        "06:06:49": {"object": "person", "timestamp": "2026-09-18 06:06:49"},
    })
    report = read_insight_report("2026-09-17", "2026-09-18", "00:00:00", "23:59:59", ["cam3"])
    assert report["cam3"]["total_alerts_generated"] == 2
    assert len(report["cam3"]["alerts"]) == 2
    assert set(report["cam3"]["alerts"].keys()) == {"2026-09-17 06:06:49", "2026-09-18 06:06:49"}


def test_total_alerts_generated_matches_merged_alerts_length(tmp_path, monkeypatch):
    monkeypatch.setattr("app.aksha_data.AKSHA_DATA_PATH", tmp_path)
    _write_report(tmp_path, "2026-09-15", "cam3", {
        "06:06:49": {"object": "person", "timestamp": "2026-09-15 06:06:49"},
        "06:06:51": {"object": "person", "timestamp": "2026-09-15 06:06:51"},
    })
    _write_report(tmp_path, "2026-09-16", "cam3", {
        "06:06:49": {"object": "person", "timestamp": "2026-09-16 06:06:49"},
    })
    report = read_insight_report("2026-09-15", "2026-09-16", "00:00:00", "23:59:59", ["cam3"])
    assert report["cam3"]["total_alerts_generated"] == len(report["cam3"]["alerts"]) == 3
