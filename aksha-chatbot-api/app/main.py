"""
Aksha Chatbot API — Phase 0 foundation service.

No authentication yet: explicit development-time decision (Section 0.3 Identity
row still applies once JWT work lands — see Section 5.6 for the known gaps).
CORS is wide open for the same reason — do not deploy this file as-is.
"""

import uuid
from datetime import date

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app import tools_alerts, tools_camera, tools_errors, tools_help, tools_insights, tools_live, tools_notification
from app.agent_executor import run_agent
from app.agents import AGENTS
from app.formatter import extract_sources, format_answer, stream_answer, suggest_follow_ups, translate_stream
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
    language: str = "en"  # 'en' | 'hi' | 'mr' — drives the Multi-Language formatter wrapper


@app.get("/v1/health/live")
def health_live():
    return {"status": "ok"}


@app.get("/v1/health/ready")
def health_ready():
    return {"status": "ok", "provider": LLMClient().provider}


@app.post("/v1/chat/invoke")
def chat_invoke(req: ChatRequest):
    """Non-streaming turn, run through the compiled LangGraph graph — this is
    what gives us checkpointing (per thread_id) for free."""
    turn_id = str(uuid.uuid4())
    bind_turn_context(thread_id=req.thread_id, turn_id=turn_id)
    logger.info("turn_start", user_query=req.user_query)

    graph = get_graph()
    config = {"configurable": {"thread_id": req.thread_id}}
    result = graph.invoke({"user_query": req.user_query, "turn_id": turn_id}, config=config)

    logger.info("turn_end", status=result.get("response_status"))
    clear_turn_context()

    return {
        "thread_id": req.thread_id,
        "turn_id": turn_id,
        "status": result.get("response_status"),
        "agent": result.get("selected_agent"),
        "answer": result.get("final_response"),
        "sources": result.get("source_refs", []),
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

    decision = route(req.user_query.strip(), date.today().isoformat(), client)
    logger.info("stream_routed", agent=decision.agent, needs_clarification=decision.needs_clarification)

    if decision.needs_clarification:
        yield _sse("clarification", {
            "question": decision.clarification_question,
            "options": decision.clarification_options,
        })
        yield _sse("done", {"status": "needs_clarification", "agent": decision.agent, "turn_id": turn_id})
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
    for step in run_agent(agent, req.user_query, decision.entities.model_dump(), client):
        if step["type"] == "tool_call":
            yield _sse("thinking", {"phase": "tool_call", "tool": step["tool"], "args": step["args"]})
        elif step["type"] == "tool_result":
            yield _sse("thinking", {"phase": "tool_result", "tool": step["tool"], "ok": step["ok"], "error_code": step["error_code"]})
        elif step["type"] == "done":
            results = step["results"]

    if results:
        yield _sse("thinking", {"phase": "formatting"})

    sources = extract_sources(results)

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
    follow_ups = suggest_follow_ups(agent, results) if status == "resolved" else []

    yield _sse("done", {
        "status": status,
        "agent": decision.agent,
        "sources": [s.model_dump() for s in sources],
        "follow_ups": follow_ups,
        "freshness": freshness,
        "turn_id": turn_id,
    })
    logger.info("stream_turn_end", status=status)


def _sse(event: str, data: dict) -> str:
    import json

    return f"event: {event}\ndata: {json.dumps(data)}\n\n"
