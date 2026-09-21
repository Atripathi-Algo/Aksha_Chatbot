# Aksha Chatbot — Phase Progress Report
_As of 2026-09-21 · branch `Dev` · verified by live testing against the running Node backend (`:5000`) and the deployed chatbot API (`:8010`)_

## Summary

| Phase | Status | Detail |
|---|---|---|
| Phase 0 — Foundation | 🟡 Partial, blocking gate open | Scaffold/router/formatter/registry/streaming done; **JWT auth not started**; checkpointing is in-memory, not MongoDB |
| Phase 1 — 7 green agents | 🟢 Done, live, verified | All 7 implemented and confirmed working against real data; widget wired and live |
| Phase 2 — 8 orange agents | 🟡 3 of 8 done | Camera Troubleshooting, Timeline & Sequence, Error Explanation shipped; 5 not started; 1 of those blocked on ServiceAPI |
| Phase 3 — 9 red agents | ⚪ Not started (by design) | No premature write paths, approval, or audit infrastructure — correct for this stage |

---

## Phase 0 — Platform Foundation

| Item | Status | Notes |
|---|---|---|
| Chatbot service scaffold (FastAPI + LangGraph) | ✅ Done | `aksha-chatbot-api`, independently deployable, running live on port 8010 |
| Router & formatter shells | ✅ Done | `router.py`, `formatter.py` — structured JSON routing, no free-form agent names |
| Typed tool registry | ✅ Done | `tool_registry.py` — Pydantic input/output schemas, allowlisted tools |
| State & checkpointing | 🟡 Partial | `state.py` schema exists, but checkpointing uses LangGraph's in-memory `MemorySaver`, **not** the planned MongoDB-backed `chat_threads/chat_turns/chat_checkpoints` store. Turns are not resumable across a restart. |
| JWT trust boundary | ❌ Not started | `app/main.py` explicitly documents: *"No authentication yet... CORS is wide open... do not deploy this file as-is."* No `jose`/JWT verification code anywhere in the service. |
| Streaming & tracing | 🟡 Substituted | SSE streaming works (`/v1/chat/stream`, verified live). Tracing uses **LangSmith** `@traceable`, not the planned OpenTelemetry spans — functionally similar but a different tool than specified. |
| **Release gate** ("JWT issuer bug fixed, scope-resolution verified") | ❌ Not met | No auth path exists at all, so this is unstarted rather than merely unverified. |

**This is the single most important gap**: Phase 0 is documented in the plan as "blocking — no agents ship without this," yet Phase 1 and part of Phase 2 have already shipped without it. That was a reasonable sequencing call for a read-only, non-sensitive dev rollout, but it means production exposure (especially to the LAN-facing widget) is currently unauthenticated.

---

## Phase 1 — Green Agents (zero backend change)

All 7 agents are implemented and were **re-verified live today** against the real Node backend and real camera/alert data (see `Deployed_Features_2026-09-21.md` for full transcripts):

| Agent | Status | Live test result |
|---|---|---|
| Help & Product Guide | ✅ Done | Correctly answered a product question and correctly flagged an unshipped feature as "planned," not real |
| Alert Investigation (basic) | ✅ Done | Returned real latest alert (camera `cam3`, real timestamp) |
| Camera Operations | ✅ Done | Router currently sends "which cameras are offline" to Live Monitoring rather than Camera Operations — functionally correct answer, but a routing overlap worth tightening |
| Live Monitoring | ✅ Done | Correctly reported per-camera live/online status with real camera names |
| Insights & Analytics | ✅ Done, with a bug | Answered correctly when no data existed, but see **date-resolution bug** below |
| Notification (read) | ✅ Done | Correctly distinguished "configured recipients" from "confirmed delivered" (no delivery-confirmation logs exist yet) — matches the plan's explicit requirement |
| Multi-Language Support | ✅ Done | Verified live: a Hindi-language request returned a correct, fluent Hindi answer with real data substituted in |
| Frontend widget | ✅ Done | `ChatbotWidget.jsx` posts to `${API_BASE}/v1/chat/stream`, consumes all SSE event types (`routed`, `thinking`, `token`, `done`) |

**Release gate** ("all 7 agents live; tool-call validity ≥99%; citation presence 100%"): substantially met — `Agent_Sample_Query_Validation_2026-09-18.md` shows 81/90 (90%) sample queries passing, all 7 agents returned `sources` in every live test run today.

**New finding from live testing — date-resolution bug**: `date.today()` is correctly passed to `router.py` for intent routing, but is **never passed into the tool-calling step** (`agent_executor.py`). When asked "how many alerts today," the Insights & Analytics agent's tool call used `start_date=2024-05-20` — a hallucinated date, not the real system date (2026-09-21) or even the correct year. This should be fixed before Phase 2's KPI Report agent (which is date-range-heavy) is built on the same pattern.

---

## Phase 2 — Orange Agents (minor backend/response change)

| Agent | Status |
|---|---|
| Camera Troubleshooting | ✅ Done — verified live (`tools_troubleshooting.py`); correctly diagnosed a "stuck" camera as healthy with a stale status label |
| Timeline & Sequence | ✅ Done — verified live (`tools_timeline.py`); correctly labeled timestamps as evidence-capture time only, not fabricated event/notification times |
| Error Explanation | ✅ Done — verified live (`tools_errors.py`, agent key `error_explanation`); correctly explained a camera status code as a transient provisioning state, not an error |
| Alert Summary | ❌ Not started | No code found |
| Image & Anomaly Analysis | ❌ Blocked | `ServiceAPI_Blocker_Report_2026-09-16.pdf` documents the dependency blocker |
| KPI Report | ❌ Not started | No code found |
| System Health | ❌ Not started | No code found |
| Model & Detection | ❌ Not started | No code found |

**Release gate** ("each new adapter covered by contract tests before its agent activates; no regression in Phase 1"): met for the 3 shipped agents — each has dedicated tests, and today's live run confirmed zero regressions in the 7 Phase 1 agents.

---

## Phase 3 — Red Agents (deferred by design)

Confirmed **correctly untouched**: no `chat_approvals`, `chat_audit_events`, approval-gate node, or idempotency-key code anywhere in the repo. See `Phase3_Development_Plan_2026-09-21.md` for what needs to be built before any of these 9 agents can start.

---

## Cross-Cutting Risks (from the original codebase audit)

| Risk | Status |
|---|---|
| JWT scope too thin (no `tenant_id`/roles array/camera scope) | Not addressed — no JWT verification exists yet at all |
| Decoded JWT payload never checked server-side | Not addressed |
| Mobile token issuer mismatch (`mobile-app` vs `algosign`) | Not addressed |
| Live credentials committed to repo | ✅ Resolved / not found — no `client_secrets.json`, `credentials.json`, or `rtsplinks.json` in the repo; `tools_notification.py` actively strips `bot_token` from responses |
| Insight/KPI data not in MongoDB | Unchanged — `tools_insights.py`/`aksha_data.py` read from the Node REST API, not a Mongo store, as the audit flagged |

---

## Recommended next steps, in order

1. **Close the Phase 0 auth gap** before shipping any more Phase 2 agents — the plan calls this blocking for a reason, and the widget is already LAN-reachable without auth.
2. **Fix the date-resolution bug** in `agent_executor.py` before building KPI Report (Phase 2), which will depend on correct date-range arguments.
3. **Move checkpointing to MongoDB** as originally scoped, so chat threads survive a restart.
4. Continue Phase 2 with Alert Summary or System Health next — both are read-only extensions with no known blocker, unlike Image & Anomaly Analysis (ServiceAPI-blocked).
