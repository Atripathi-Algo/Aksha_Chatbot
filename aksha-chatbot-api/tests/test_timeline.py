"""
app/tools_timeline.py's build_timeline — pure logic over get_recent_alerts'
{cameraName, images} buckets, no network. Ordering, episode grouping by gap,
gap arithmetic, camera filtering, malformed-input tolerance and the
truncation flag are all things a model is unreliable at, which is exactly
why they're computed here — so they get locked down.
"""

from app.tools_timeline import MAX_EPISODES, NOT_AVAILABLE, TIMESTAMP_KIND, build_timeline


def _url(camera, ts):
    return f"http://localhost:5000/{camera}/alerts/2026-09-16/2026-09-16 {ts}_alert.jpg"


def _bucket(camera, *times):
    return {"cameraName": camera, "images": [_url(camera, t) for t in times]}


def test_empty_input_gives_an_empty_but_well_formed_timeline():
    result = build_timeline([], None, 5)
    assert result["episodes"] == []
    assert result["total_frames"] == 0
    assert result["first_seen"] is None
    assert result["timestamp_kind"] == TIMESTAMP_KIND
    assert result["not_available"] == NOT_AVAILABLE


def test_frames_within_gap_form_one_episode_and_are_counted():
    result = build_timeline([_bucket("cam3", "12:35:26", "12:35:25", "12:35:24")], None, 5)
    assert result["episode_count"] == 1
    ep = result["episodes"][0]
    assert ep["camera"] == "cam3"
    assert ep["start"] == "2026-09-16 12:35:24"  # sorted ascending even though input was descending
    assert ep["end"] == "2026-09-16 12:35:26"
    assert ep["frame_count"] == 3
    assert ep["duration_seconds"] == 2
    assert ep["gap_before_seconds"] is None


def test_a_gap_longer_than_gap_minutes_splits_episodes_and_reports_the_gap():
    result = build_timeline([_bucket("cam3", "12:00:00", "12:00:30", "12:10:00")], None, 5)
    assert result["episode_count"] == 2
    first, second = result["episodes"]
    assert first["frame_count"] == 2
    assert second["frame_count"] == 1
    assert second["gap_before_seconds"] == 570  # 12:00:30 -> 12:10:00


def test_a_gap_exactly_at_the_threshold_stays_one_episode():
    result = build_timeline([_bucket("cam3", "12:00:00", "12:05:00")], None, 5)
    assert result["episode_count"] == 1


def test_episodes_across_cameras_are_interleaved_chronologically():
    result = build_timeline(
        [_bucket("cam3", "12:00:00"), _bucket("cam1-Gate-Camera", "11:00:00"), _bucket("cam2", "13:00:00")],
        None,
        5,
    )
    assert [e["camera"] for e in result["episodes"]] == ["cam1-Gate-Camera", "cam3", "cam2"]
    assert result["cameras"] == ["cam1-Gate-Camera", "cam2", "cam3"]
    assert result["first_seen"] == "2026-09-16 11:00:00"
    assert result["last_seen"] == "2026-09-16 13:00:00"


def test_gap_before_is_per_camera_not_global():
    # cam2's first episode has no previous cam2 episode, so no gap — even
    # though cam3 fired in between.
    result = build_timeline([_bucket("cam3", "12:00:00"), _bucket("cam2", "12:30:00")], None, 5)
    assert all(e["gap_before_seconds"] is None for e in result["episodes"])


def test_camera_filter_uses_the_same_token_matching_as_frames_and_sources():
    result = build_timeline(
        [_bucket("cam1-Gate-Camera", "12:00:00"), _bucket("cam11", "12:00:00")],
        ["gate camera"],
        5,
    )
    assert [e["camera"] for e in result["episodes"]] == ["cam1-Gate-Camera"]


def test_camera_filter_does_not_substring_match_cam1_into_cam11():
    result = build_timeline([_bucket("cam11", "12:00:00")], ["cam1"], 5)
    assert result["episodes"] == []


def test_malformed_buckets_and_urls_are_skipped_not_fatal():
    buckets = [
        "not a dict",
        {"cameraName": None, "images": [_url("x", "12:00:00")]},
        {"cameraName": "cam3", "images": "not a list"},
        {"cameraName": "cam3", "images": ["http://localhost:5000/cam3/no-timestamp.jpg", 42, _url("cam3", "12:00:00")]},
    ]
    result = build_timeline(buckets, None, 5)
    assert result["total_frames"] == 1
    assert result["episode_count"] == 1


def test_many_episodes_are_truncated_to_the_most_recent_and_flagged():
    # One frame every 10 minutes with a 5-minute gap threshold -> one episode each.
    times = [f"{h:02d}:{m:02d}:00" for h in range(0, 10) for m in (0, 10, 20, 30, 40, 50)]  # 60 episodes
    result = build_timeline([_bucket("cam3", *times)], None, 5)
    assert result["episode_count"] == 60
    assert len(result["episodes"]) == MAX_EPISODES
    assert result["episodes_truncated_to_most_recent"] == MAX_EPISODES
    assert result["episodes"][-1]["start"] == "2026-09-16 09:50:00"  # kept the most recent, dropped the oldest
