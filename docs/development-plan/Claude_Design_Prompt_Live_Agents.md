# Prompt for Claude Design — Aksha Chatbot: Live Agent Response UI

Copy everything below the line into Claude Design as the brief.

---

## Context

Aksha is a video-surveillance operator platform. We've built a support chatbot (FastAPI + LangGraph backend, React + MUI frontend) with 6 agents that are **live and implemented today** — each one calls a real tool against the existing Node.js backend (or, for one agent, this repo's own docs) and returns a real answer. This prompt describes exactly what each agent returns right now, so you can design chat UI that matches the actual data shape rather than an imagined one.

An existing design system is already in place (Modernist: flat, zero-radius, 2px rules, Archivo/Calibri type, accent `#326BC9`) — see `aksha-chatbot-ui-design/handoff/02-spec/TOKENS.md` if you have access to it. Follow those tokens if available; otherwise use a comparably flat, high-contrast, operator-dashboard aesthetic (this is a security-operations tool, not a consumer app — legible at a glance, low visual noise, no rounded/soft styling).

**Important honesty note for this prompt:** the backend currently returns a **plain-text/markdown answer plus a sources list and a freshness indicator** — it does *not* yet return structured chart/table data alongside the prose. Some earlier design mockups showed rich table/bar/donut cards; those are aspirational, not what the API sends today. Where I've included a "possible structured view" below, that's things we *could* build next (the underlying real data has the right shape for it) — design for the plain-text case as the baseline, and treat structured cards as a stretch goal you can propose, not a fixed requirement.

---

## The response envelope (what the frontend actually receives, every time)

Every chat turn streams over Server-Sent Events from `POST /v1/chat/stream`. In order:

```
event: routed
data: {"agent": "Camera Operations"}

event: token
data: {"text": "Nine of eleven cameras..."}     ← repeated, one per streamed chunk

event: done
data: {
  "status": "resolved" | "failed" | "needs_clarification",
  "agent": "camera_operations",
  "sources": [ { "source_type": "camera", "source_id": "...", "label": "CAM 07 · NORTH GATE", "url": null } ],
  "freshness": { "kind": "live" | "degraded" | "stub", "label": "Live" | "Degraded" | "Not implemented" },
  "turn_id": "uuid"
}
```

If the operator's question is ambiguous, `clarification` replaces `token`/`done`:
```
event: clarification
data: { "question": "Which camera did you mean?", "options": ["CAM 07 · NORTH GATE", "CAM 21 · NORTH GATE 2"] }
```

If the underlying service is unreachable, the assembled `token` text is an honest degraded message (e.g. "I couldn't retrieve that right now... try again shortly") and `freshness.kind` is `"degraded"` — never invented data. Design a clear, calm "can't answer right now" state, not an error/alarm state — this is an expected, correctly-handled outcome, not a crash.

Every example below is a **MOCK** `done`-event payload plus the assembled answer text — i.e. what one full turn looks like once streaming finishes. Field values are invented for design purposes but the field *names and structure* match the real API and, where relevant, the real underlying Node backend data.

---

## Agent 1 — Camera Operations

**What it answers:** camera status, configuration, priority, FPS, detection features, camera-group membership. Read-only.
**Real data it's grounded in:** Node's `config` collection (`GET /api/camera`) and `camera_groups` collection (`GET /api/camgroup`) — each camera has fields like `Camera_Name`, `Status`, `Priority`, `Feature` (array of detection types, e.g. `"fire"`, `"crowd"`), `Email_Alert`/`Display_Alert` booleans, and a reference thumbnail `image` URL.

**MOCK example — query: "Which cameras have email alerts enabled?"**
```json
{
  "agent": "camera_operations",
  "freshness": { "kind": "live", "label": "Live" },
  "answer_text": "9 of 11 cameras have email alerts on. CAM 03 · LOBBY and CAM 19 · PERIMETER S have them off.",
  "sources": [
    { "source_type": "camera", "source_id": "665f1a", "label": "CAM 07 · NORTH GATE", "url": null },
    { "source_type": "camera", "source_id": "665f1b", "label": "CAM 12 · LOADING BAY", "url": null }
  ]
}
```
**MOCK underlying data (for a possible structured table view — not sent by the API today):**
```json
[
  { "Camera_Name": "CAM 03 · LOBBY", "Priority": "Low", "Status": "running", "Feature": ["person"], "Email_Alert": false },
  { "Camera_Name": "CAM 07 · NORTH GATE", "Priority": "High", "Status": "running", "Feature": ["person", "vehicle"], "Email_Alert": true },
  { "Camera_Name": "CAM 12 · LOADING BAY", "Priority": "Medium", "Status": "running", "Feature": ["fire"], "Email_Alert": true }
]
```

