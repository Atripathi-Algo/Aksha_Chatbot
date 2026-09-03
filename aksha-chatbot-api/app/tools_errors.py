"""
Error & Status Explanation tool — Phase 1 candidate, orange (see note below).

IMPORTANT — grounding note: a repo-wide search (2026-08-27) found NO numeric or
coded error scheme anywhere in the Aksha codebase (no `ERR_xxx`, no
`error_code`/`status_code` catalog file, nothing across
AkshaV2-UIUX/backend, AkshaV2-UIUX/frontend, ServiceAPI, Anomaly_model_training,
Aksha_Pipeline, or the Yolo pipelines). SUPPORT_CHATBOT_AGENT_CATALOG.md's
original vision for this agent — "sanitized error codes... with dependency
status" — describes a backend capability that does not exist yet; that's
exactly why the catalog classifies it "orange" (minor backend change
required), not "green". Building a live, dependency-status-aware version of
this agent is out of scope until that backend work lands.

What IS real and verified, and what this tool is grounded in instead: a
fixed set of literal HTTP `message:` strings the Node backend actually
returns on 4xx/5xx responses, a couple of real status-field values
(`Status`, `Surveillance_Status`, `Live`, `PausedTime`), and the
`"RTSP Error"` alert type plus its real log/notification text. Every entry
below is a verbatim string from source, with the file it came from. This is
a static glossary lookup — like search_docs — not a live tool; there is no
API that reports "the current error for camera X" to call.

If the operator's message/status doesn't match anything here, the agent
must say so — never invent a plausible-sounding meaning for an unfamiliar
string, and never claim a numeric error-code catalog exists.
"""

import re

from pydantic import BaseModel, Field

from app.tool_registry import ToolSpec, register_tool

_STOPWORDS = {"the", "a", "an", "is", "are", "do", "does", "what", "why", "i", "to", "for", "of", "in", "on", "and", "or", "my", "this", "it", "mean", "means", "get", "got", "see", "seeing"}

