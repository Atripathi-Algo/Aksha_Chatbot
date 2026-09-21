# Phase 3 Development Plan — Red Agents & Legacy Backend Changes
_As of 2026-09-21 · source: `docs/SUPPORT_CHATBOT_AGENT_CATALOG.md`, `docs/CHATBOT_SYSTEM_ARCHITECTURE.md`_

Phase 3 covers the 9 agents that mutate state or need infrastructure the platform doesn't have yet. Confirmed today: **none of this has started** — no approval-gate code, no `chat_approvals`/`chat_audit_events` collections, no write-capable tools anywhere in `aksha-chatbot-api`. That's correct for where the project is; this document is the plan for when it's time to start.

**Do not start any Phase 3 agent before the shared infrastructure below exists.** Every one of the 9 agents depends on it, and building an agent-specific shortcut around it is exactly the failure mode the original plan was designed to prevent.

---

## 1. Shared infrastructure required before *any* red agent starts

This is the actual blocking precondition — build it once, not per-agent.

| Component | What it does | Why it's shared |
|---|---|---|
| **Approval-gate node** | Intercepts every write tool call; requires a human "confirm" step before execution | Same node in the LangGraph graph for all 9 agents |
| **Short-lived, argument-bound approval tokens** | A token issued for *this exact* proposed change (target + arguments), expires quickly, can't be replayed against a different target | Prevents "approve once, replay elsewhere" |
| **Idempotency keys on every write tool** | Retrying a failed write can't double-apply it | Required by the catalog for every single write action listed below |
| **`chat_approvals` collection** | Records what was proposed, by whom, when, and whether it was approved | Feeds the audit trail |
| **`chat_audit_events` collection** | Immutable log of every write actually executed, with before/after values | Required even for the read-only Compliance & Audit agent — "access to audit data should itself be audited" |
| **Role-based permission scopes, enforced server-side** | The Node backend must actually filter by role/site/camera scope — currently `req.user` is set from the JWT and **nothing checks it** | This is cross-cutting risk #2 from the original audit, still open |
| **Unauthorized-action prevention proven at 100%** on the security eval set | Before any write ships, prove the router+permission layer can't be tricked into an unauthorized write | Release gate for the whole phase |

None of this can be built until **Phase 0's JWT trust boundary actually exists** (currently not started — see Progress Report). Phase 3 is transitively blocked on Phase 0, not just on its own preconditions.

### The Read / Propose / Write model

Every red agent should be built against three explicit capability levels, not built straight to "write":

1. **Read** — retrieve information in scope (already how Phase 1/2 agents work)
2. **Propose** — draft the change, show before/after, do not execute
3. **Write** — execute only after: valid permission → exact target/arguments → human confirmation → approval token → idempotency key → before/after record → audit event

Shipping the **Propose** level first for each agent (draft + confirmation UI, no actual execution) is a safe, useful intermediate milestone that exercises the approval UI without yet trusting the write path.

---

## 2. Per-agent plan and legacy backend changes

Grouped by domain, in the catalog's stated order. "Legacy backend" below means the existing Node.js service (port 5000) that the chatbot currently only reads from.

### Alert Intelligence

**Video Retrieval Agent**
- Legacy backend changes needed: authorized image/video search by camera + time range, evidence URLs with expiry, retention checks, bounded media streaming/download responses (not full-file dumps to the model).
- Recommended: defer until Incident Investigation is also being built — they share the same media-access primitive.

**Incident Investigation Agent**
- Legacy backend changes needed: a server-side cross-camera correlation/timeline API, investigation-session state, identity/event matching across cameras.
- Recommended: build after Video Retrieval; in v1, restrict to bounded sequential tool calls (alert search → image analysis → video retrieval → correlate) rather than open-ended agent-to-agent recursion.

**False Positive & Feedback Agent**
- Legacy backend changes needed: persistent feedback/review-state table, model-training label storage, authorization on who can mark feedback, audit history.
- Recommended: ship a **read-only** "suggest this might be a false positive" version first (no schema change beyond reading existing alert data); gate the actual "mark as reviewed" write behind the shared approval infra.

### Camera & Surveillance Operations