---

## Agent 2 — Alert Investigation

**What it answers:** which alerts fired, when, on which camera. Metadata only (camera, time, type) — no image analysis in this phase.
**Real data it's grounded in:** two real Node sources — file-based recent-alert image scans (`GET /api/recentAlert/:hours`, returns camera name + image URLs) and DB-backed alert *rule* configs (`GET /api/alert/:camera_name`, `Alert_Name`, `Object_Class`, `Alert_Status`, `Timestamp`, active-hours window). There is no numeric severity field in the real schema — "high-risk" is descriptive language the formatter adds, not a stored field.

**MOCK example — query: "Show me alerts for the loading bay camera."**
```json
{
  "agent": "alert_investigation",
  "freshness": { "kind": "live", "label": "Live" },
  "answer_text": "2 alerts on CAM 12 · LOADING BAY in the last 24 hours: a fire-detection alert at 09:23 and another at 08:42, both during the active 09:00–18:00 window.",
  "sources": [
    { "source_type": "alert", "source_id": "ALT-4471", "label": "ALT-4471 · 09:23", "url": null },
    { "source_type": "alert", "source_id": "ALT-4468", "label": "ALT-4468 · 08:42", "url": null },
    { "source_type": "camera", "source_id": "665f1b", "label": "CAM 12 · LOADING BAY", "url": null }
  ]
}
```
**MOCK underlying data:**
```json
[
  { "cameraName": "CAM 12 · LOADING BAY", "images": ["https://.../2026-08-24/09_23_00_alert.jpg"] },
  { "Alert_Name": "Fire Alert", "Object_Class": "fire", "Alert_Status": "active", "Timestamp": "2026-08-24T08:42:00Z", "Camera_Name": ["CAM 12 · LOADING BAY"] }
]
```

---

## Agent 3 — Live Monitoring

**What it answers:** current, present-moment camera status — explicitly a REST snapshot, not a real-time push (no Socket.IO wiring yet). Answers must be honest about "as of now" vs. a guaranteed live feed.
**Real data it's grounded in:** `GET /api/active/getLiveCamera` (per-camera `Live` boolean, `Surveillance_Status`, a live thumbnail `image`, `FPS`) and `GET /api/active/getSpotlightCamera` (which cameras are currently pinned to the monitor page's spotlight view).

**MOCK example — query: "Is the warehouse camera online right now?"**
```json
{
  "agent": "live_monitoring",
  "freshness": { "kind": "live", "label": "Live" },
  "answer_text": "CAM 14 · WAREHOUSE is online as of this snapshot (surveillance running, ~0.5 FPS). This reflects the last REST poll, not a guaranteed real-time feed.",
  "sources": [
    { "source_type": "camera", "source_id": "665f22", "label": "CAM 14 · WAREHOUSE", "url": null }
  ]
}
```
**MOCK underlying data:**
```json
{ "Camera_Name": "CAM 14 · WAREHOUSE", "Live": true, "Surveillance_Status": "start", "FPS": 0.5, "image": "https://.../CAM14/live/snapshot.jpg" }
```
**Design note:** because this is explicitly a snapshot, consider a visible "as of HH:MM" timestamp treatment distinct from the plain "Live" badge used elsewhere — this agent's own answer text is required to caveat freshness, and the UI should reinforce that rather than imply a live video feed.

---

## Agent 4 — Insights & Analytics

**What it answers:** counting, trend, and comparison questions over alert history (e.g. "how many alerts this week", "which camera had the most"). Defaults to a sensible recent window (e.g. last 7 days) if the operator doesn't specify one, and says so.
**Real data it's grounded in:** `POST /api/insightReport` (a read-only report query, despite the POST verb — it requires a date-range body) returning, per camera, `alerts` keyed by timestamp, `total_alerts_generated`, and `object_detection_alerts` (a count broken down by detected object type).

**MOCK example — query: "Which camera generated the most alerts this week?"**
```json
{
  "agent": "insights_analytics",
  "freshness": { "kind": "live", "label": "Live" },
  "answer_text": "Over the last 7 days, CAM 07 · NORTH GATE generated the most alerts (34), mostly vehicle detections. CAM 12 · LOADING BAY was second (21, mostly fire-detection false positives).",
  "sources": [
    { "source_type": "report", "source_id": "insight-2026-08-18_2026-08-24", "label": "Insight Report · Aug 18–24", "url": null }
  ]
}
```
**MOCK underlying data (real shape from `/api/insightReport`):**
```json
{
  "cameras": {
    "CAM 07 · NORTH GATE": { "total_alerts_generated": 34, "object_detection_alerts": { "vehicle": 28, "person": 6 } },
    "CAM 12 · LOADING BAY": { "total_alerts_generated": 21, "object_detection_alerts": { "fire": 21 } }
  }
}
```

