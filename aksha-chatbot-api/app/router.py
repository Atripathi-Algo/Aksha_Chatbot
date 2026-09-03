"""
Supervisor Router — see docs/CHATBOT_SYSTEM_ARCHITECTURE.md Section 1.2.

The router is a constrained model call: it must return one structured route,
not free text. Implemented by forcing a single tool call (emit_route) whose
schema is the RouterDecision model, so a malformed or out-of-catalog agent
name is a validation error, not a guess.
"""

import json
import re

from app.agents import AGENTS, ROUTER_AGENT_CHOICES
from app.logging_config import get_logger
from app.state import RouterDecision
from llm_client import LLMClient

logger = get_logger(component="router")

_ROUTE_TOOL = {
    "type": "function",
    "function": {
        "name": "emit_route",
        "description": "Classify the operator's question and extract entities.",
        "parameters": {
            "type": "object",
            "properties": {
                "domain": {"type": "string"},
                "agent": {"type": "string", "enum": ROUTER_AGENT_CHOICES},
                "intent": {"type": "string", "description": "Short snake_case intent name, e.g. search_alerts."},
                "entities": {
                    "type": "object",
                    "properties": {
                        "date": {"type": ["string", "null"], "description": "Resolved to an actual YYYY-MM-DD date, never a relative word like 'today'."},
                        "camera_names": {"type": ["array", "null"], "items": {"type": "string"}},
                        "alert_ids": {"type": ["array", "null"], "items": {"type": "string"}},
                        "alert_types": {"type": ["array", "null"], "items": {"type": "string"}},
                    },
                },
                "risk_level": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
                "needs_clarification": {"type": "boolean"},
                "clarification_question": {"type": ["string", "null"]},
                "clarification_options": {"type": ["array", "null"], "items": {"type": "string"}},
                "confidence": {"type": "number"},
            },
            "required": ["domain", "agent", "intent"],
        },
    },
}

_SYSTEM_PROMPT = f"""You are the Supervisor Router for the Aksha support chatbot.
Classify the operator's question into exactly one agent from this list: {", ".join(ROUTER_AGENT_CHOICES)}.
Agent descriptions:
{chr(10).join(f"- {a.key}: {a.label}" for a in AGENTS.values())}

Disambiguation rules (apply these before guessing):
- "Which cameras have X setting enabled" (email alerts on/off, detection features, priority),
  scoped to specific cameras, is camera_operations — it's about camera configuration.
- Questions about a camera's or the system's *current* state right now — "is X online right now",
  "at this moment", "currently", spotlight view, what's live — are live_monitoring, not
  camera_operations, even though they mention a camera by name. camera_operations is for static
  configuration (settings, groups, FPS, detection features); live_monitoring is for present-moment
  status.
- General questions about notification configuration ("what are the email notification settings",
  "who gets notified for group X", recipient lists, delivery history) are notification — that agent
  owns notification config and delivery data, not just "was this one alert delivered".
- "How do I...", "What does X mean", "How does X work" about the product's own features or
  capabilities (including whether/how it supports multiple languages) is help_guide — even if it
  mentions cameras, alerts, or notifications by name, as long as it isn't asking for live data.
- "What does THIS mean" about a SPECIFIC error message, status value, or code the operator saw
  (e.g. quoting or describing an exact message, a camera status like "stop"/"creating", or an
  alert type like "RTSP Error") is error_explanation, not help_guide — help_guide is for
  conceptual/how-to questions about product features in general, error_explanation is for
  decoding one specific thing the operator is looking at right now.
- Questions with no camera/alert/date reference at all and a conceptual/definitional phrasing
  ("how do X and Y relate") default to help_guide, not to whichever agent happens to own X or Y.

Resolve relative dates (e.g. "today", "yesterday") to actual dates using the current date provided.
If the question is ambiguous (e.g. multiple cameras could match a name), set needs_clarification=true
and provide clarification_options. You must call emit_route exactly once — never answer in free text."""


def route(user_query: str, current_date_iso: str, client: LLMClient) -> RouterDecision:
    # Count/report questions have an unambiguous local owner. Keeping this
    # guard ahead of the model prevents "how many alerts" from being confused
    # with an alert-list lookup by the supervisor model.
    query_lower = user_query.lower()
    is_alert_count = (
        "alert" in query_lower
        and ("how many" in query_lower or "total" in query_lower or "count" in query_lower)
    )
    is_report_query = bool(re.search(r"\b(insight|kpi)\s+(report|data|count|summary)", query_lower))
    if is_alert_count or is_report_query:
        return RouterDecision(
            domain="insights_analytics",
            agent="insights_analytics",
            intent="report_counts",
            confidence=1.0,
        )

    messages = [
        {"role": "system", "content": f"{_SYSTEM_PROMPT}\nCurrent date: {current_date_iso}"},
        {"role": "user", "content": user_query},
    ]
    result = client.chat(messages, tools=[_ROUTE_TOOL])

    if not result.tool_calls:
        logger.warning("router_no_tool_call", content=result.content)
        return RouterDecision(
            domain="help_guide", agent="help_guide", intent="fallback",
            needs_clarification=True,
            clarification_question="I couldn't classify that question — could you rephrase it?",
        )

    raw_args = result.tool_calls[0]["arguments"]
    try:
        parsed = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
        return RouterDecision.model_validate(parsed)
    except Exception as e:
        logger.warning("router_invalid_route", error=str(e), raw=raw_args)
        return RouterDecision(
            domain="help_guide", agent="help_guide", intent="fallback",
            needs_clarification=True,
            clarification_question="I couldn't classify that question — could you rephrase it?",
        )
