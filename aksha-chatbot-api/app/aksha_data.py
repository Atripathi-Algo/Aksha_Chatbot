"""Read report files produced by the Aksha pipeline."""

import json
import os
from datetime import date, datetime, time, timedelta
from pathlib import Path


AKSHA_DATA_PATH = Path(os.getenv("AKSHA_DATA_PATH", "/srv/Aksha"))


def _dates_between(start_date: date, end_date: date):
    current = start_date
    while current <= end_date:
        yield current
        current += timedelta(days=1)


def _in_time_range(timestamp: str, start_time: time, end_time: time) -> bool:
    try:
        value = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S").time()
    except ValueError:
        return False
    return start_time <= value <= end_time


def read_insight_report(
    start_date: str,
    end_date: str,
    start_time: str,
    end_time: str,
    camera_names: list[str],
) -> dict | None:
    """Aggregate locally generated insight reports for the requested range.

    Returns None when no local report exists, allowing the caller to use the
    live Node API. An existing report range with no matching alerts returns an
    empty camera map.
    """
    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)
    range_start = time.fromisoformat(start_time)
    range_end = time.fromisoformat(end_time)
    report_dir = AKSHA_DATA_PATH / "insight_report"
    report_files = [report_dir / f"{day.isoformat()}.json" for day in _dates_between(start, end)]
    existing_files = [path for path in report_files if path.is_file()]
    if not existing_files:
        return None

    cameras: dict[str, dict] = {}
    for path in existing_files:
        with path.open(encoding="utf-8") as report_file:
            report = json.load(report_file)
        for camera_name, raw_camera in report.items():
            if camera_names and camera_name not in camera_names:
                continue
            camera = cameras.setdefault(camera_name, {
                "object_detection_alerts": {},
                "total_alerts_generated": 0,
                "alerts": {},
            })
            for timestamp, alert in raw_camera.get("alerts", {}).items():
                if _in_time_range(alert.get("timestamp", ""), range_start, range_end):
                    # Found live 2026-09-18: each day's own report file keys
                    # its alerts dict by time-of-day only ("06:06:49"), safe
                    # within a single file but colliding silently once
                    # multiple days are merged into one `camera["alerts"]`
                    # dict here — two different days sharing a same-second
                    # alert time (routine on a busy camera) overwrote one
                    # real alert with another, undercounting the merged dict
                    # (though total_alerts_generated/object_detection_alerts
                    # stayed correct, since those increment per loop
                    # iteration, not from the dict's later length). Each
                    # alert's own `timestamp` field already carries the full
                    # date, so keying the merge by that instead is unique
                    # across the whole range, not just within one day.
                    camera["alerts"][alert.get("timestamp") or timestamp] = alert
                    camera["total_alerts_generated"] += 1
                    object_name = alert.get("object")
                    if object_name:
                        counts = camera["object_detection_alerts"]
                        counts[object_name] = counts.get(object_name, 0) + 1

    for camera in cameras.values():
        camera["peak_alert_time_hour"] = _peak_hour(camera["alerts"])
        camera["most_active_hour_for_each_object"] = _active_hours(camera["alerts"])

    return cameras


def _peak_hour(alerts: dict) -> int | None:
    hours: dict[int, int] = {}
    for alert in alerts.values():
        timestamp = alert.get("timestamp", "")
        try:
            hour = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S").hour
        except ValueError:
            continue
        hours[hour] = hours.get(hour, 0) + 1
    return max(hours, key=hours.get) if hours else None


def _active_hours(alerts: dict) -> dict[str, int]:
    object_hours: dict[str, dict[int, int]] = {}
    for alert in alerts.values():
        object_name = alert.get("object")
        timestamp = alert.get("timestamp", "")
        if not object_name:
            continue
        try:
            hour = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S").hour
        except ValueError:
            continue
        hours = object_hours.setdefault(object_name, {})
        hours[hour] = hours.get(hour, 0) + 1
    return {object_name: max(hours, key=hours.get) for object_name, hours in object_hours.items()}