---

## Agent 5 — Notification

**What it answers:** notification configuration and delivery *setup* — read-only, never sends mail or changes settings. Must clearly separate "configured recipient" from "confirmed delivery" (delivery-confirmation logs don't exist yet, so it never claims a message was actually received).
**Real data it's grounded in:** `GET /api/email_notification` (global config: `notification_email` list, `alert_report_email` list, Telegram `bot_token`/`chat_ids`) and `GET /api/notification/group/:groupId` (per-group config: `email.enabled` + `email_list`, `mobile.enabled` + `mobile_numbers`, `telegram.enabled`, and an overall `alerts_enabled` flag).

**MOCK example — query: "Who gets notified for the North Gate group?"**
```json
{
  "agent": "notification",
  "freshness": { "kind": "live", "label": "Live" },
  "answer_text": "For the North Gate group: email alerts are on, sent to ops@site.com and security@site.com. Mobile SMS is on for one number. Telegram isn't configured. This reflects the configured recipients, not confirmed delivery of any specific alert.",
  "sources": [
    { "source_type": "camera", "source_id": "grp-perimeter-1", "label": "North Gate group", "url": null }
  ]
}
```
**MOCK underlying data (real shape from `/api/notification/group/:groupId`):**
```json
{
  "camera_group_id": "665fa1",
  "email": { "enabled": true, "email_list": "ops@site.com,security@site.com" },
  "mobile": { "enabled": true, "mobile_numbers": "+91XXXXXXXXXX" },
  "telegram": { "enabled": false, "bot_token": "", "chat_id": "" },
  "alerts_enabled": true
}
```

---

## Agent 6 — Help & Product Guide

**What it answers:** how-to and definitional questions about the product itself, answered from this repo's own documentation (keyword search over `docs/*.md` — not a live-data agent, and it never touches an operator's live alerts/cameras/account). Also answers "does the chatbot support other languages" — Multi-Language Support is *not* a separate agent the operator can be routed to; it's a translation step applied to any agent's answer when the operator's language isn't English.
**Real data it's grounded in:** static markdown documentation chunks (heading + excerpt), no external API.

**MOCK example — query: "How do I search for an alert?"**
```json
{
  "agent": "help_guide",
  "freshness": { "kind": "live", "label": "Live" },
  "answer_text": "To search for alerts, call the search_alerts tool (or the /api/alert endpoint) with a time range — start_at (inclusive) and end_at (exclusive). Optionally narrow by camera_ids or alert_types.",
  "sources": []
}
```
**MOCK example — honest "don't know" case, query: "What does the spotlight view feature do?"**
```json
{
  "agent": "help_guide",
  "freshness": { "kind": "live", "label": "Live" },
  "answer_text": "I'm not able to confirm what the spotlight view feature does based on the available documentation.",
  "sources": []
}
```
**Design note:** please design this "I don't know" state deliberately — it's correct, desired behavior (the agent declining to guess), not an error. It should read as calm and helpful ("try rephrasing, or ask an operator"), not as a failure state.

---

## Cross-cutting states to design for (apply to any agent above)

1. **Streaming** — tokens arrive incrementally; the answer should build up live, not appear all at once.
2. **Degraded** — `freshness.kind: "degraded"`, answer text is an honest "couldn't retrieve that right now" message with a correlation id, plus a retry action. This happens whenever the real Node backend/MongoDB is unreachable — a normal, expected, non-alarming state.
3. **Needs clarification** — the `clarification` event with a question and a short list of options (e.g. two cameras matching a name) to pick from, not free retyping.
4. **Multi-language** — any of the above, translated; canonical values (API paths, camera names, alert IDs, timestamps) stay untranslated inline within the translated prose, so don't design a UI that assumes the entire message is uniformly one language's script.

## What we're asking Claude Design to produce

Chat-message UI for a single generic "agent answer" card that adapts to the six agents above (agent badge + label, freshness indicator, streamed prose body, a compact sources row), plus the three cross-cutting states (degraded, clarification, multi-language). If you see a clean way to also sketch an optional structured-data view (e.g. a small table for Camera Operations/Insights, given the real underlying data shapes provided above), include it as a labeled alternative — not a requirement.
