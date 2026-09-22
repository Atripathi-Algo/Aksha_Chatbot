"""
Domain worker execution — Section 1.1 step 5/6: "The selected worker calls
typed read tools ... and returns structured findings, not only prose."
Prose synthesis is the Formatter's job (app/formatter.py), not this step's.

run_agent is a generator, not a plain function that returns a list — every
tool call and its result is yielded as a step dict the instant it happens,
so a caller streaming over SSE (app/main.py) can forward each one live as
a "thinking" event instead of only learning about tool activity after the
whole turn finishes. The final yielded item is always
{"type": "done", "results": [...]}; app/graph.py's non-streaming path just
drains the generator and keeps that last item.
"""

import json
from collections.abc import Iterator
from typing import Any

from langsmith import traceable

from app.agents import AgentSpec
from app.formatter import compact_results_json
from app.logging_config import get_logger
from app.state import ToolResult
from app.tool_registry import execute_tool, get_openai_tools
from llm_client import LLMClient

logger = get_logger(component="agent_executor")

MAX_TOOL_CALLS = 3  # Section 5.3 allows up to 8; kept tight for Phase 0. Caps
# total tool INVOCATIONS across the turn, not model round-trips — a single
# round can return several parallel tool_calls (audit finding, second pass,
# 2026-09-16: the old per-round loop bound let a round with 2 parallel calls
# execute up to 2x MAX_TOOL_CALLS actual tool invocations).


@traceable(run_type="chain", name="agent_executor.run_agent")
def run_agent(
    agent: AgentSpec,
    user_query: str,
    entities: dict,
    client: LLMClient,
    history: list[dict] | None = None,
    current_date_iso: str | None = None,
) -> Iterator[dict[str, Any]]:
    if not agent.implemented:
        yield {"type": "done", "results": []}
        return

    tools = get_openai_tools(agent.tool_names)
    # The router resolves relative dates ("today", "this week") using its own
    # "Current date: ..." system-prompt line (app/router.py) before it ever
    # reaches this loop, but that resolution only produces a single
    # `entities.date` field — a tool like get_insight_report needs an actual
    # start_date/end_date pair, which this agent's own tool-calling model has
    # to compute itself. Without today's date grounded here too, it has no
    # way to do that correctly and silently guesses (found live: "this week"
    # queries mis-resolving into multi-year spans that then tripped
    # get_insight_report's own MAX_REPORT_RANGE_DAYS check, or into ranges
    # with no real data instead of the one actually asked for).
    date_line = f"\nCurrent date: {current_date_iso}" if current_date_iso else ""
    messages = [
        {"role": "system", "content": f"{agent.system_prompt}{date_line}\nExtracted entities so far: {json.dumps(entities)}"},
        *(history or []),
        {"role": "user", "content": user_query},
    ]

    results: list[ToolResult] = []
    calls_made = 0
    while calls_made < MAX_TOOL_CALLS:
        # Strong tier, explicit: this is the domain-reasoning call Section
        # 4.5 #2 says to keep on the capable model — it decides which tool
        # to call, with what arguments, and when it has enough to stop.
        response = client.chat(messages, tools=tools, tier="strong", node=f"agent:{agent.key}")
        if not response.tool_calls:
            break
        for call in response.tool_calls:
            if calls_made >= MAX_TOOL_CALLS:
                # This round returned more calls than the remaining budget —
                # stop mid-round rather than executing past the cap (the bug
                # this loop shape fixes: a round can hand back several
                # parallel tool_calls at once).
                break
            calls_made += 1
            raw_args = call["arguments"]
            # Audit finding (second pass, 2026-09-16): this json.loads used to
            # sit outside any containment — a provider that emits malformed
            # tool-call JSON (no schema-enum enforcement, e.g. Ollama) raised
            # JSONDecodeError straight out of this generator, past
            # execute_tool's own "never raise" contract. Give it the same
            # ToolResult-shaped failure execute_tool already returns for a bad
            # call, instead of a different failure mode for the same class of
            # problem (bad model output).
            try:
                args = json.loads(raw_args) if isinstance(raw_args, str) else (raw_args or {})
            except (json.JSONDecodeError, TypeError) as e:
                logger.warning("tool_call_args_unparseable", tool=call["name"], raw=raw_args, error=str(e))
                result = ToolResult(
                    tool_name=call["name"], ok=False, error_code="VALIDATION",
                    message=f"The model's tool-call arguments weren't valid JSON: {e}", retryable=False,
                )
                yield {"type": "tool_call", "tool": call["name"], "args": {}}
                results.append(result)
                yield {"type": "tool_result", "tool": call["name"], "ok": False, "error_code": "VALIDATION", "latency_ms": 0}
                messages.append({"role": "assistant", "content": f"Called {call['name']} with unparseable arguments"})
                messages.append({"role": "user", "content": f"Tool result: {compact_results_json([result])}"})
                continue
            yield {"type": "tool_call", "tool": call["name"], "args": args}

            result = execute_tool(call["name"], args)
            results.append(result)
            logger.info("tool_called", tool=call["name"], args=args, ok=result.ok, error_code=result.error_code, latency_ms=result.latency_ms)
            yield {"type": "tool_result", "tool": call["name"], "ok": result.ok, "error_code": result.error_code, "latency_ms": result.latency_ms}

            messages.append({"role": "assistant", "content": f"Called {call['name']} with {args}"})
            messages.append({"role": "user", "content": f"Tool result: {compact_results_json([result])}"})
        # Previously stopped the whole loop after the first successful call,
        # regardless of whether that result actually answered the question —
        # found live 2026-08-29: for an agent with two tools (e.g. Alert
        # Investigation's get_recent_alerts + get_alerts_by_camera), an
        # early, technically-successful-but-empty call from one tool
        # (ok=True, no data) would stop the loop before the model got a
        # chance to try the other, more relevant tool. Now the model itself
        # decides when it's done — it stops requesting tools once it has
        # what it needs, same as any standard multi-turn tool-calling loop.
        # MAX_TOOL_CALLS still caps the total round trips.

    yield {"type": "done", "results": results}


def run_agent_collect(
    agent: AgentSpec,
    user_query: str,
    entities: dict,
    client: LLMClient,
    history: list[dict] | None = None,
    current_date_iso: str | None = None,
) -> list[ToolResult]:
    """Non-streaming callers (app/graph.py) just want the final results —
    drain the generator and discard the intermediate step events."""
    results: list[ToolResult] = []
    for step in run_agent(agent, user_query, entities, client, history=history, current_date_iso=current_date_iso):
        if step["type"] == "done":
            results = step["results"]
    return results
