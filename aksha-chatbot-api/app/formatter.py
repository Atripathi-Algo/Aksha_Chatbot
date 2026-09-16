"""
Output Formatter — Section 1.1 step 9 / Appendix A system prompt. Turns
structured tool findings into cited prose. Never invents a fact that isn't
already in the tool results — if every tool failed, it must say so plainly
(the "degraded answer" message type on the frontend), not paper over it.
"""

import json
import re
from collections.abc import Iterator

from langsmith import traceable

from app.agents import AgentSpec
from app.state import SourceRef, ToolResult
from llm_client import LLMClient

_SYSTEM_PROMPT = """You are the Aksha Support Assistant's output formatter.
Use only the tool results provided — never invent alert facts, camera status, timestamps, or settings.
Write a concise, direct answer (2-4 sentences) for a security operator. No preamble, no "Based on the data provided".
Always keep a polite, courteous, professional tone — concise is not the same as curt. Never sound abrupt or
dismissive, even when the news is "no data" or "I can't confirm that."
If a tool failed, say plainly what you can't confirm right now — do not guess.
Plain prose only — no markdown. Never wrap words in ** or * or _ for emphasis, and never use markdown
headings, bullet lists, or backtick code spans. The chat surface renders this text exactly as written, so
markdown syntax shows up as literal asterisks and underscores instead of formatting anything."""


MAX_RESULT_CHARS = 12000


def compact_results_json(tool_results: list[ToolResult]) -> str:
    results_json = json.dumps([r.model_dump() for r in tool_results], default=str)
    if len(results_json) <= MAX_RESULT_CHARS:
        return results_json
    return results_json[:MAX_RESULT_CHARS] + '...[result truncated; use summary fields above]'


def _build_messages(agent: AgentSpec, user_query: str, tool_results: list[ToolResult]) -> list[dict]:
    results_json = compact_results_json(tool_results)
    # Found live 2026-09-04: this used to send only agent.label ("Alert
    # Investigation") — the agent's own system_prompt, full of the domain
    # rules that shaped which tools got called in the first place (which
    # fields are the real answer vs. internal noise, exact terminology),
    # never reached this step at all. Result: given get_cameras' raw
    # `Alert: [ObjectId, ...]` reference array sitting next to
    # get_alerts_by_camera's real `Alert_Name` and get_recent_alerts' actual
    # timestamped occurrences, the model had nothing telling it the ObjectId
    # array was noise, and wrote the answer from that instead of the real
    # data. Forwarding the same domain rules here that the tool-calling step
    # already had is the fix, not a formatter-side special case.
    return [
        {"role": "system", "content": f"{_SYSTEM_PROMPT}\n\nDomain rules for {agent.label}:\n{agent.system_prompt}"},
        {
            "role": "user",
            "content": (
                f"Operator's question: {user_query}\n"
                f"Tool results (JSON): {results_json}"
            ),
        },
    ]


@traceable(run_type="chain", name="formatter.format_answer")
def format_answer(agent: AgentSpec, user_query: str, tool_results: list[ToolResult], client: LLMClient) -> str:
    """Non-streaming variant, used by /v1/chat/invoke."""
    if not agent.implemented:
        return f"{agent.label} isn't implemented yet — this is Phase 1 work still in progress. Router classification worked correctly; the agent itself is a stub."
    if not tool_results:
        return "I wasn't able to determine what to look up for that question. Could you rephrase it with a specific camera name or time range?"
    if not any(r.ok for r in tool_results):
        failures = ", ".join(r.error_code or "UNKNOWN" for r in tool_results)
        return f"I couldn't retrieve that right now ({failures}). The underlying service may be unavailable — try again shortly."

    # Cheap tier (Section 4.6/4.5 #2): templated prose over already-verified
    # tool JSON, not open-ended reasoning — fires on every resolved turn.
    response = client.chat(_build_messages(agent, user_query, tool_results), tier="cheap", node=f"formatter:{agent.key}")
    return response.content or "I found results but couldn't summarize them — please try rephrasing."


