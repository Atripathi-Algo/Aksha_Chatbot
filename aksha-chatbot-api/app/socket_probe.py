"""
Real-time verification for Live Monitoring — Section 9b flagged this as
"still open, not part of Phase 1 scope: Socket.IO live-push for Live
Monitoring (currently REST-snapshot only)".

Found live 2026-09-16, probing the real deployed node_backend directly: there
is no separate camera-status "push" channel to subscribe to instead of
polling. The only real-time Socket.IO traffic on this backend is a raw
per-camera video-frame stream — one event channel per camera, named exactly
by its Camera_Name (`cam1-Gate-Camera`, `cam2`, `cam3`), continuously
emitting binary JPEG frames. This is the same channel the frontend's
"Watch live" feature already subscribes to
(AkshaV2-UIUX/frontend/src/component/chatbot/ChatbotWidget.jsx). There is no
online/offline or "which cameras are live" presence event to consume — the
doc's original framing assumed one exists; it doesn't.

So "real push instead of REST polling" for this agent means something
narrower but still genuinely useful: briefly subscribe to the named
cameras' frame channels and check whether a frame actually arrives, instead
of only trusting the REST snapshot's claim. This turns "the API says these
cameras are live" into "we just confirmed video is actually arriving right
now" — a real freshness upgrade even without a presence-push channel to
consume, and it can catch a camera the REST snapshot claims is live but
whose feed has actually stalled.
"""

import os
import time

import socketio

from app.logging_config import get_logger

logger = get_logger(component="socket_probe")

NODE_SOCKET_URL = os.getenv("NODE_API_BASE_URL", "http://localhost:5000")
# Measured live 2026-09-16 against three cameras configured at 3 FPS: a 1.5s
# listen window was flaky — in 2 of 3 back-to-back runs it reported a
# camera as NOT streaming that demonstrably was (frame delivery over the
# socket is bursty, not a steady 333ms cadence). 3s and 6s windows were
# correct for every camera on every run. A false "no frames" here becomes a
# false "camera is broken" answer downstream, so the default sits above the
# shortest window that measured reliable, trading ~2.5s of turn latency for
# not misdiagnosing a healthy feed. Tunable via LIVE_PROBE_TIMEOUT_SECONDS.
PROBE_TIMEOUT_SECONDS = float(os.getenv("LIVE_PROBE_TIMEOUT_SECONDS", "4.0"))
MAX_PROBE_CAMERAS = 10  # bound worst-case turn latency regardless of how many the REST snapshot lists


def probe_streaming(camera_names: list[str], timeout_seconds: float = PROBE_TIMEOUT_SECONDS) -> dict[str, bool]:
    """Connect once, listen for the named cameras' frame events for a short
    window, and report which ones actually emitted at least one frame in
    that window. Best-effort: any connection failure reports every camera as
    unverified (False) rather than raising — this is a freshness upgrade
    layered on top of the REST snapshot, never a replacement for it, so it
    must degrade quietly if the Socket.IO endpoint is unreachable."""
    camera_names = camera_names[:MAX_PROBE_CAMERAS]
    if not camera_names:
        return {}

    seen: dict[str, bool] = {name: False for name in camera_names}
    wanted = set(camera_names)

    sio = socketio.Client(logger=False, engineio_logger=False)

    @sio.on("*")
    def _on_any_event(event, *_args):
        if event in wanted:
            seen[event] = True

    try:
        sio.connect(NODE_SOCKET_URL, wait_timeout=min(timeout_seconds, 3.0))
    except Exception as e:
        logger.warning("live_probe_connect_failed", url=NODE_SOCKET_URL, error=str(e))
        return seen

    try:
        time.sleep(timeout_seconds)
    except Exception:
        pass
    finally:
        try:
            sio.disconnect()
        except Exception:
            pass

    return seen
