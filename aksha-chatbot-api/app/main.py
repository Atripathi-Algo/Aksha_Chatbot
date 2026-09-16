"""
Aksha Chatbot API — Phase 0 foundation service.

No authentication yet: explicit development-time decision (Section 0.3 Identity
row still applies once JWT work lands — see Section 5.6 for the known gaps).
CORS is wide open for the same reason — do not deploy this file as-is.
"""

import time
import uuid
from datetime import date
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from app import (
    conversation_store,
    tools_alerts,
    tools_camera,
    tools_errors,
    tools_help,
    tools_insights,
    tools_live,
    tools_notification,
    tools_timeline,
    tools_troubleshooting,
)
from app.agent_executor import run_agent
from app.agents import AGENTS
from app.cost_tracker import get_daily_summary
from app.formatter import extract_analytics, extract_frames, extract_sources, format_answer, stream_answer, suggest_follow_ups, translate_stream
from app.graph import get_graph
from app.logging_config import bind_turn_context, clear_turn_context, configure_logging, get_logger
from app.router import route
from app.state import ToolResult
from llm_client import LLMClient

configure_logging()
logger = get_logger(component="main")

tools_camera.register()
tools_alerts.register()
tools_live.register()
tools_insights.register()
tools_notification.register()
tools_help.register()
tools_errors.register()
tools_troubleshooting.register()
tools_timeline.register()
tools_help.warm_up()  # pay the embedding cold-start cost now, not on an operator's first query