@traceable(run_type="chain", name="formatter.stream_answer")
def stream_answer(agent: AgentSpec, user_query: str, tool_results: list[ToolResult], client: LLMClient) -> Iterator[str]:
    """Streaming variant, used by /v1/chat/stream. Falls back to yielding a
    single chunk for the non-LLM cases (stub agent, no results, all failed)
    so the SSE consumer doesn't need two code paths."""
    if not agent.implemented:
        yield f"{agent.label} isn't implemented yet — this is Phase 1 work still in progress. Router classification worked correctly; the agent itself is a stub."
        return
    if not tool_results:
        yield "I wasn't able to determine what to look up for that question. Could you rephrase it with a specific camera name or time range?"
        return
    if not any(r.ok for r in tool_results):
        failures = ", ".join(r.error_code or "UNKNOWN" for r in tool_results)
        yield f"I couldn't retrieve that right now ({failures}). The underlying service may be unavailable — try again shortly."
        return

    yield from client.stream_chat(_build_messages(agent, user_query, tool_results), tier="cheap", node=f"formatter:{agent.key}")


_LANGUAGE_NAMES = {"hi": "Hindi", "mr": "Marathi"}

_TRANSLATE_SYSTEM_PROMPT = """You are the Multi-Language Support layer for the Aksha chatbot.
Rephrase the given English answer in {language}. Preserve camera names, alert IDs, timestamps,
and URLs exactly as written in the original — do not translate or reformat them. Keep the same
facts and the same level of detail; do not add or drop information."""


@traceable(run_type="chain", name="formatter.translate_stream")
def translate_stream(english_text: str, target_language: str, client: LLMClient) -> Iterator[str]:
    """Multi-Language Support is a formatter wrapper, not a tool-calling agent
    (Section 1.2) — this is called after the real agent's English answer is
    fully assembled, never as its own domain worker."""
    language_name = _LANGUAGE_NAMES.get(target_language, target_language)
    messages = [
        {"role": "system", "content": _TRANSLATE_SYSTEM_PROMPT.format(language=language_name)},
        {"role": "user", "content": english_text},
    ]
    yield from client.stream_chat(messages, tier="cheap", node="translator")


