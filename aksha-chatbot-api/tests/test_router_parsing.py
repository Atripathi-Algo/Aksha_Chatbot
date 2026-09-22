"""
Router logic that doesn't need a real LLM call — the local fast-path guards
in app/router.py's route() (regex-triggered shortcuts that skip the model
entirely) and its fallback/error-recovery behavior when the model's output
is missing or malformed. A fake client with no network access proves these
paths never depend on a real provider; app/router.py's actual classification
quality against a real model is tests/test_router_regressions.py's job, not
this file's.
"""

import json

from app.router import route


class _FakeChatResult:
    def __init__(self, tool_calls=None, content=None):
        self.tool_calls = tool_calls or []
        self.content = content


class _FakeClient:
    """Raises if called at all — used to prove a fast-path guard never
    reaches the model, not just that it returns the right answer."""

    def __init__(self, tool_calls=None, content=None, forbid_call=False):
        self._result = _FakeChatResult(tool_calls, content)
        self._forbid_call = forbid_call

    def chat(self, messages, tools=None, tier="strong", node=""):
        if self._forbid_call:
            raise AssertionError("route() called the LLM client on a fast-path query — it shouldn't have")
        return self._result


def _route_tool_call(decision_dict: dict) -> list[dict]:
    return [{"id": "call_1", "name": "emit_route", "arguments": json.dumps(decision_dict)}]


def test_alert_count_fast_path_skips_the_model():
    decision = route("How many alerts today?", "2026-09-16", _FakeClient(forbid_call=True))
    assert decision.agent == "insights_analytics"
    assert decision.intent == "report_counts"
    assert decision.confidence == 1.0


def test_report_query_fast_path_skips_the_model():
    decision = route("Give me the insight report for this week", "2026-09-16", _FakeClient(forbid_call=True))
    assert decision.agent == "insights_analytics"
    assert decision.intent == "report_counts"


def test_conceptual_report_question_does_not_take_the_fast_path():
    # Found live 2026-09-18: "insight report" alone used to trigger the fast
    # path above regardless of phrasing, routing this conceptual question
    # straight to insights_analytics (which then failed with no camera/date
    # to query) instead of letting the model apply the help_guide rule.
    client = _FakeClient(tool_calls=_route_tool_call({
        "domain": "help_guide", "agent": "help_guide", "intent": "product_question",
    }))
    decision = route("Can you explain what an insight report shows?", "2026-09-16", client)
    assert decision.agent == "help_guide"


def test_no_tool_call_falls_back_to_clarification():
    client = _FakeClient(tool_calls=[], content="I'm not sure, could you rephrase?")
    decision = route("something ambiguous entirely", "2026-09-16", client)
    assert decision.needs_clarification is True
    assert decision.agent == "help_guide"
    assert decision.clarification_question


def test_malformed_tool_call_arguments_fall_back_cleanly():
    client = _FakeClient(tool_calls=[{"id": "call_1", "name": "emit_route", "arguments": "{not valid json"}])
    decision = route("something odd", "2026-09-16", client)
    assert decision.needs_clarification is True
    assert decision.agent == "help_guide"


def test_tool_call_missing_required_field_falls_back_cleanly():
    # `agent` is required by RouterDecision — omitting it must not crash route(),
    # it must degrade to the same clarification fallback as any other bad output.
    client = _FakeClient(tool_calls=_route_tool_call({"domain": "camera_operations", "intent": "list_cameras"}))
    decision = route("show me the cameras", "2026-09-16", client)
    assert decision.needs_clarification is True
    assert decision.agent == "help_guide"


def test_valid_tool_call_parses_into_router_decision():
    client = _FakeClient(
        tool_calls=_route_tool_call({
            "domain": "camera_operations",
            "agent": "camera_operations",
            "intent": "list_cameras",
            "confidence": 0.95,
        })
    )
    decision = route("what cameras do we have", "2026-09-16", client)
    assert decision.agent == "camera_operations"
    assert decision.domain == "camera_operations"
    assert decision.intent == "list_cameras"
    assert decision.confidence == 0.95
    assert decision.needs_clarification is False