# Every `message` verbatim from a real 4xx/5xx Express response, or a real
# status-field value, plus a plain-English gloss and what to do next.
# Source column is the file the string was found in during the 2026-08-27
# audit — kept for traceability, not shown to the operator verbatim.
_ENTRIES = [
    {"code": "creating", "field": "Status", "meaning": "The camera was just added and is still being provisioned by the backend.", "action": "Wait a moment and refresh — this is a transient state right after creating a camera, not an error.", "source": "backend/src/routes/cameras.js"},
    {"code": "offline", "field": "Status", "meaning": "The camera is not currently connected or available to the Aksha backend.", "action": "Check that the camera is powered on and reachable over the network, then verify its RTSP link and refresh the camera status.", "source": "Aksha camera status field"},
    {"code": "start", "field": "Surveillance_Status", "meaning": "Surveillance/monitoring is currently active for this camera.", "action": "No action needed. The camera's menu shows a 'Stop' option while this is the case.", "source": "backend/src/models/configSchema.js, frontend video_menu"},
    {"code": "stop", "field": "Surveillance_Status", "meaning": "Surveillance/monitoring has been manually stopped for this camera. The live view shows a black placeholder image instead of the feed.", "action": "Use the camera's menu 'Start' option to resume monitoring if this wasn't intentional.", "source": "backend/src/models/configSchema.js, frontend Camera.jsx"},
    {"code": "Live: false", "field": "Live", "meaning": "The camera feed has been paused by an operator using the Play/Pause control. PausedTime records the timestamp of the last frame before pausing.", "action": "Use the Play control to resume the live feed.", "source": "backend/src/routes/cameras.js (ENABLECAMERA route)"},
    {"code": "RTSP Error", "field": "Alert Type", "meaning": "The detection pipeline lost its RTSP video connection to this camera — the pipeline could not read a frame from the camera's stream.", "action": "Check the camera's network connection and RTSP link. A follow-up notification is sent automatically once the connection recovers.", "source": "Aksha_Pipeline/surveillance.py, notification.py"},
    {"code": "please fill the missing information", "meaning": "A required field was left blank when creating or updating a camera.", "action": "Check the form for empty required fields and resubmit.", "source": "backend/src/routes/cameras.js"},
    {"code": "camera name already exists", "meaning": "You tried to create a camera with a name that's already in use.", "action": "Choose a different, unique camera name.", "source": "backend/src/routes/cameras.js"},
    {"code": "unable to get cameras", "meaning": "The camera list could not be retrieved — a backend/database read failed.", "action": "Retry; if it persists, this points to a backend or database issue, not a data problem.", "source": "backend/src/routes/cameras.js"},
    {"code": "unable to update camera", "meaning": "Saving changes to a camera's settings failed.", "action": "Retry the update; check that all fields are valid.", "source": "backend/src/routes/cameras.js"},
    {"code": "Camera limit exceeded", "meaning": "The account/site has reached its maximum allowed number of cameras and cannot add another.", "action": "Remove an existing camera or contact an administrator to increase the camera limit.", "source": "backend/src/routes/cameras.js (calls an AWS Lambda camera-limit check)"},
    {"code": "Group not found", "meaning": "The camera group ID or name referenced doesn't exist.", "action": "Double-check the group name/ID, or it may have been deleted.", "source": "backend/src/routes/cameraGroup.js"},
    {"code": "Group name already exists", "meaning": "A camera group with that name already exists.", "action": "Choose a different group name.", "source": "backend/src/routes/cameraGroup.js"},
    {"code": "Some cameras already assigned to another group", "meaning": "One or more cameras you tried to add to this group already belong to a different group.", "action": "Remove those cameras from their current group first, or pick different cameras.", "source": "backend/src/routes/cameraGroup.js"},
    {"code": "Camera group not found", "meaning": "The camera group referenced in a notification-configuration request doesn't exist.", "action": "Verify the group still exists before configuring its notifications.", "source": "backend/src/routes/cameraNotificationManager.js"},
    {"code": "Notification manager not found", "meaning": "No notification configuration exists yet for this camera group.", "action": "This is expected until someone sets up notifications for the group — it isn't a failure.", "source": "backend/src/routes/cameraNotificationManager.js"},
    {"code": "No data found for the requested date range", "meaning": "The insight report has no recorded data for the date/time window you asked about.", "action": "Try a different date range, or this may mean nothing was recorded yet for that period.", "source": "backend/src/routes/insightReport.js"},
    {"code": "No data found for camera", "meaning": "The insight report has no data for the specific camera you asked about, even though the date range has data for other cameras.", "action": "Check the camera name, or it may genuinely have no recorded activity in that window.", "source": "backend/src/routes/insightReport.js"},
    {"code": "Docker daemon was inactive for the day, no data found", "meaning": "The backend's data-collection process wasn't running for that day, so no insight data was recorded.", "action": "This points to an infrastructure/daemon issue on that specific day, not a data-entry mistake.", "source": "backend/src/routes/insightReport.js"},
    {"code": "No KPI data found for the given criteria", "meaning": "No KPI report data matches the cameras/date range you specified.", "action": "Try broadening the date range or double-check the camera list.", "source": "backend/src/routes/kpiReport.js"},
    {"code": "AKSHA_PATH not set in .env", "meaning": "A server configuration variable (AKSHA_PATH) is missing — this is a backend deployment issue, not something an operator can fix.", "action": "Report this to platform engineering; it means the backend is misconfigured.", "source": "backend/src/routes/kpiReport.js"},
    {"code": "Video not found.", "meaning": "The requested insight heatmap video hasn't been generated yet or doesn't exist for that camera/date range.", "action": "Try again after some time, or verify the camera and date range.", "source": "backend/src/routes/insight.js"},
    {"code": "Video is still being formed. Please wait", "meaning": "The insight heatmap video is currently being generated in the background.", "action": "Wait and check again shortly — this isn't an error.", "source": "backend/src/routes/insight.js"},
    {"code": "Could not generate insight video", "meaning": "The backend's request to generate an insight heatmap video failed.", "action": "Retry; if it persists, the video-generation service may be down.", "source": "backend/src/routes/insight.js"},
    {"code": "please provide required field", "meaning": "A required field was missing from an alert-related request.", "action": "Check the request for missing required fields.", "source": "backend/src/routes/alerts.js"},
    {"code": "Unable to find alert", "meaning": "The specific alert you referenced (by ID or filter) doesn't exist.", "action": "Double-check the alert ID or search criteria.", "source": "backend/src/routes/alerts.js"},
    {"code": "unable to found alert", "meaning": "No alerts matched the query (same meaning as 'Unable to find alert', different endpoint).", "action": "Double-check the search criteria — camera name, time window, or alert ID.", "source": "backend/src/routes/myAlerts.js"},
]


class ExplainErrorInput(BaseModel):
    query: str = Field(description="The exact error/status message or code the operator saw, or a description of it, verbatim.")


def _score(query_terms: set[str], entry: dict) -> int:
    haystack = (entry["code"] + " " + entry["meaning"]).lower()
    return sum(1 for term in query_terms if term in haystack)


def _explain_error(params: ExplainErrorInput) -> dict:
    query_lower = params.query.lower()
    # Exact/substring match on the literal code/message first — this is the
    # strongest signal since operators often paste the message verbatim.
    exact = [e for e in _ENTRIES if e["code"].lower() in query_lower or query_lower in e["code"].lower()]
    if exact:
        return {"results": [{"code": e["code"], "meaning": e["meaning"], "action": e["action"]} for e in exact[:3]]}

    terms = {t for t in re.findall(r"[a-z0-9]+", query_lower) if t not in _STOPWORDS and len(t) > 2}
    if not terms:
        return {"results": []}
    scored = [(e, _score(terms, e)) for e in _ENTRIES]
    scored = [(e, s) for e, s in scored if s > 0]
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return {"results": [{"code": e["code"], "meaning": e["meaning"], "action": e["action"]} for e, _ in scored[:3]]}


def register() -> None:
    register_tool(
        ToolSpec(
            name="explain_error_or_status",
            domain="error_explanation",
            description=(
                "Look up the plain-English meaning of a specific error message or status value an operator saw in "
                "the Aksha app (e.g. a camera Status/Surveillance_Status value, or an API error message). Static "
                "lookup only — there is no numeric error-code catalog in this system and no live dependency-status "
                "check; if nothing matches, say so rather than guessing."
            ),
            input_model=ExplainErrorInput,
            handler=_explain_error,
        )
    )