def _normalize_question(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def suggest_follow_ups(agent: AgentSpec, tool_results: list[ToolResult], user_query: str = "") -> list[str]:
    """Return suggestions built only from verified tool-result entities."""
    if not agent.implemented:
        return []

    camera_names: list[str] = []
    for result in tool_results:
        if agent.key == "insights_analytics":
            for name, value in result.data.items():
                if isinstance(value, dict) and ("alerts" in value or "object_detection_alerts" in value):
                    if name not in camera_names:
                        camera_names.append(str(name))
        for key in ("cameras", "groups", "alerts"):
            items = result.data.get(key)
            if key == "cameras" and isinstance(items, dict):
                for name in items:
                    if name not in camera_names:
                        camera_names.append(str(name))
                continue
            if not isinstance(items, list):
                continue
            for item in items:
                if not isinstance(item, dict):
                    continue
                name = item.get("Camera_Name") or item.get("cameraName") or item.get("camera_name")
                if name and name not in camera_names:
                    camera_names.append(str(name))

    # Rewording a suggestion doesn't make it a follow-up if it's still about
    # the same camera the operator already named — e.g. a single-camera
    # insights query has exactly one camera_name, which is the camera already
    # asked about, so any per-camera template just reconstructs the same
    # question. Exclude cameras already named in the query before templating,
    # rather than only catching an exact-text repeat after the fact.
    query_lower = user_query.lower()
    other_cameras = [name for name in camera_names if name.lower() not in query_lower]

    if agent.key == "insights_analytics":
        # No specific date here — tool_results never preserves the query's
        # own date range (ToolResult has no `args` field), and past bug: this
        # used to hardcode a literal date ("...on 2026-09-03") regardless of
        # what range was actually queried, so it suggested the wrong date for
        # any query not about that exact day. "Same period" is always true of
        # another camera in the same report result, without inventing a date.
        candidates = [
            f"How many alerts did {camera_name} have during the same period?"
            for camera_name in other_cameras[:2]
        ] or ["Give me the insight report for the last 7 days."]
    elif agent.key == "alert_investigation":
        candidates = [f"Show alerts for {camera_name}." for camera_name in other_cameras[:2]] or [
            "Show me the alerts from the last 24 hours."
        ]
    elif agent.key == "camera_operations":
        candidates = [f"What settings are configured for {camera_name}?" for camera_name in other_cameras[:2]] or [
            "Show the camera groups."
        ]
    elif agent.key == "live_monitoring":
        candidates = [f"Is {camera_name} live right now?" for camera_name in other_cameras[:2]] or [
            "Which cameras are live right now?"
        ]
    else:
        candidates = []

    # A "follow-up" that's just the question the operator already asked
    # (e.g. the only camera found is the one they asked about) isn't a
    # suggestion — filter it out rather than echo it back.
    asked = _normalize_question(user_query)
    return [c for c in candidates if _normalize_question(c) != asked]


def _first_str(value):
    """Some Node records store what should be a scalar (e.g. an alert rule's
    Camera_Name) as a one-element list — unwrap it rather than let str() turn
    it into the literal text "['cam3']"."""
    if isinstance(value, list):
        return str(value[0]) if value else None
    return str(value) if value else None


def _tokenize(text) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", str(text).lower()))


def _matches_camera_filter(name, camera_filter: list[str] | None) -> bool:
    """Token-based bidirectional subset match, not raw-character substring —
    the router's extracted camera_names entity is what the operator said
    ("gate camera", space-separated), which won't line up character-for-
    character with the database's real Camera_Name ("cam1-Gate-Camera",
    hyphen-separated) even though they mean the same camera. Found live
    2026-09-04: a raw substring check missed this pairing entirely and
    dropped every frame instead of matching.

    A punctuation-stripped raw-substring fix closed that but over-matched in
    turn: "cam1" is a character substring of "cam11", so a query about cam1
    also pulled cam11's frames/sources — a real regression risk given how
    safety-sensitive this filter is (see tests/test_camera_filter.py).
    Comparing whole alphanumeric TOKENS instead of characters fixes this —
    {"cam1"} and {"cam11"} don't collide as tokens, while "gate camera"
    still matches "cam1-Gate-Camera" because {"gate", "camera"} is a subset
    of {"cam1", "gate", "camera"}. An exact-match filter would silently drop
    everything instead of over-including; subset containment either way is
    still the safer bias."""
    if not camera_filter:
        return True
    name_tokens = _tokenize(name)
    if not name_tokens:
        return False
    for c in camera_filter:
        c_tokens = _tokenize(c)
        if c_tokens and (name_tokens <= c_tokens or c_tokens <= name_tokens):
            return True
    return False


def extract_sources(tool_results: list[ToolResult], camera_filter: list[str] | None = None) -> list[SourceRef]:
    """Best-effort source extraction from tool result shapes we know about.
    Phase 1 tools return raw Node API JSON — this reads the common id/name
    fields rather than requiring every tool to pre-build SourceRefs.

    camera_filter — the router's resolved entities.camera_names, when the
    operator named a specific camera. Several tools (get_recent_alerts,
    get_cameras) always return every camera regardless of what was asked;
    without this, asking about one camera showed sources for all of them."""
    sources: list[SourceRef] = []
    for r in tool_results:
        if not r.ok:
            continue
        for key in ("cameras", "groups", "alerts"):
            items = r.data.get(key)
            if not isinstance(items, list):
                continue
            for item in items[:5]:
                if not isinstance(item, dict):
                    continue
                if key == "alerts":
                    # get_recent_alerts' per-camera {cameraName, images} buckets
                    # are frame material (extract_frames), not a text source —
                    # surfacing them here just duplicates the camera list with
                    # a fake "alert" pill for the same camera.
                    if "images" in item:
                        continue
                    label = _first_str(item.get("Alert_Name")) or _first_str(item.get("Camera_Name")) or _first_str(item.get("cameraName"))
                    source_type = "alert"
                    # get_alerts_by_camera is already scoped to one camera per
                    # call, so this is normally redundant — but stays correct
                    # if a turn ever calls it for more than one camera.
                    camera_hint = _first_str(item.get("Camera_Name")) or _first_str(item.get("cameraName"))
                elif key == "groups":
                    label = _first_str(item.get("group_name"))
                    source_type = "camera"
                    camera_hint = None  # a group isn't one camera's identity — never filtered
                else:
                    label = _first_str(item.get("Camera_Name"))
                    source_type = "camera"
                    camera_hint = label
                # Only filter when we could actually determine which camera
                # this item belongs to — an unknown camera_hint is shown
                # rather than risk hiding something relevant.
                if camera_hint is not None and not _matches_camera_filter(camera_hint, camera_filter):
                    continue
                raw_id = item.get("_id")
                source_id = _first_str(raw_id) or label or "unknown"
                sources.append(SourceRef(source_type=source_type, source_id=source_id, label=label or "unknown"))
    return sources


_ALERT_IMAGE_TS_RE = re.compile(r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})_alert")
MAX_FRAMES = 6
FRAMES_PER_CAMERA = 3


