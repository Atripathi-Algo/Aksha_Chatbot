"""
Output Formatter — Section 1.1 step 9 / Appendix A system prompt. Turns
structured tool findings into cited prose. Never invents a fact that isn't
already in the tool results — if every tool failed, it must say so plainly
(the "degraded answer" message type on the frontend), not paper over it.
"""

import json
from collections.abc import Iterator

from app.agents import AgentSpec
from app.state import SourceRef, ToolResult
from llm_client import LLMClient

_SYSTEM_PROMPT = """You are the Aksha Support Assistant's output formatter.
Use only the tool results provided — never invent alert facts, camera status, timestamps, or settings.
Write a concise, direct answer (2-4 sentences) for a security operator. No preamble, no "Based on the data provided".
Always keep a polite, courteous, professional tone — concise is not the same as curt. Never sound abrupt or
dismissive, even when the news is "no data" or "I can't confirm that."
If a tool failed, say plainly what you can't confirm right now — do not guess."""


def _build_messages(agent: AgentSpec, user_query: str, tool_results: list[ToolResult]) -> list[dict]:
    results_json = json.dumps([r.model_dump() for r in tool_results], default=str)
    return [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Operator's question: {user_query}\n"
                f"Answering as: {agent.label}\n"
                f"Tool results (JSON): {results_json}"
            ),
        },
    ]


def format_answer(agent: AgentSpec, user_query: str, tool_results: list[ToolResult], client: LLMClient) -> str:
    """Non-streaming variant, used by /v1/chat/invoke."""
    if not agent.implemented:
        return f"{agent.label} isn't implemented yet — this is Phase 1 work still in progress. Router classification worked correctly; the agent itself is a stub."
    if not tool_results:
        return "I wasn't able to determine what to look up for that question. Could you rephrase it with a specific camera name or time range?"
    if not any(r.ok for r in tool_results):
        failures = ", ".join(r.error_code or "UNKNOWN" for r in tool_results)
        return f"I couldn't retrieve that right now ({failures}). The underlying service may be unavailable — try again shortly."

    response = client.chat(_build_messages(agent, user_query, tool_results))
    return response.content or "I found results but couldn't summarize them — please try rephrasing."


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

    yield from client.stream_chat(_build_messages(agent, user_query, tool_results))


_LANGUAGE_NAMES = {"hi": "Hindi", "mr": "Marathi"}

_TRANSLATE_SYSTEM_PROMPT = """You are the Multi-Language Support layer for the Aksha chatbot.
Rephrase the given English answer in {language}. Preserve camera names, alert IDs, timestamps,
and URLs exactly as written in the original — do not translate or reformat them. Keep the same
facts and the same level of detail; do not add or drop information."""


def translate_stream(english_text: str, target_language: str, client: LLMClient) -> Iterator[str]:
    """Multi-Language Support is a formatter wrapper, not a tool-calling agent
    (Section 1.2) — this is called after the real agent's English answer is
    fully assembled, never as its own domain worker."""
    language_name = _LANGUAGE_NAMES.get(target_language, target_language)
    messages = [
        {"role": "system", "content": _TRANSLATE_SYSTEM_PROMPT.format(language=language_name)},
        {"role": "user", "content": english_text},
    ]
    yield from client.stream_chat(messages)


_FOLLOW_UP_SYSTEM_PROMPT = """You suggest follow-up questions for the Aksha support chatbot.
Given the operator's question, which agent answered, and the answer given, suggest up to 3 short,
natural follow-up questions the operator might genuinely ask next — grounded only in what the
answer actually said (camera names, groups, dates it mentioned), never inventing a new camera,
alert, or group name that wasn't in the answer. If the answer was a "no data" / "can't confirm"
result, prefer suggestions that make sense given that (e.g. try a different camera or range),
not questions that assume the missing data exists.
Reply with ONLY a JSON array of 0-3 short question strings, nothing else. Example:
["Which cameras are in the Perimeter group?", "Were there any alerts yesterday?"]
If no good follow-up applies, reply with an empty array: []"""


def suggest_follow_ups(agent: AgentSpec, user_query: str, answer_text: str, client: LLMClient) -> list[str]:
    """Best-effort, non-critical — cheap follow-up suggestions grounded in
    the turn just completed. Never let a parsing hiccup break the turn."""
    if not agent.implemented or not answer_text:
        return []
    messages = [
        {"role": "system", "content": _FOLLOW_UP_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"Agent: {agent.label}\nOperator's question: {user_query}\nAnswer given: {answer_text}",
        },
    ]
    try:
        response = client.chat(messages)
        suggestions = json.loads(response.content or "[]")
        if not isinstance(suggestions, list):
            return []
        return [str(s) for s in suggestions if isinstance(s, str) and s.strip()][:3]
    except Exception:
        return []


def extract_sources(tool_results: list[ToolResult]) -> list[SourceRef]:
    """Best-effort source extraction from tool result shapes we know about.
    Phase 1 tools return raw Node API JSON — this reads the common id/name
    fields rather than requiring every tool to pre-build SourceRefs."""
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
                label = item.get("Camera_Name") or item.get("group_name") or item.get("Alert_Name") or item.get("_id", "unknown")
                sources.append(SourceRef(source_type="camera" if key != "alerts" else "alert", source_id=str(item.get("_id", label)), label=str(label)))
    return sources