**Camera Configuration Agent**
- Legacy backend changes needed: scoped write endpoints for rename/description/priority/detection-features/group-assignment/enable-disable, server-side field validation, before/after value responses, role permission checks, idempotency support.
- Hard rule from the catalog: **never expose RTSP credentials** in any response this agent produces.

**Surveillance Control Agent**
- Legacy backend changes needed: safe start/pause/resume/restart command endpoints, async command-status tracking, authorization, operational audit logs.
- This is the highest-blast-radius agent in the catalog — it directly affects live surveillance. Do not build without the approval gate proven first on a lower-stakes write (e.g. Notification Configuration).

### Analytics & Reporting

**Report Export Agent**
- Legacy backend changes needed: asynchronous export job queue, download authorization, sensitive-data masking rules, job-status endpoint, retention policy, download audit records.
- Interface contract: the agent returns a job ID + status, never blocks the chat turn waiting on a large export.

### Notifications & Accounts

**Notification Configuration Agent**
- Legacy backend changes needed: scoped write endpoints for enable/disable email/display alerts, priority changes, recipient management; recipient validation; before/after responses.
- Good first Phase 3 candidate: single-camera, single-field mutations, easy to scope and easy to reverse — a good place to prove the approval-gate + audit pipeline end to end before tackling Surveillance Control.

**User & Access Agent**
- Legacy backend changes needed: permission-introspection API, user-scope API, role-aware response filtering, privacy filtering (must not reveal hidden users or personal data), and — if password/email/invite workflows are ever exposed via chat — dedicated secure workflows, not direct writes.
- Recommended: ship the read-only "what access do I have" half only; defer any account-mutation capability indefinitely unless there's a specific product requirement for it.

### Product Support & Platform Health

**Compliance & Audit Agent**
- Legacy backend changes needed: immutable audit-event storage (this is the same `chat_audit_events`-style store the shared infra needs, extended to cover legacy-backend actions too), access-auditing, retention rules, scoped audit queries.
- Note: read-only for most users, but still depends on the shared audit infrastructure existing first — it has nothing to query otherwise.

**Escalation & Human Support Agent**
- Legacy backend changes needed: support-ticket creation endpoint, evidence packaging, external-delivery controls (e.g. to an outside ticketing system), escalation-status tracking, audit records.
- Confirmation required whenever the agent would send evidence or personal data externally.

---

## 3. Suggested build order

Given the shared infra above, and picking agents that de-risk the approval/audit pipeline before tackling the higher-blast-radius ones:

1. Shared infra: approval-gate node, idempotency keys, `chat_approvals` / `chat_audit_events`, enforced role scopes (all blocked on Phase 0 JWT work landing first)
2. **Notification Configuration** — smallest, most reversible write; proves the full pipeline end to end
3. **False Positive & Feedback** (read-only suggestion mode first, then the write)
4. **Camera Configuration**
5. **Compliance & Audit** (now has something real to query)
6. **Video Retrieval** → **Incident Investigation** (built together, share the media-access primitive)
7. **Report Export**
8. **Surveillance Control** — highest blast radius, last
9. **User & Access**, **Escalation & Human Support** — lower urgency, no dependency on the others

## 4. Legacy backend changes that are prerequisites regardless of agent order

These aren't agent-specific — they're gaps the original codebase audit found in the Node backend itself, and they block *every* write agent above, not just one:

- **JWT payload is decoded but never checked** (`req.user` is set and nothing filters by it) — must be fixed before any Phase 3 agent can trust a permission check.
- **JWT scope is too thin** — no `tenant_id`, no roles array, no camera-level scope in the token. Every "before/after" and "role permission" requirement above assumes richer claims than currently exist.
- **Mobile token issuer mismatch** (`mobile-app` vs. hardcoded `algosign`) — must be fixed before any write agent is exposed to mobile clients, or mobile users will either be wrongly denied or the bug will get "fixed" in a way that widens trust incorrectly.

These three, plus the shared infra in Section 1, are the actual dependency chain: **Phase 0 auth → legacy backend permission enforcement → shared approval/audit infra → individual Phase 3 agents**, in that order.
