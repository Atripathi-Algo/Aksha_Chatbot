"""
Router classification regression check.

Not a pytest suite on purpose — this repo has no test dependency installed,
and adding one just for this would mean a new runtime dependency baked into
the Docker image for a single file. This is a plain script: run it directly.

    python3 -m tests.test_router_regressions        # from aksha-chatbot-api/

Each case is a real call to the configured LLM provider through the actual
route() function — there's no way to check "does the router classify this
correctly" without asking the real router. That means each run costs real
API calls and can be flaky the way any single LLM call can be; treat one
failure as "look closer," not "the fix regressed" until it fails twice.

Every case here traces back to a routing bug found and fixed live in this
project. Add a case whenever a misclassification is found and fixed, so a
future prompt edit can't silently reopen it.
"""

import sys
from datetime import date

sys.path.insert(0, ".")

from app.router import route  # noqa: E402
from llm_client import LLMClient  # noqa: E402

# (query, expected_agent, why this case exists)
CASES = [
    # Found live 2026-09-04: the router's only camera_operations-vs-alert_investigation
    # rule talked about camera *settings* (Email_Alert toggles, Priority, FPS) — nothing
    # distinguished that from an alert *rule's own definition* (its name, what it watches
    # for), so "alert rule" phrasing fell into camera_operations by default on the word
    # "configuration" alone.
    ("Show me the alert rules for cam3.", "alert_investigation",
     "alert rule config, not camera device settings"),
    ("What alert rule is configured for cam3?", "alert_investigation",
     "same case, different phrasing"),
    ("What is the alert configuration for cam1-Gate-Camera?", "alert_investigation",
     "'configuration' alone must not pull this into camera_operations"),

    # Baseline correctness — the disambiguation rule above must not overcorrect
    # and start pulling genuine camera-settings questions into alert_investigation.
    ("Which cameras have email alerts enabled?", "camera_operations",
     "genuine device-setting question — must stay camera_operations"),
    ("What is the FPS for cam3?", "camera_operations",
     "device setting, no alert-rule language at all"),

    # One case per remaining agent, as a baseline sanity net — these were never
    # broken, but a prompt edit touching the shared disambiguation block could
    # silently move any of them.
    ("What are the email notification settings?", "notification"),
    ("Is cam3 live right now?", "live_monitoring"),
    ("How many alerts did cam3 have yesterday?", "insights_analytics"),
    ("How do I use multi-language support?", "help_guide"),
    ("What does the camera status 'creating' mean?", "error_explanation"),

    # Added 2026-09-16 with the two Phase 2 agents. Each pair has a diagnostic /
    # chronological phrasing that must route to the new agent, and the existing
    # cases above ("Is cam3 live right now?" -> live_monitoring, "What is the FPS
    # for cam3?" -> camera_operations) guard against the new rules over-reaching.
    ("Why is cam3 not showing any video?", "camera_troubleshooting",
     "a fault/'why' framing is diagnostic, not a live status snapshot"),
    ("Which cameras have stopped sending frames?", "camera_troubleshooting",
     "'stopped sending frames' is a problem report, not a settings question"),
    ("Give me a timeline of today's alerts on cam3.", "timeline",
     "explicit 'timeline' framing, not a plain alert list"),
    ("What happened on cam3 between 12:30 and 12:45?", "timeline",
     "'what happened between X and Y' is chronological, not a list lookup"),
    ("Show me the recent alerts for cam3.", "alert_investigation",
     "a plain alert list must NOT be pulled into timeline by the new rule"),

    # Found live 2026-09-18 during the 90-query sample-list validation
    # (docs/development-plan/Agent_Sample_Query_Validation_2026-09-18.md).
    ("Can you explain what an insight report shows?", "help_guide",
     "conceptual question about the feature, not a data request — the pre-model "
     "'insight report' regex fast-path used to route this straight to "
     "insights_analytics, which had no camera/date to query and failed outright"),
    ("Why does cam1-Gate-Camera say 'creating' for so long?", "camera_troubleshooting",
     "a quoted status PLUS a 'why... for so long' complaint is diagnostic, not a "
     "plain definition request — must not fall into error_explanation"),
    ("Show alert clusters for cam3 in the last 3 hours.", "timeline",
     "'clusters' is chronological/episode framing, same family as 'timeline'/'sequence'"),
]


def main() -> int:
    client = LLMClient()
    today = date.today().isoformat()
    failures = []

    for case in CASES:
        query, expected = case[0], case[1]
        note = case[2] if len(case) > 2 else ""
        decision = route(query, today, client)
        ok = decision.agent == expected
        status = "PASS" if ok else "FAIL"
        print(f"[{status}] {query!r} -> {decision.agent} (expected {expected}){' — ' + note if note else ''}")
        if not ok:
            failures.append((query, expected, decision.agent))

    print(f"\n{len(CASES) - len(failures)}/{len(CASES)} passed")
    if failures:
        print("\nFailed:")
        for query, expected, got in failures:
            print(f"  {query!r}: expected {expected}, got {got}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