def extract_frames(tool_results: list[ToolResult], camera_filter: list[str] | None = None) -> list[dict]:
    """Alert frame images — sourced only from get_recent_alerts' per-camera
    {cameraName, images} buckets. get_alerts_by_camera returns rule config,
    never images, so it never contributes frames. Every URL here is echoed
    verbatim from the Node API — never constructed or guessed.

    Found live 2026-09-04: get_recent_alerts has no camera parameter — it
    always returns every camera's bucket, so asking about cam3 showed cam1's
    alert photos too. camera_filter (the router's resolved camera_names)
    restricts frames to the camera(s) actually asked about, when any were."""
    frames: list[dict] = []
    for r in tool_results:
        if not r.ok:
            continue
        items = r.data.get("alerts")
        if not isinstance(items, list):
            continue
        for item in items:
            if not isinstance(item, dict):
                continue
            camera = item.get("cameraName")
            images = item.get("images")
            if not camera or not isinstance(images, list):
                continue
            if not _matches_camera_filter(camera, camera_filter):
                continue
            for url in images[:FRAMES_PER_CAMERA]:
                if not isinstance(url, str):
                    continue
                match = _ALERT_IMAGE_TS_RE.search(url)
                frames.append({
                    "url": url,
                    "camera": str(camera),
                    "date": match.group(1) if match else None,
                    "time": match.group(2) if match else None,
                })
    return frames[:MAX_FRAMES]


def extract_analytics(tool_results: list[ToolResult]) -> list[dict]:
    """Table/chart rows for Insights & Analytics — built deterministically
    from the same tool_results the prose answer is grounded in, never asked
    of the LLM. An LLM is unreliable at emitting well-formed structured JSON
    consistently turn after turn; this reads the same data get_insight_report
    already returned, the same way extract_sources/extract_frames do for
    their agents.

    get_insight_report's camera dict is already sorted highest-alert-count-
    first (tools_insights.py's _prepare_camera_report) — this preserves that
    order rather than re-sorting, so the table/chart and the prose always
    agree on ranking. Only ever produces rows when a tool_result actually has
    the insight-report shape, so it's naturally empty for every other agent
    without needing an agent-key check here."""
    report = None
    priorities: dict[str, str] = {}

    for r in tool_results:
        if not r.ok or not isinstance(r.data, dict):
            continue
        cameras = r.data.get("cameras")
        if isinstance(cameras, list):
            # get_cameras' result, called by this agent only to annotate
            # Priority — collect it per camera name.
            for cam in cameras:
                if not isinstance(cam, dict):
                    continue
                name = _first_str(cam.get("Camera_Name"))
                priority = cam.get("Priority")
                if name and priority:
                    priorities[name] = str(priority)
            continue
        if r.data and all(isinstance(v, dict) and "total_alerts_generated" in v for v in r.data.values()):
            report = r.data

    if not report:
        return []

    rows = []
    for camera, info in report.items():
        if not isinstance(info, dict):
            continue
        object_alerts = info.get("object_detection_alerts") or {}
        top_object = max(object_alerts, key=object_alerts.get) if object_alerts else None
        peak_hour = info.get("peak_alert_time_hour")
        rows.append({
            "camera": str(camera),
            "priority": priorities.get(camera),
            "alert_count": info.get("total_alerts_generated", 0),
            "peak_hour": f"{peak_hour:02d}:00" if isinstance(peak_hour, int) else None,
            "top_object": top_object,
        })
    return rows
