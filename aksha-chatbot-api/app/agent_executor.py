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

from app.agents import AgentSpec
from app.logging_config import get_logger
from app.state import ToolResult
from app.tool_registry import execute_tool, get_openai_tools
from llm_client import LLMClient

logger = get_logger(component="agent_executor")

MAX_TOOL_CALLS = 3  # Section 5.3 allows up to 8; kept tight for Phase 0.


def run_agent(agent: AgentSpec, user_query: str, entities: dict, client: LLMClient) -> Iterator[dict[str, Any]]:
    if not agent.implemented:
        yield {"type": "done", "results": []}
        return

    tools = get_openai_tools(agent.tool_names)
    messages = [
        {"role": "system", "content": f"{agent.system_prompt}\nExtracted entities so far: {json.dumps(entities)}"},
        {"role": "user", "content": user_query},
    ]

    results: list[ToolResult] = []
    for _ in range(MAX_TOOL_CALLS):
        response = client.chat(messages, tools=tools)
        if not response.tool_calls:
            break
        for call in response.tool_calls:
            raw_args = call["arguments"]
            args = json.loads(raw_args) if isinstance(raw_args, str) else (raw_args or {})
            yield {"type": "tool_call", "tool": call["name"], "args": args}

            result = execute_tool(call["name"], args)
            results.append(result)
            logger.info("tool_called", tool=call["name"], args=args, ok=result.ok, error_code=result.error_code)
            yield {"type": "tool_result", "tool": call["name"], "ok": result.ok, "error_code": result.error_code}

            messages.append({"role": "assistant", "content": f"Called {call['name']} with {args}"})
            messages.append({"role": "user", "content": f"Tool result: {json.dumps(result.model_dump())}"})
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


def run_agent_collect(agent: AgentSpec, user_query: str, entities: dict, client: LLMClient) -> list[ToolResult]:
    """Non-streaming callers (app/graph.py) just want the final results —
    drain the generator and discard the intermediate step events."""
    results: list[ToolResult] = []
    for step in run_agent(agent, user_query, entities, client):
        if step["type"] == "done":
            results = step["results"]
    return results
