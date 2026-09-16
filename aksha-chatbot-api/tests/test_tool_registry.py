"""
app/tool_registry.py's execute_tool — the one function every agent's tool
call funnels through. This is the containment boundary (Section 3.1: "a bad
tool call must not crash a turn"), so every one of its failure branches gets
a case, not just the happy path.

Registers real tools under unique test-only names against the module's
actual (process-wide) registry — pytest starts a fresh process per run, so
this doesn't collide with anything the app itself registers, as long as
these names are unique within the test suite.
"""

from pydantic import BaseModel, Field

from app.node_client import NodeApiError
from app.tool_registry import ToolSpec, execute_tool, get_openai_tools, register_tool


class _EchoInput(BaseModel):
    value: int = Field(ge=0)


def _echo_handler(params: _EchoInput) -> dict:
    return {"value": params.value}


def _raise_node_api_error(_: _EchoInput) -> dict:
    raise NodeApiError("SERVICE_UNAVAILABLE", "backend is down", retryable=True)


def _raise_unexpected(_: _EchoInput) -> dict:
    raise RuntimeError("boom")


register_tool(ToolSpec(
    name="_test_echo",
    domain="_test",
    description="Echoes its input — test fixture.",
    input_model=_EchoInput,
    handler=_echo_handler,
))
register_tool(ToolSpec(
    name="_test_node_api_error",
    domain="_test",
    description="Always raises NodeApiError — test fixture.",
    input_model=_EchoInput,
    handler=_raise_node_api_error,
))
register_tool(ToolSpec(
    name="_test_unexpected_error",
    domain="_test",
    description="Always raises a plain exception — test fixture.",
    input_model=_EchoInput,
    handler=_raise_unexpected,
))


def test_unknown_tool_name_is_contained():
    result = execute_tool("_test_does_not_exist", {})
    assert result.ok is False
    assert result.error_code == "UNKNOWN_TOOL"
    assert result.latency_ms >= 0


def test_invalid_arguments_are_contained_as_validation_error():
    result = execute_tool("_test_echo", {"value": "not an int"})
    assert result.ok is False
    assert result.error_code == "VALIDATION"
    assert result.retryable is False


def test_negative_value_fails_the_input_models_own_constraint():
    result = execute_tool("_test_echo", {"value": -1})
    assert result.ok is False
    assert result.error_code == "VALIDATION"


def test_successful_call_returns_handler_data_and_latency():
    result = execute_tool("_test_echo", {"value": 42})
    assert result.ok is True
    assert result.data == {"value": 42}
    assert result.latency_ms >= 0


def test_node_api_error_is_contained_not_raised():
    result = execute_tool("_test_node_api_error", {"value": 1})
    assert result.ok is False
    assert result.error_code == "SERVICE_UNAVAILABLE"
    assert result.retryable is True
    assert result.message == "backend is down"


def test_unexpected_exception_is_contained_not_raised():
    # The whole point of this branch: a bug in a tool handler must degrade
    # to a ToolResult, never propagate and crash the turn.
    result = execute_tool("_test_unexpected_error", {"value": 1})
    assert result.ok is False
    assert result.error_code == "INTERNAL"
    assert result.retryable is False


def test_get_openai_tools_builds_schema_for_known_tools():
    tools = get_openai_tools(["_test_echo"])
    assert len(tools) == 1
    assert tools[0]["type"] == "function"
    assert tools[0]["function"]["name"] == "_test_echo"
    assert "value" in tools[0]["function"]["parameters"]["properties"]


def test_get_openai_tools_silently_skips_unknown_names():
    # Matches app/agent_executor.py's actual usage — an agent's tool_names
    # list should never surface a schema for a name that isn't registered.
    tools = get_openai_tools(["_test_echo", "_does_not_exist"])
    assert len(tools) == 1
