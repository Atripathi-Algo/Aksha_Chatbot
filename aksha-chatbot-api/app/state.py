"""
Chatbot state — see docs/CHATBOT_SYSTEM_ARCHITECTURE.md Section 2.1.

LangGraph's StateGraph wants a TypedDict (or a schema it can merge updates
into); the Pydantic models below are the logical contract for individual
pieces (entities, tool results, sources) used for validation at the edges,
matching the doc's own note that the implementation must fit the installed
runtime rather than force a single representation everywhere.
"""

from typing import Any, Literal, Optional, TypedDict

from pydantic import BaseModel, Field, field_validator


def _none_to_empty_list(v):
    """Groq's structured-output enforcement rejects a list field emitted as
    JSON null against a plain 'type: array' schema — the router's tool schema
    allows null for these fields (see app/router.py) precisely so the model
    can express 'no values' without tripping that validation, but that means
    our own Pydantic models need to coerce None back to [] on the way in."""
    return [] if v is None else v


class QueryEntities(BaseModel):
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    camera_ids: list[str] = Field(default_factory=list)
    camera_names: list[str] = Field(default_factory=list)
    alert_ids: list[str] = Field(default_factory=list)
    alert_types: list[str] = Field(default_factory=list)

    _coerce_lists = field_validator(
        "camera_ids", "camera_names", "alert_ids", "alert_types", mode="before"
    )(_none_to_empty_list)


class SourceRef(BaseModel):
    source_type: Literal["alert", "image", "video", "camera", "report", "document"]
    source_id: str
    label: str
    url: Optional[str] = None


class ToolResult(BaseModel):
    tool_name: str
    ok: bool
    data: dict[str, Any] = Field(default_factory=dict)
    error_code: Optional[str] = None
    message: Optional[str] = None
    retryable: bool = False
    latency_ms: int = 0  # Section 6.1's "Latency by node and tool" — see app/tool_registry.py's execute_tool


class RouterDecision(BaseModel):
    domain: str
    agent: str
    intent: str
    entities: QueryEntities = Field(default_factory=QueryEntities)
    risk_level: Literal["low", "medium", "high", "critical"] = "low"
    needs_clarification: bool = False
    clarification_question: Optional[str] = None
    clarification_options: list[str] = Field(default_factory=list)
    confidence: float = 0.0

    _coerce_options = field_validator("clarification_options", mode="before")(_none_to_empty_list)


class ChatbotState(TypedDict, total=False):
    schema_version: int
    thread_id: str
    turn_id: str
    user_query: str
    language: str  # 'en' | 'hi' | 'mr'
    normalized_query: str
    router: dict  # RouterDecision.model_dump()
    selected_agent: str
    tool_results: list[dict]  # list[ToolResult.model_dump()]
    source_refs: list[dict]  # list[SourceRef.model_dump()]
    frames: list[dict]  # alert frame images — see app/formatter.py's extract_frames
    analytics: list[dict]  # insights table/chart rows — see app/formatter.py's extract_analytics
    freshness: dict  # {"kind": "live"|"cached"|"degraded", "label": str}
    final_response: str
    response_status: str  # resolved | needs_clarification | denied | escalated | failed
    error: Optional[dict]
