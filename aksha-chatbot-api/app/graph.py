"""
LangGraph wiring — Section 1.4 state graph, with authenticate_and_scope
omitted for now (explicit no-auth-during-development decision) and
verify_evidence simplified into the formatter's own "don't invent facts"
instruction rather than a separate node, to keep Phase 0 shippable.

    normalize_query -> route_request -> [needs_clarification?] -> END
                                      -> domain_worker -> format_response -> END
"""

from datetime import date

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph

from app.agent_executor import run_agent_collect
from app.agents import AGENTS
from app.formatter import extract_sources, format_answer
from app.logging_config import get_logger
from app.router import route
from app.state import ChatbotState
from llm_client import LLMClient

logger = get_logger(component="graph")


def _normalize_query(state: ChatbotState) -> dict:
    return {"normalized_query": state["user_query"].strip()}


def _route_request(state: ChatbotState) -> dict:
    client = LLMClient()
    decision = route(state["normalized_query"], date.today().isoformat(), client)
    logger.info("routed", agent=decision.agent, intent=decision.intent, needs_clarification=decision.needs_clarification)

    if decision.needs_clarification:
        return {
            "router": decision.model_dump(),
            "response_status": "needs_clarification",
            "final_response": decision.clarification_question or "Could you clarify what you mean?",
            "source_refs": [],
            "freshness": {"kind": "clarification", "label": ""},
        }
    return {"router": decision.model_dump(), "selected_agent": decision.agent}


def _domain_worker(state: ChatbotState) -> dict:
    client = LLMClient()
    agent = AGENTS[state["selected_agent"]]
    results = run_agent_collect(agent, state["normalized_query"], state["router"].get("entities", {}), client)
    return {"tool_results": [r.model_dump() for r in results]}


def _format_response(state: ChatbotState) -> dict:
    from app.state import ToolResult

    client = LLMClient()
    agent = AGENTS[state["selected_agent"]]
    results = [ToolResult.model_validate(r) for r in state.get("tool_results", [])]
    text = format_answer(agent, state["normalized_query"], results, client)
    sources = extract_sources(results)

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

    return {
        "final_response": text,
        "source_refs": [s.model_dump() for s in sources],
        "freshness": freshness,
        "response_status": status,
    }


def _needs_clarification(state: ChatbotState) -> str:
    return "end" if state.get("response_status") == "needs_clarification" else "continue"


def build_graph():
    graph = StateGraph(ChatbotState)
    graph.add_node("normalize_query", _normalize_query)
    graph.add_node("route_request", _route_request)
    graph.add_node("domain_worker", _domain_worker)
    graph.add_node("format_response", _format_response)

    graph.set_entry_point("normalize_query")
    graph.add_edge("normalize_query", "route_request")
    graph.add_conditional_edges("route_request", _needs_clarification, {"end": END, "continue": "domain_worker"})
    graph.add_edge("domain_worker", "format_response")
    graph.add_edge("format_response", END)

    return graph.compile(checkpointer=MemorySaver())


_GRAPH = None


def get_graph():
    global _GRAPH
    if _GRAPH is None:
        _GRAPH = build_graph()
    return _GRAPH
