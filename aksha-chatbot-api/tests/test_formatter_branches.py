"""
app/formatter.py's non-LLM branches — the stub/no-results/all-failed cases
that must short-circuit before ever calling the model (Section 1.1's
formatter step must "say so plainly" when every tool failed, not paper over
it). A client that raises if called proves these branches really do
short-circuit, not just that they happen to return the right text.
"""

from app.agents import AgentSpec
from app.formatter import format_answer, stream_answer, suggest_follow_ups
from app.state import ToolResult

_STUB_AGENT = AgentSpec(key="stub_agent", label="Stub Agent", domain="stub", implemented=False, system_prompt="")
_REAL_AGENT = AgentSpec(key="real_agent", label="Real Agent", domain="real", implemented=True, system_prompt="You are a test agent.")


class _ForbiddenClient:
    def chat(self, *args, **kwargs):
        raise AssertionError("formatter called the LLM client on a short-circuit branch — it shouldn't have")

    def stream_chat(self, *args, **kwargs):
        raise AssertionError("formatter called the LLM client on a short-circuit branch — it shouldn't have")


def test_format_answer_stub_agent_short_circuits():
    text = format_answer(_STUB_AGENT, "any question", [], _ForbiddenClient())
    assert "Stub Agent" in text
    assert "isn't implemented" in text


def test_format_answer_no_tool_results_short_circuits():
    text = format_answer(_REAL_AGENT, "any question", [], _ForbiddenClient())
    assert "rephrase" in text.lower()


def test_format_answer_all_tools_failed_short_circuits():
    results = [
        ToolResult(tool_name="get_cameras", ok=False, error_code="TIMEOUT"),
        ToolResult(tool_name="get_camera_groups", ok=False, error_code="TIMEOUT"),
    ]
    text = format_answer(_REAL_AGENT, "any question", results, _ForbiddenClient())
    assert "TIMEOUT" in text
    assert "couldn't retrieve" in text.lower()


def test_stream_answer_stub_agent_short_circuits():
    chunks = list(stream_answer(_STUB_AGENT, "any question", [], _ForbiddenClient()))
    assert len(chunks) == 1
    assert "isn't implemented" in chunks[0]


def test_stream_answer_no_tool_results_short_circuits():
    chunks = list(stream_answer(_REAL_AGENT, "any question", [], _ForbiddenClient()))
    assert len(chunks) == 1
    assert "rephrase" in chunks[0].lower()


def test_stream_answer_all_tools_failed_short_circuits():
    results = [ToolResult(tool_name="get_cameras", ok=False, error_code="SERVICE_UNAVAILABLE")]
    chunks = list(stream_answer(_REAL_AGENT, "any question", results, _ForbiddenClient()))
    assert len(chunks) == 1
    assert "SERVICE_UNAVAILABLE" in chunks[0]


def test_suggest_follow_ups_stub_agent_returns_nothing():
    assert suggest_follow_ups(_STUB_AGENT, [], "any question") == []


def test_suggest_follow_ups_unrecognized_agent_key_returns_nothing():
    unknown_agent = AgentSpec(key="not_a_real_agent", label="Unknown", domain="x", implemented=True, system_prompt="")
    assert suggest_follow_ups(unknown_agent, [], "any question") == []


def test_suggest_follow_ups_excludes_camera_already_named_in_the_query():
    live_agent = AgentSpec(key="live_monitoring", label="Live Monitoring", domain="live", implemented=True, system_prompt="")
    results = [ToolResult(tool_name="get_live_cameras", ok=True, data={"cameras": [{"Camera_Name": "cam3"}]})]
    # The only camera found is the one already asked about — no follow-up
    # should just restate the same question about the same camera.
    follow_ups = suggest_follow_ups(live_agent, results, "Is cam3 live right now?")
    assert not any("cam3" in f for f in follow_ups)
