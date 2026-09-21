# Aksha Chatbot — Deployed Features Audit
_As of 2026-09-21 · live-tested against the actual running deployment_

## How this was verified

The chatbot API is **already running in production** on this host: a root-owned `uvicorn app.main:app` process on port 8010, up since 2026-09-18, configured with the `gemini` provider (`gemini-3.6-flash`) and pointed at the real Node backend on port 5000. All tests below were run directly against that live instance — not a mock, not a fresh spin-up — via `/v1/chat/invoke` and `/v1/chat/stream`. The full unit test suite (`pytest`) was also run: **59/59 passing**.

No JWT/auth exists yet (confirmed intentional — see Progress Report), so no token was needed to reach these endpoints. That is itself a finding, not an oversight in this test.

---

## Service surface

| Endpoint | Method | Purpose | Verified |
|---|---|---|---|
| `/v1/health/live` | GET | Liveness probe | ✅ `{"status":"ok"}` |
| `/v1/health/ready` | GET | Readiness + LLM provider reachability + daily cost | ✅ Returns `provider_reachable: true`, live cost counters |
| `/v1/chat/invoke` | POST | Non-streaming turn (LangGraph, checkpointed by `thread_id`) | ✅ Tested with 10 queries |
| `/v1/chat/stream` | POST | SSE streaming turn (`routed` → `thinking` → `token` → `done` events) | ✅ Tested, full event sequence confirmed |

## Frontend widget

`AkshaV2-UIUX/frontend/src/component/chatbot/ChatbotWidget.jsx` posts to `${API_BASE}/v1/chat/stream` where `API_BASE` defaults to `window.location.origin` (same-origin) or `REACT_APP_CHATBOT_API_URL`. It consumes every SSE event type the backend emits, including the `thinking` events that show routing/tool-call progress live. Wiring confirmed correct by reading the source; not click-tested in a browser this session.

---

## Agent-by-agent live test results

### Phase 1 — Green agents (all 7 confirmed working)

**1. Help & Product Guide**
> Q: "How do I add a new camera group in Aksha?"
> A: Correctly identified that camera-group creation is a *planned* feature, not shipped — did not hallucinate a UI path that doesn't exist.

**2. Alert Investigation**
> Q: "Show me the most recent alerts"
> A: "The most recent alert recorded is from camera cam3 at 2026-09-21 10:57:03." — real camera, real timestamp, matches system date.

**3. Camera Operations / Live Monitoring**
> Q: "What cameras are currently offline?" → routed to **Live Monitoring**, not Camera Operations
> A: Correctly reported all cameras online, using real camera names.
> ⚠️ Finding: the router sends camera-status questions to Live Monitoring rather than Camera Operations. The answer was still correct, but this is a routing boundary worth tightening — Camera Operations should own "which cameras exist / are configured / grouped," Live Monitoring should own "is X live right now."

**4. Live Monitoring**
> Q: "Is camera 1 live right now?"
> A: "camera 1, known as cam1-Gate-Camera, is online and actively streaming video with verified frame delivery." — real name resolution, real live-status check.

**5. Insights & Analytics**
> Q: "Give me today's alert count trend"
> A: Correctly reported no data for the (correctly resolved) date range.
> ❌ **Bug found**: a follow-up streamed test — "How many alerts today for camera 1?" — showed the tool call itself used `start_date=2024-05-20, end_date=2024-05-20` instead of the real date (2026-09-21). The router resolves "today" correctly (`date.today()` is passed into `router.py`), but that resolved date is **never passed into the tool-calling step** (`agent_executor.py`), so the LLM guesses a date when filling tool arguments and gets it wrong by ~2 years. This directly affects data correctness, not just phrasing — worth fixing before Phase 2's KPI Report agent is built the same way.

**6. Notification (read)**
> Q: "What notifications were sent today?"
> A: Correctly reported configured recipient emails, and explicitly stated delivery-confirmation logs don't exist, so it can't confirm actual delivery — exactly the "configured vs. confirmed-delivered" distinction the plan requires. Also confirmed: `tools_notification.py` strips `bot_token` from any response before it reaches the model or user.

**7. Multi-Language Support**
> Q: "Reply in Hindi: what alerts happened today?"
> A: Returned a fluent, correct Hindi answer with real data (camera `cam3`, real time range) substituted in — confirms this is implemented as a formatter-layer translation wrapper, not a separate agent, consistent with the plan.

### Phase 2 — Orange agents (3 of 8 confirmed working)

**Camera Troubleshooting**
> Q: "Camera 3 seems stuck, what's wrong with it?"
> A: "Camera 3 is actually healthy and currently streaming video frames despite its status label reading creating. This is very likely a transient provisioning state..." — real diagnostic reasoning over real status + live-probe data, correctly distinguishing a stale label from an actual fault.

**Timeline & Sequence**
> Q: "Give me a timeline of alert events for today"
> A: Built a real chronological timeline across two cameras, and explicitly flagged that timestamps are evidence-capture time only, not event/notification time (those fields don't exist upstream) — matches the deliberately-narrowed scope documented in the code.

**Error Explanation**
> Q: "What does the camera status creating mean?"
> A: "...the camera was just added and is still being provisioned by the backend... this is a transient state right after creating a camera and not an error." Correctly scoped to explaining operational status codes shown in the app, no source-code access involved.

**Not yet started**: Alert Summary, KPI Report, System Health, Model & Detection — no code found in the repo for any of these.

**Blocked**: Image & Anomaly Analysis — `ServiceAPI_Blocker_Report_2026-09-16.pdf` documents why (ServiceAPI dependency issue), consistent with `service_api_client.py`'s own docstring noting "connectivity groundwork only, no tool calls yet."

### Security behavior spot-check

> Q: "Can you restart the surveillance system for camera 5?" (an explicit Phase 3 red-agent capability — Surveillance Control)
> A: Routed to Camera Troubleshooting, replied it could not confirm status or restart the camera because it wasn't found in diagnostic data — **did not attempt any write, did not claim a restart happened, did not expose a write-capable tool.** No Phase 3 write path exists to be misused, and the model didn't fabricate one either.

---

## What's genuinely solid right now

- All 7 Phase 1 agents answer with real, current data pulled live from the Node backend — no hallucinated camera names, statuses, or counts observed in any test.
- Good data-honesty discipline throughout: agents distinguish "configured" from "confirmed," "live" from "last-known," and correctly refuse to invent unshipped features.
- No write capability exists anywhere reachable — the out-of-scope "restart camera" probe confirms this.
- Credential hygiene is good: no secrets in the repo, `bot_token` actively stripped from notification responses.
- 59/59 unit tests pass; SSE streaming emits a clean, well-structured event sequence the frontend already consumes correctly.

## What needs attention

1. **No authentication** — the service is reachable with zero credentials, by design for now, but this is the Phase 0 blocking item and the widget is LAN-reachable.
2. **Date-resolution bug** in the tool-calling step — confirmed live, affects any date-range query (Insights & Analytics today; KPI Report tomorrow).
3. **Camera Operations vs. Live Monitoring routing overlap** — not incorrect, but blurs the two agents' intended boundaries.
4. **In-memory checkpointing** — chat history/state does not survive a service restart.
