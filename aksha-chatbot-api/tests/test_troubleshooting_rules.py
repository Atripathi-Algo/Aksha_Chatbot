"""
app/tools_troubleshooting.py's deterministic diagnosis rules — pure logic
over a camera record + the live frame-check result, no network. One case
per rule branch, plus the precedence cases that matter: an operator-chosen
state (stopped / paused) must explain a missing feed over the generic
"no frames arriving" rule, and a stale 'creating' label on a camera that
is demonstrably streaming must be reported as healthy, not as a fault.
"""

from app.tools_troubleshooting import NOT_AVAILABLE, build_diagnoses, diagnose_camera


def _cam(**overrides):
    base = {
        "Camera_Name": "cam3",
        "Status": "creating",
        "Surveillance_Status": "start",
        "Live": True,
        "Active": True,
        "FPS": 3,
    }
    base.update(overrides)
    return base


def test_surveillance_stopped_is_a_deliberate_state_not_a_fault():
    row = diagnose_camera(_cam(Surveillance_Status="stop"), verified_streaming=False)
    assert row["healthy"] is False
    assert row["confidence"] == "high"
    assert "manually stopped" in row["likely_cause"]
    assert "Start" in row["next_step"]


def test_stopped_wins_over_no_frames_rule():
    # Both are true here; the deliberate operator state is the real explanation.
    row = diagnose_camera(_cam(Surveillance_Status="stop"), verified_streaming=False)
    assert "stop" in row["observed_signal"]
    assert "RTSP" not in row["likely_cause"]


def test_paused_feed_points_to_play_control():
    row = diagnose_camera(_cam(Live=False), verified_streaming=False)
    assert row["healthy"] is False
    assert "paused" in row["observed_signal"].lower()
    assert "Play" in row["next_step"]


def test_offline_status_is_medium_confidence_with_network_and_rtsp_steps():
    row = diagnose_camera(_cam(Status="offline"), verified_streaming=False)
    assert row["healthy"] is False
    assert row["confidence"] == "medium"
    assert "network" in row["next_step"].lower()


def test_active_but_no_frames_is_diagnosed_as_stream_read_failure():
    row = diagnose_camera(_cam(Status="active"), verified_streaming=False)
    assert row["healthy"] is False
    assert "no video frames" in row["observed_signal"].lower()
    assert "RTSP" in row["likely_cause"]


def test_stale_creating_label_on_a_streaming_camera_is_healthy():
    # Observed live 2026-09-16: all three real cameras read Status 'creating'
    # while demonstrably streaming — the label is stale, the video is fine.
    row = diagnose_camera(_cam(Status="creating"), verified_streaming=True)
    assert row["healthy"] is True
    assert "stale" in row["likely_cause"].lower()


def test_creating_with_no_frames_is_transient_provisioning():
    row = diagnose_camera(_cam(Status="creating"), verified_streaming=None)
    assert row["healthy"] is False
    assert "provisioning" in row["likely_cause"].lower()


def test_low_configured_fps_is_reported_as_a_setting_not_a_measurement():
    row = diagnose_camera(_cam(Status="active", FPS=1), verified_streaming=True)
    assert row["healthy"] is True
    assert "configured" in row["observed_signal"].lower()
    assert "not a measured rate" in row["observed_signal"]


def test_fully_healthy_camera():
    row = diagnose_camera(_cam(Status="active"), verified_streaming=True)
    assert row["healthy"] is True
    assert row["confidence"] == "high"
    assert "No problem detected" in row["likely_cause"]


def test_healthy_without_a_frame_check_is_only_medium_confidence():
    row = diagnose_camera(_cam(Status="active"), verified_streaming=None)
    assert row["healthy"] is True
    assert row["confidence"] == "medium"


def test_build_diagnoses_puts_problems_first_and_counts_them():
    cameras = [
        _cam(Camera_Name="camA", Status="active"),
        _cam(Camera_Name="camB", Status="offline"),
        _cam(Camera_Name="camC", Surveillance_Status="stop"),
    ]
    result = build_diagnoses(cameras, {"camA": True, "camB": False, "camC": False})
    assert result["cameras_checked"] == 3
    assert result["cameras_with_issues"] == 2
    assert [d["camera"] for d in result["diagnoses"]][:2] == ["camB", "camC"]
    assert result["diagnoses"][-1]["camera"] == "camA"
    assert result["not_available"] == NOT_AVAILABLE


def test_build_diagnoses_skips_malformed_records():
    result = build_diagnoses([_cam(), "not a dict", None], {"cam3": True})
    assert result["cameras_checked"] == 1