app = FastAPI(title="Aksha Chatbot API", version="0.1.0-phase0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # no-auth dev mode — tighten before any real deployment
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    thread_id: str
    user_query: str
    # Audit finding (second pass, 2026-09-16): this used to be a bare `str`,
    # unvalidated all the way into translate_stream's system prompt — a
    # request could put arbitrary instruction text in the `language` field
    # and have it land in the system role of the translation call. Literal
    # rejects anything outside the three real language codes at the FastAPI
    # request-validation boundary, before it ever reaches formatter.py.
    language: Literal["en", "hi", "mr"] = "en"


@app.get("/v1/health/live")
def health_live():
    return {"status": "ok"}


# Reachability is cached briefly rather than re-checked on every hit — the
# Dockerfile's HEALTHCHECK polls this every 15s, and re-hitting even a cheap
# provider endpoint that often forever is unnecessary load for a value that
# doesn't change second to second.
_REACHABILITY_CACHE_SECONDS = 20
_reachability_cache: dict = {}


def _cached_reachability(client: LLMClient) -> tuple[bool, str]:
    now = time.monotonic()
    cached = _reachability_cache.get(client.provider)
    if cached and now - cached[0] < _REACHABILITY_CACHE_SECONDS:
        return cached[1], cached[2]
    ok, detail = client.check_reachable()
    _reachability_cache[client.provider] = (now, ok, detail)
    return ok, detail


@app.get("/v1/health/ready")
def health_ready():
    # daily_cost is Section 6.1's dashboard ("token/cost usage by tenant and
    # agent") scaled to Phase 0 — one process-wide counter surfaced here
    # rather than a separate dashboard; see app/cost_tracker.py.
    client = LLMClient()
    ok, detail = _cached_reachability(client)
    body = {
        "status": "ok" if ok else "degraded",
        "provider": client.provider,
        "provider_reachable": ok,
        "daily_cost": get_daily_summary(),
    }
    if not ok:
        # Audit finding (second pass, 2026-09-16): this endpoint returned 200
        # unconditionally, so a misconfigured provider (e.g. OLLAMA_BASE_URL
        # pointing at the container's own localhost instead of the host) produced
        # a container Docker itself reports as healthy while every real turn
        # fails. A non-2xx here is what actually flips the Dockerfile's
        # HEALTHCHECK to unhealthy.
        body["detail"] = detail
        return JSONResponse(status_code=503, content=body)
    return body


@app.post("/v1/chat/invoke")
def chat_invoke(req: ChatRequest):
    """Non-streaming turn, run through the compiled LangGraph graph — this is
    what gives us checkpointing (per thread_id) for free."""
    turn_id = str(uuid.uuid4())
    bind_turn_context(thread_id=req.thread_id, turn_id=turn_id)
    logger.info("turn_start", user_query=req.user_query)

    graph = get_graph()
    config = {"configurable": {"thread_id": req.thread_id}}
    try:
        result = graph.invoke(
            {"user_query": req.user_query, "turn_id": turn_id, "thread_id": req.thread_id}, config=config
        )
    except Exception as e:
        # Audit finding (second pass, 2026-09-16): this endpoint had no
        # containment at all — an unhandled exception anywhere in the graph
        # (a malformed tool-call JSON, a hallucinated agent name, a provider
        # error) surfaced as a raw HTTP 500 instead of the same kind of
        # honest degraded answer /v1/chat/stream already gives. Router-level
        # containment (app/router.py's agent-enum check) and
        # agent_executor.py's json.loads containment close the two concrete
        # causes; this is the backstop for anything else.
        logger.error("turn_unhandled_error", error=str(e))
        clear_turn_context()
        return {
            "thread_id": req.thread_id,
            "turn_id": turn_id,
            "status": "failed",
            "agent": None,
            "answer": f"Something went wrong processing that request (ref {turn_id[:8]}). Please try again.",
            "sources": [],
            "frames": [],
            "analytics": [],
            "freshness": {"kind": "degraded", "label": "Error"},
            "correlation_id": turn_id,
        }

    logger.info("turn_end", status=result.get("response_status"))
    clear_turn_context()

    return {
        "thread_id": req.thread_id,
        "turn_id": turn_id,
        "status": result.get("response_status"),
        "agent": result.get("selected_agent"),
        "answer": result.get("final_response"),
        "sources": result.get("source_refs", []),
        "frames": result.get("frames", []),
        "analytics": result.get("analytics", []),
        "freshness": result.get("freshness", {}),
        "correlation_id": turn_id,
    }


@app.post("/v1/chat/stream")
def chat_stream(req: ChatRequest):
    """Streaming turn — calls the same router/agent/formatter functions
    directly rather than through the compiled graph, so the formatter's
    token generator can be forwarded live over SSE. See app/graph.py's
    module docstring for why /invoke and /stream take different paths."""
    turn_id = str(uuid.uuid4())

    def event_stream():
        bind_turn_context(thread_id=req.thread_id, turn_id=turn_id)
        logger.info("stream_turn_start", user_query=req.user_query)
        try:
            yield from _run_turn(req, turn_id)
        except Exception as e:
            # Anything unhandled here must not kill the SSE connection outright —
            # the operator should see a degraded answer, not a broken stream.
            logger.error("stream_turn_unhandled_error", error=str(e))
            yield _sse("token", {"text": f"Something went wrong processing that request (ref {turn_id[:8]}). Please try again."})
            yield _sse("done", {"status": "failed", "agent": None, "sources": [], "freshness": {"kind": "degraded", "label": "Error"}, "turn_id": turn_id})
        finally:
            clear_turn_context()

    return StreamingResponse(event_stream(), media_type="text/event-stream")


def _run_turn(req: "ChatRequest", turn_id: str):
    client = LLMClient()
    history = conversation_store.get_history(req.thread_id)

    decision = route(req.user_query.strip(), date.today().isoformat(), client, history=history)
    logger.info("stream_routed", agent=decision.agent, needs_clarification=decision.needs_clarification)

    if decision.needs_clarification:
        yield _sse("clarification", {
            "question": decision.clarification_question,
            "options": decision.clarification_options,
        })
        yield _sse("done", {"status": "needs_clarification", "agent": decision.agent, "turn_id": turn_id})
        if decision.clarification_question:
            conversation_store.append_turn(req.thread_id, req.user_query, decision.clarification_question)
        return

    agent = AGENTS[decision.agent]
    yield _sse("routed", {"agent": agent.label})
    yield _sse("thinking", {
        "phase": "routing",
        "intent": decision.intent,
        "risk_level": decision.risk_level,
        "confidence": decision.confidence,
    })

    results: list[ToolResult] = []
    for step in run_agent(agent, req.user_query, decision.entities.model_dump(), client, history=history):
        if step["type"] == "tool_call":
            yield _sse("thinking", {"phase": "tool_call", "tool": step["tool"], "args": step["args"]})
        elif step["type"] == "tool_result":
            yield _sse("thinking", {
                "phase": "tool_result", "tool": step["tool"], "ok": step["ok"],
                "error_code": step["error_code"], "latency_ms": step.get("latency_ms"),
            })
        elif step["type"] == "done":
            results = step["results"]

    if results:
        yield _sse("thinking", {"phase": "formatting"})

    sources = extract_sources(results, decision.entities.camera_names)
    frames = extract_frames(results, decision.entities.camera_names)
    analytics = extract_analytics(results)

    # Kept in English regardless of req.language — used only to ground the
    # follow-up suggestions below, never shown to the operator directly, so
    # it doesn't need translating.
    english_text = ""

    if req.language != "en" and agent.implemented and results and any(r.ok for r in results):
        # Multi-Language Support is a formatter wrapper (Section 1.2), not its
        # own domain worker — translate the assembled English answer, then
        # stream the translated tokens instead of the English ones.
        english_text = format_answer(agent, req.user_query, results, client)
        for chunk in translate_stream(english_text, req.language, client):
            yield _sse("token", {"text": chunk})
    else:
        for chunk in stream_answer(agent, req.user_query, results, client):
            english_text += chunk
            yield _sse("token", {"text": chunk})

    if not agent.implemented:
        freshness = {"kind": "stub", "label": "Not implemented"}
        status = "failed"
    elif not results:
        freshness = {"kind": "stub", "label": "No tool call made"}
        status = "failed"
    elif any(r.ok for r in results):
        freshness = {"kind": "live", "label": "Live"}
        status = "resolved"
    else:
        freshness = {"kind": "degraded", "label": "Degraded"}
        status = "failed"

    # Best-effort, non-critical — only for a real resolved answer, so we
    # never spend an extra LLM call chasing suggestions for a stub/degraded
    # turn where there's nothing concrete to follow up on.
    follow_ups = suggest_follow_ups(agent, results, req.user_query) if status == "resolved" else []

    yield _sse("done", {
        "status": status,
        "agent": decision.agent,
        "sources": [s.model_dump() for s in sources],
        "frames": frames,
        "analytics": analytics,
        "follow_ups": follow_ups,
        "freshness": freshness,
        "turn_id": turn_id,
    })
    conversation_store.append_turn(req.thread_id, req.user_query, english_text)
    logger.info("stream_turn_end", status=status)


def _sse(event: str, data: dict) -> str:
    import json

    return f"event: {event}\ndata: {json.dumps(data)}\n\n"
