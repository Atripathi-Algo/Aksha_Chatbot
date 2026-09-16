"""
Typed tool registry — see docs/CHATBOT_SYSTEM_ARCHITECTURE.md Section 3.1.

The only door between an agent and real data. Each tool is registered with
a Pydantic input schema, a domain, and a handler. An agent's LLM only ever
sees the tool schemas registered to its own domain (app/agents.py enforces
this by name, not by trusting the model). The model never sets tenant/site
scope itself — there's no auth yet (explicit development-time decision), so
this is a placeholder hook, not a no-op: real scope injection plugs in here
once Section 5.6's JWT work lands.
"""

import time
from dataclasses import dataclass
from typing import Any, Callable

from langsmith import traceable
from pydantic import BaseModel, ValidationError

from app.logging_config import get_logger
from app.node_client import NodeApiError
from app.state import ToolResult

logger = get_logger(component="tool_registry")


@dataclass
class ToolSpec:
    name: str
    domain: str
    description: str
    input_model: type[BaseModel]
    handler: Callable[[BaseModel], dict[str, Any]]


_REGISTRY: dict[str, ToolSpec] = {}


def register_tool(spec: ToolSpec) -> None:
    if spec.name in _REGISTRY:
        raise ValueError(f"Tool already registered: {spec.name}")
    _REGISTRY[spec.name] = spec


def get_openai_tools(tool_names: list[str]) -> list[dict]:
    """OpenAI-style function-calling schemas for the given tool names, for
    passing straight into llm_client.LLMClient.chat(tools=...)."""
    tools = []
    for name in tool_names:
        spec = _REGISTRY.get(name)
        if not spec:
            continue
        tools.append(
            {
                "type": "function",
                "function": {
                    "name": spec.name,
                    "description": spec.description,
                    "parameters": spec.input_model.model_json_schema(),
                },
            }
        )
    return tools


@traceable(run_type="tool", name="execute_tool")
def execute_tool(name: str, arguments: dict) -> ToolResult:
    """Validate arguments, run the handler, and always return a ToolResult —
    never raise. This is what keeps a bad tool call from crashing a turn."""
    start = time.perf_counter()

    def _elapsed_ms() -> int:
        return round((time.perf_counter() - start) * 1000)

    spec = _REGISTRY.get(name)
    if not spec:
        logger.warning("unknown_tool_call", tool=name)
        return ToolResult(
            tool_name=name, ok=False, error_code="UNKNOWN_TOOL",
            message=f"No tool named {name!r} is registered.", latency_ms=_elapsed_ms(),
        )

    try:
        parsed_input = spec.input_model.model_validate(arguments)
    except ValidationError as e:
        logger.info("tool_input_invalid", tool=name, error=str(e))
        return ToolResult(tool_name=name, ok=False, error_code="VALIDATION", message=str(e), retryable=False, latency_ms=_elapsed_ms())

    try:
        data = spec.handler(parsed_input)
        latency_ms = _elapsed_ms()
        logger.info("tool_call_succeeded", tool=name, latency_ms=latency_ms)
        return ToolResult(tool_name=name, ok=True, data=data, latency_ms=latency_ms)
    except NodeApiError as e:
        latency_ms = _elapsed_ms()
        logger.info("tool_call_degraded", tool=name, error_code=e.error_code, latency_ms=latency_ms)
        return ToolResult(tool_name=name, ok=False, error_code=e.error_code, message=e.message, retryable=e.retryable, latency_ms=latency_ms)
    except Exception as e:  # last-resort containment — a tool bug must not crash the turn
        latency_ms = _elapsed_ms()
        logger.error("tool_call_unexpected_error", tool=name, error=str(e), latency_ms=latency_ms)
        return ToolResult(tool_name=name, ok=False, error_code="INTERNAL", message="Tool failed unexpectedly.", retryable=False, latency_ms=latency_ms)


def list_domains() -> dict[str, list[str]]:
    domains: dict[str, list[str]] = {}
    for spec in _REGISTRY.values():
        domains.setdefault(spec.domain, []).append(spec.name)
    return domains
