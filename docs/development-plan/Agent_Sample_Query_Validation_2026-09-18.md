# Agent Sample-Query Validation — 2026-09-18

**Method.** All 90 sample queries (10 per implemented agent, from the sample-query list
handed to the user the same day) were run live against `aksha-chatbot-api` on `:8010`
(healthy, current build) via its real `/v1/chat/stream` endpoint — the same real Node
backend data (cam1-Gate-Camera, cam2, cam3) every other verification in this project has
used, not mocked. Each query used its own fresh `thread_id` (no cross-query conversation
memory). For each query the script recorded the `routed` event's agent and the `done`
event's `status`; a query is marked **PASS** only if it routed to the agent it was written
for *and* resolved (not `failed`, not a clarification prompt).

**Result: 81 / 90 (90%) passed.** The 9 that didn't are below, each with a verdict on
whether it's a real router/agent gap or just an ambiguous sample query that a different
agent legitimately owns.

## Failures

| # | Query | Written for | Actually routed | Status | Verdict |
|---|---|---|---|---|---|
| 1 | "What's the status of cam3?" | camera_operations | live_monitoring | resolved | **Ambiguous wording, not a bug.** "Status" is genuine live_monitoring territory too; either agent answers correctly. |
| 2 | "List the active cameras." | live_monitoring | camera_operations | resolved | **Ambiguous wording, not a bug.** "Active" is also a literal camera config field (`Active: true`) that camera_operations owns. |
| 3 | "Which cameras are configured active but not verified streaming?" | live_monitoring | camera_troubleshooting | resolved | **Defensible either way.** This phrasing describes a fault condition, which is squarely camera_troubleshooting's job too — live_monitoring's own system prompt covers the same signal, so both agents can answer it correctly. |
| 4 | "Which camera is generating the most activity right now?" | insights_analytics | live_monitoring | resolved | **Ambiguous wording, not a bug.** "Right now" pulls toward a live snapshot; a trend/count question needs "today"/"this week" to disambiguate toward insights_analytics. |
| 5 | "Is display notification enabled for cam1-Gate-Camera?" | notification | camera_operations | resolved | **My sample-list label was wrong, not a router bug.** `Display_Alert` is a per-camera setting returned by `get_cameras` — camera_operations' own system prompt names it explicitly. The notification agent's tools (`get_notification_config`, `get_group_notification`) cover email/group config, not this field. camera_operations was the *correct* routing. |
| 6 | "What does \"Surveillance_Status\" mean?" | help_guide | error_explanation | resolved | **error_explanation is arguably the better fit.** Its tool is a glossary of exactly this kind of status-value lookup; my sample-list label was ambiguous between the two agents. |
| 7 | "Can you explain what an insight report shows?" | help_guide | insights_analytics | **failed** | **Real gap.** A conceptual "what does this feature show" question got routed to the data agent instead of help_guide, which had no data to fetch and produced a failed turn instead of a docs answer. This is a genuine router weakness: definitional questions that name a feature/report by its domain-agent-sounding name can get pulled into that domain agent instead of help_guide. |
| 8 | "Why does cam1-Gate-Camera say \"creating\" for so long?" | camera_troubleshooting | error_explanation | resolved | **Borderline, leans toward a real gap.** The literal status-value framing pulled it into error_explanation's glossary lookup, but "why... for so long" is an operator troubleshooting complaint, not a definition request — camera_troubleshooting's diagnostic table (which explicitly handles a stale "creating" label) would have been the more useful answer. |
| 9 | "Show alert clusters for cam3 in the last 3 hours." | timeline | insights_analytics | resolved | **Real gap.** "Clusters" isn't in the router's timeline-disambiguation vocabulary (`router.py`'s keyword rules key off "timeline"/"sequence"/"before/after/between"/"gaps"), so this fell through to the alert-counting agent instead of the episode-grouping one it was actually asking for. |

## Assessment

Of the 9 misses, **3 are real, fixable router gaps** (#7, #8, #9) and **6 are artifacts of
an ambiguously-worded sample query rather than a chatbot defect** (#1–#6) — in #5 in
particular, the system routed *correctly* and the sample-query list itself had the wrong
expected agent.

**Suggested fix for the 3 real gaps**, if wanted: add a few more disambiguation keywords
to `router.py` (e.g. "clusters" → timeline; a "what does X mean/show" framing that names
a report/feature, without a specific camera/date, → help_guide over the domain agent) and
extend the regression suite in `tests/test_router_regressions.py` with these exact 3
queries so they don't regress silently.

No other agents needed changes — camera_operations, alert_investigation, notification,
error_explanation, and camera_troubleshooting all resolved 9 or 10 of their 10 queries
correctly with no failures.
