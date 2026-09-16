# Aksha Support Chatbot Agent Catalog

**Status:** Proposed
**Version:** 1.0
**Date:** 2026-08-21
**Related design:** [Chatbot System Architecture](CHATBOT_SYSTEM_ARCHITECTURE.md)

> **Docs-hygiene note, added 2026-09-16:** every agent card below is a PROPOSED design, not a report of what's built — this entire file predates almost all of the real implementation work and was never updated against it. Whether an agent actually exists and works is answered only by `CHATBOT_SYSTEM_ARCHITECTURE.md`'s Section 9 (Implementation Plan / Build Reports), never by this catalog. As of that section's latest build report, the only real, working agents are: Camera Operations, Alert Investigation (basic filters only — no image analysis), Live Monitoring, Insights & Analytics, Notification (read-only), Help & Product Guide, Multi-Language Support (a formatter wrapper, not its own agent), and Error & Status Explanation. Every other card here — Alert Summary, Image & Anomaly Analysis, Camera Troubleshooting, KPI Report, Timeline & Sequence, System Health, Model & Detection, Video Retrieval, Incident Investigation, Camera Configuration, Surveillance Control, Notification Configuration, User & Access, Report Export, Compliance & Audit, Escalation & Human Support, False Positive & Feedback — remains unbuilt. Section 1's "Existing Foundation" list below (Code Explainer, Document/Knowledge, Image/Anomaly Analysis agents, etc.) is also proposed, not existing, despite its heading — `CHATBOT_SYSTEM_ARCHITECTURE.md` Section 1.2 confirms none of those modules exist in this repository.

## 1. Existing Foundation

The current chatbot design already defines these shared capabilities:

- Code Explainer Agent
- Document/Knowledge Agent
- Image/Anomaly Analysis Agent
- Metadata Loader
- Supervisor Router
- Output Formatter

These are platform capabilities. The agents below are the domain workers that should be selected by the supervisor router.

### Backend Change Legend

- <mark style="background-color:#b7e4c7;color:#14532d">GREEN</mark>: No current backend change required. The agent can use existing APIs, existing services, or indexed documentation.
- <mark style="background-color:#ffd166;color:#7c4a03">ORANGE</mark>: Minor backend response, adapter, or metadata change required.
- <mark style="background-color:#ffadad;color:#991b1b">RED</mark>: Major backend change required, such as new APIs, persistence, cross-camera correlation, asynchronous jobs, permissions, or write workflows.

The classification is based on the current Node/Express routes for alerts, investigations, cameras, camera groups, notifications, insights, KPI reports, and active-camera status, plus the existing Python image/report services. It describes backend readiness, not implementation effort for the agent prompt or UI.

## 2. Agent Catalog

### 2.1 Alert Intelligence

#### <mark style="background-color:#b7e4c7;color:#14532d">Alert Investigation Agent</mark>

- **Backend change required:** None for basic read-only alert queries; use existing alert and investigation APIs. Add only an adapter for normalized filters and source references.
- **Current code module:** `Anamoly_object_agent.py` currently reads alert JSON, uses router metadata (`date`, `alerts`, `cam_id`), builds day/camera/timestamp context, and generates an image-based alert explanation.
- **Recommended change:** Keep this agent image-only in the first release. Move alert JSON loading and context construction behind typed read tools, preserve `image_metadata`, and return structured alert ID, camera, timestamp, image path, confidence, and source-reference fields before formatting the response.

Answers questions about individual alerts and alert history.

Example requests:

- Why was this alert generated?
- Show all high-risk alerts from Camera 12 today.
- Were similar alerts generated yesterday?
- What happened before and after this alert?

Tools:

- Alert database/API queries
- Image and video retrieval
- Timestamp comparison
- Similar-alert search

#### <mark style="background-color:#ffd166;color:#7c4a03">Alert Summary Agent</mark>

- **Backend change required:** Minor response change required to expose summary status, summary timestamp, and structured daily/camera summary fields from the existing summary utilities.
- **Current code module:** `Utils/Alert_summary_generator.py` generates image summaries per alert and camera/day summaries, while `Anamoly_object_agent.py` triggers missing-summary generation before image analysis.
- **Recommended change:** Expose `generate_single_image_summary`, `generate_single_camera_summary`, and `generate_only_daily_summary` through idempotent typed service tools. Return whether a summary was reused or generated, its timestamp, alert/camera scope, and the source JSON path without placing file mutation logic in the LLM agent.

Produces summaries at alert, camera, site, day, week, or custom time-range level.

Example requests:

- Summarize today's activity.
- Give me the top five incidents this week.
- Summarize alerts from the warehouse cameras.

The existing alert summary utility should be exposed through typed tools such as:

```text
generate_image_summary(alert_id)
generate_camera_summary(camera_id, date)
generate_daily_summary(site_id, date)
```

The agent must distinguish generated summaries from raw observations and include the summary timestamp.

#### <mark style="background-color:#ffd166;color:#7c4a03">Image and Anomaly Analysis Agent</mark>

- **Backend change required:** Minor response change required to return image-analysis confidence, risk indicators, evidence links, and model metadata in a structured response.
- **Current code module:** `Anamoly_object_agent.py` is the current image/anomaly worker and LangGraph entry point (`image_analyzer(state)`); `Utils/Alert_summary_generator.py` calls Gemini for image captions and OpenAI for text summaries.
- **Recommended change:** Preserve the existing worker as the first implementation, but split image loading, caption generation, risk assessment, and summary generation into typed tools. Add a structured `image_analysis` response containing alert ID, image path, caption, risk assessment, confidence, model/provider, generated-at timestamp, and evidence references. Do not add video retrieval in this phase.

Explains image content, anomaly detections, risk indicators, and model confidence.

Example requests:

- What is visible in this alert image?
- Why was this classified as an anomaly?
- What evidence supports the risk level?

The response must state uncertainty and must not claim that an image proves an event when the available evidence is inconclusive.

#### <mark style="background-color:#ffadad;color:#991b1b">Video Retrieval Agent</mark>

- **Backend change required:** Major change required to add authorized image/video search by camera and time range, evidence URLs, retention checks, and bounded media streaming or download responses.
- **Current code module:** No dedicated video-retrieval agent is currently part of the documented chatbot implementation. Existing frontend video/image components are outside the current image-agent scope.
- **Recommended change:** Defer this agent to the next phase. Do not add video APIs, media streaming, or video-specific router paths while implementing the initial image workflow.

Finds and returns relevant image or video evidence.

Example requests:

- Show the video for the alert at 14:32.
- Find footage from Camera A between 10:00 and 11:00.
- Give me the image associated with this alert.
- Open the event before this incident.

Required output:

- Camera name and ID
- Date
- Start and end timestamp
- Evidence link
- Alert ID
- Confidence or detection metadata
- Evidence availability and freshness

#### <mark style="background-color:#ffadad;color:#991b1b">Incident Investigation Agent</mark>

- **Backend change required:** Major change required for cross-camera correlation, identity/event matching, investigation sessions, and a server-side timeline/correlation API.
- **Current code module:** No dedicated cross-camera incident agent is currently implemented in the documented chatbot modules; `Anamoly_object_agent.py` is limited to alert JSON context and image explanation.
- **Recommended change:** Defer this agent with video retrieval. For the image-only phase, limit investigation to a single alert or a bounded set of image-backed alerts returned by the existing alert APIs.

Coordinates a multi-camera investigation for a larger event.

Example requests:

- Track this person across the site.
- What happened between 09:00 and 09:30?
- Find all cameras that saw activity near the loading bay.
- Build a timeline for this incident.

Allowed delegated capabilities:

- Alert search
- Image analysis
- Video retrieval
- Cross-camera correlation
- Timeline generation

In v1, this agent should use bounded sequential tool calls rather than unrestricted agent-to-agent recursion.

#### <mark style="background-color:#ffd166;color:#7c4a03">Timeline and Sequence Agent</mark>

- **Backend change required:** Minor response change required to expose event, evidence, processing, and notification timestamps in a consistent sortable schema.

Converts alerts and evidence into a chronological explanation.

Example requests:

- Create a timeline of today's incidents.
- What happened immediately before the intrusion alert?
- Order these alerts by event time.
- Identify gaps between related alerts.

The output must distinguish:

- Event time
- Evidence timestamp
- Processing time
- Notification time

#### <mark style="background-color:#ffadad;color:#991b1b">False Positive and Feedback Agent</mark>

- **Backend change required:** Major change required for persistent feedback records, alert review state, model-training labels, authorization, and audit history.

Collects feedback about alert quality and detection results.

Example requests:

- This alert is a false positive.
- Mark this alert as reviewed.
- The detected object is incorrect.
- Create a feedback report for this camera.

Read-only feedback suggestions can be released first. Marking, changing, or submitting feedback is a write action and requires the appropriate permission and audit event.

### 2.2 Camera and Surveillance Operations

#### <mark style="background-color:#b7e4c7;color:#14532d">Camera Operations Agent</mark>

- **Backend change required:** None for read-only status and configuration questions; use existing camera, camera-group, and active-camera APIs.

Answers camera configuration and operational questions.

Example requests:

- Which cameras are offline?
- Is Camera 23 live?
- What is the FPS of the entrance camera?
- Which cameras have email alerts enabled?
- Show cameras configured for person detection.

Tools:

- Camera configuration API
- Live-status API
- Camera group API
- Feature and priority filters

#### <mark style="background-color:#ffd166;color:#7c4a03">Camera Troubleshooting Agent</mark>

- **Backend change required:** Minor response change required to expose last-seen time, FPS, RTSP health, service state, and recent sanitized error details through a diagnostic response.

Diagnoses camera and streaming problems.

Example requests:

- Why is Camera 14 not showing video?
- Which cameras stopped sending frames?
- Why is the stream delayed?
- Check cameras with low FPS.

It combines:

- Camera status
- RTSP health without exposing RTSP credentials
- Last-seen timestamp
- FPS
- Process/service health
- Recent backend errors

A diagnosis must identify the observed signal, likely cause, confidence, and recommended next step.

#### <mark style="background-color:#b7e4c7;color:#14532d">Live Monitoring Agent</mark>

- **Backend change required:** None for current live status; use the existing active-camera API and Socket.IO events. Add only a read adapter that labels data freshness.

Provides current operational status.

Example requests:

- What is happening right now?
- Which cameras currently have activity?
- Are there any active high-priority alerts?
- Show the current status of all camera groups.

The agent can consume a read-only adapter over the existing live API or Socket.IO event stream. It must label data as live, cached, or last-known.

#### <mark style="background-color:#ffadad;color:#991b1b">Camera Configuration Agent</mark>

- **Backend change required:** Major change required for scoped write APIs, field validation, before/after values, role permissions, idempotency, approval handling, and audit events.

Proposes and, after approval, performs camera configuration changes.

Potential actions:

- Rename a camera
- Change description
- Update priority
- Change detection features
- Assign a camera group
- Enable or disable a camera

Rules:

- Never expose RTSP credentials.
- Validate the target camera server-side.
- Show before and after values before approval.
- Require an idempotency key and audit event.
- Reject destructive or ambiguous requests.

#### <mark style="background-color:#ffadad;color:#991b1b">Surveillance Control Agent</mark>

- **Backend change required:** Major change required for safe start/pause/resume/restart commands, command status, authorization, approval gates, idempotency, and operational audit logs.

Controls operational camera state.

Potential actions:

- Start monitoring
- Pause monitoring
- Resume monitoring
- Restart a camera process
- Activate or deactivate a camera

These actions affect live surveillance and always require strict authorization plus human confirmation.

### 2.3 Analytics and Reporting

#### <mark style="background-color:#b7e4c7;color:#14532d">Insights and Analytics Agent</mark>

- **Backend change required:** None for existing insight and KPI queries; use current analytics endpoints and format their results as structured metrics.

Answers analytical questions using insight and KPI data.

Example requests:

- Which camera had the most alerts this month?
- What are the busiest times of day?
- Compare this week with last week.
- Which alert type is increasing?
- Show the top five cameras by incident count.

Possible outputs:

- Counts
- Trends
- Percentages
- Comparisons
- Links to the Insights page
- Chart-ready structured data

#### <mark style="background-color:#ffd166;color:#7c4a03">KPI Report Agent</mark>

- **Backend change required:** Minor response change required to standardize KPI fields, reporting period, units, calculation timestamp, and report source metadata.

Specializes in formal operational metrics and reports.

Example requests:

- Generate this month's surveillance KPI report.
- What is the average alert response time?
- How many incidents were resolved?
- Export a report for the security manager.

The agent must return structured metrics before the output formatter creates prose.

#### <mark style="background-color:#ffadad;color:#991b1b">Report Export Agent</mark>

- **Backend change required:** Major change required for asynchronous export jobs, download authorization, sensitive-data masking, job status, retention, and download audit records.

Creates downloadable artifacts.

Example requests:

- Export all critical alerts as CSV.
- Create a PDF incident report.
- Download this camera's weekly summary.
- Share the investigation timeline.

Rules:

- Apply authorization and masking rules.
- Use asynchronous jobs for large reports.
- Return a job ID and status rather than blocking the chatbot request.
- Record who requested and downloaded the export.

### 2.4 Notifications and Accounts

#### <mark style="background-color:#b7e4c7;color:#14532d">Notification Agent</mark>

- **Backend change required:** None for existing notification-history and configuration reads; use current notification APIs with a chatbot response adapter.

Answers questions about alert delivery and notification settings.

Example requests:

- Was this alert sent by email?
- Who received the notification?
- Why did I not receive an alert?
- Which cameras have display notifications enabled?
- Show failed notifications from today.

Tools:

- Notification history
- Email configuration
- Display-alert settings
- Delivery status

The response should distinguish configured recipients from confirmed delivery recipients.

#### <mark style="background-color:#ffadad;color:#991b1b">Notification Configuration Agent</mark>

- **Backend change required:** Major change required for scoped notification writes, recipient validation, approval gates, idempotency, before/after responses, and audit events.

Manages notification settings for authorized users.

Potential actions:

- Enable or disable email alerts
- Enable or disable display alerts
- Change alert priority
- Configure recipients
- Update camera notification rules

Every mutation requires confirmation, for example:

> I am ready to disable email alerts for Camera 12. Confirm?

#### <mark style="background-color:#ffadad;color:#991b1b">User and Access Agent</mark>

- **Backend change required:** Major change required for permission introspection, user-scope APIs, role-aware responses, privacy filtering, and any password, email, invitation, or role-management workflow.

Handles account, role, and permission questions.

Example requests:

- What access do I have?
- Who can view this camera?
- How do I change my password?
- Which users are administrators?
- Why cannot I access the camera directory?

Potential future actions:

- Start a password reset workflow
- Update email
- Manage roles
- Invite or disable users

The agent must not reveal hidden users, personal data, or authorization rules that would expose protected resources.

### 2.5 Product Support and Platform Health

#### <mark style="background-color:#b7e4c7;color:#14532d">Help and Product Guide Agent</mark>

- **Backend change required:** None for documentation-only support; index existing manuals and expose application route links through the chatbot service.

Acts as the general product-support assistant.

Example requests:

- How do I investigate an alert?
- How do I add a camera?
- How do I use the Insights page?
- What does this alert status mean?
- Where can I find camera reports?

It uses indexed product documentation and links users to relevant application pages or help articles.

#### <mark style="background-color:#ffd166;color:#7c4a03">Error Explanation Agent</mark>

- **Backend change required:** Minor response change required to provide sanitized error codes, dependency status, and user-safe remediation hints from existing APIs and logs.

Explains application errors in user-friendly language.

Example requests:

- What does this camera connection error mean?
- Why did report generation fail?
- Why is the alert image unavailable?
- The dashboard is blank. What should I check?

Inputs:

- Known error catalog
- Backend logs or sanitized error IDs
- API response status
- Service health
- User permissions

It must not expose stack traces, credentials, internal network addresses, or sensitive logs.

#### <mark style="background-color:#ffd166;color:#7c4a03">System Health Agent</mark>

- **Backend change required:** Minor response change required to expose authenticated health, dependency, resource, and freshness data through health endpoints or a monitoring adapter.

Monitors platform services and infrastructure.

Example requests:

- Is the alert service healthy?
- Which services are down?
- Are CPU or memory levels high?
- Why are alerts delayed?
- Is the database connected?

Potential integrations:

- Backend health endpoints
- Service logs
- Database health
- Docker/service status
- CPU and memory metrics
- Queue or worker status

Health answers must include the observation time and identify whether a result is current or cached.

#### <mark style="background-color:#ffd166;color:#7c4a03">Model and Detection Agent</mark>

- **Backend change required:** Minor response change required to expose active model version, supported classes, confidence thresholds, and detection metadata through a read-only endpoint.

Explains detection behavior and model output.

Example requests:

- Why did the model classify this as a person?
- What objects can this camera detect?
- What is the confidence score?
- Which model is active?
- Why are false positives increasing?

The agent should report model metadata and confidence values directly from the system. It must not invent model capabilities or imply certainty beyond the evidence.

#### <mark style="background-color:#ffadad;color:#991b1b">Compliance and Audit Agent</mark>

- **Backend change required:** Major change required for immutable audit-event storage, access auditing, retention rules, scoped audit queries, and export controls.

Answers traceability and audit questions.

Example requests:

- Who viewed this alert?
- When was this camera disabled?
- Show configuration changes from this week.
- Which alerts were manually dismissed?
- Generate an audit report.

This agent is read-only for most users and must use immutable audit records. Access to audit data should itself be audited.

#### <mark style="background-color:#b7e4c7;color:#14532d">Multi-Language Support Agent</mark>

- **Backend change required:** None for response translation; implement it in the chatbot layer while preserving canonical IDs, timestamps, URLs, and tool fields.

Supports multilingual user interaction.

Capabilities:

- Detect user language.
- Translate the final response.
- Preserve camera names, alert IDs, timestamps, and URLs.
- Retrieve multilingual documentation where available.

Internal tool calls and structured fields should remain in canonical English formats.

#### <mark style="background-color:#ffadad;color:#991b1b">Escalation and Human Support Agent</mark>

- **Backend change required:** Major change required for support-ticket creation, evidence packaging, external-delivery controls, escalation status, confirmation, and audit records.

Handles requests that require human intervention.

Example requests:

- Contact support.
- Create a ticket for this camera problem.
- This issue is still unresolved.
- Escalate this critical incident.

The agent collects:

- User and tenant
- Site
- Camera
- Alert ID
- Time range
- Description
- Evidence links
- Severity
- Troubleshooting already attempted

Ticket creation requires confirmation when it sends evidence or personal data externally.

## 3. Domain Groups

The supervisor router should route to domain groups before selecting a worker:

```text
Supervisor Router
|
+-- Alert Intelligence
|   +-- Alert Investigation
|   +-- Alert Summary
|   +-- Image and Anomaly Analysis
|   +-- Video Retrieval
|   +-- Incident Investigation
|   +-- Timeline and Sequence
|   +-- False Positive and Feedback
|
+-- Camera Operations
|   +-- Camera Operations
|   +-- Camera Troubleshooting
|   +-- Live Monitoring
|   +-- Camera Configuration
|   +-- Surveillance Control
|
+-- Analytics and Reporting
|   +-- Insights and Analytics
|   +-- KPI Report
|   +-- Report Export
|
+-- Notifications and Accounts
|   +-- Notification
|   +-- Notification Configuration
|   +-- User and Access
|
+-- Product and Platform Support
    +-- Help and Product Guide
    +-- Error Explanation
    +-- System Health
    +-- Model and Detection
    +-- Compliance and Audit
    +-- Multi-Language Support
    +-- Escalation and Human Support
```

This reduces routing ambiguity and allows each group to expose only its own tools.

## 4. Recommended Initial Release

Start with these eight read-mostly agents:

1. Help and Product Guide Agent
2. Alert Investigation Agent
3. Alert Summary Agent
4. Camera Operations Agent
5. Camera Troubleshooting Agent
6. Insights and KPI Agent
7. Notification Agent
8. Escalation and Human Support Agent

These address the most common support workflows without introducing broad autonomous control.

### 4.1 Later Action Agents

Add these after permissions, approvals, and audit logging are proven:

- Camera Configuration Agent
- Notification Configuration Agent
- Surveillance Control Agent
- User and Access Agent write workflows
- False Positive and Feedback write workflows
- Report Export Agent for sensitive data

## 5. Shared Tool Layer

Agents must use typed tools and must not access MongoDB, files, or services directly.

### 5.1 Image-Agent Module Mapping

| Responsibility | Current code module | Recommended change |
|---|---|---|
| Image alert worker | `Anamoly_object_agent.py` | Keep `image_analyzer(state)` as the LangGraph entry point, but call typed image-analysis and alert-context tools instead of reading files directly. |
| Alert date and metadata | `Metadata_loader.py` | Keep `parse_date_from_query()` and `metadata_loader(state)`; return validated `alert_date`, scoped `alert_metadata`, and timezone-aware date parsing errors. |
| Image summary generation | `Utils/Alert_summary_generator.py` | Wrap per-image, per-camera, and daily summary functions as idempotent service tools with structured status and timestamps. |
| Image-agent routing | `router.py` | Extend the structured route with `image_alert`, `camera_name`, `alert_timestamp`, and `summary_scope`; route video requests to a deferred capability instead of the image worker. |
| Shared state | `Agent_state.py` | Preserve `image_metadata`, `image_analysis`, `doc_context`, and `final_response`; add `image_sources`, `analysis_confidence`, `summary_status`, and `analysis_timestamp`. |
| Final response | `Output_formatter.py` | Require image answers to preserve alert ID, camera, timestamp, image source, confidence, and uncertainty. |

### 5.2 Image-Agent Tool Boundary

Initial image tools:

```text
load_alert_metadata(date, camera_id, alert_timestamp)
get_alert_image(alert_id)
generate_image_summary(alert_id, regenerate)
generate_camera_image_summary(camera_id, date, regenerate)
generate_daily_image_summary(date, regenerate)
analyze_alert_image(alert_id, question)
```

These tools should return structured data and source references. The agent may explain the returned evidence, but it must not directly mutate JSON files, access unrestricted paths, or infer video evidence.

Recommended tools:

```text
search_alerts(filters, page)
get_alert(alert_id)
get_alert_evidence(alert_id)
find_similar_alerts(alert_id, filters)
get_camera(camera_id)
search_cameras(filters)
get_camera_live_status(camera_id)
get_camera_health(camera_id)
get_camera_group(group_id)
get_notification_history(filters)
get_notification_config(camera_id)
get_insights(filters)
get_kpi_report(filters)
search_product_docs(query, scope)
get_model_metadata(camera_id)
get_audit_events(filters)
create_report_job(request)
create_support_ticket(request)
propose_configuration_change(request)
execute_approved_change(approval_id)
```

Every tool contract must define:

- Input and output schema
- Required permission scope
- Read/propose/write classification
- Timeout
- Retry policy
- Pagination limit
- Data-redaction policy
- Audit requirements
- Idempotency behavior

## 6. Router Contract

The router should produce structured output rather than a free-form agent name:

```json
{
  "domain": "alert_intelligence",
  "agent": "alert_investigation",
  "intent": "search_alerts",
  "date": "2026-08-21",
  "start_time": null,
  "end_time": null,
  "camera_ids": ["camera-12"],
  "alert_types": ["high_risk"],
  "requires_action": false,
  "risk_level": "low",
  "needs_clarification": false,
  "confidence": 0.96
}
```

The backend must validate this object and apply authorization filters. The model cannot set tenant, user, role, site scope, or service credentials.

## 7. Read, Propose, and Write Permissions

Use three explicit capability levels:

| Level | Meaning | Examples |
|---|---|---|
| Read | Retrieve information within the user's scope | Search alerts, camera status, reports |
| Propose | Prepare a change without executing it | Draft notification or camera changes |
| Write | Execute an approved, authorized change | Disable alerts, restart monitoring |

Every write operation requires:

1. Valid user permission.
2. Exact target and arguments.
3. Human confirmation.
4. Short-lived approval token.
5. Idempotency key.
6. Before/after record.
7. Immutable audit event.

## 8. Evidence and Response Contract

Operational answers should include, where applicable:

- Alert ID
- Camera name and ID
- Event timestamp and timezone
- Source image or video link
- Data freshness
- Model confidence
- Applied filters
- Uncertainty or missing data
- Recommended next step

Example response structure:

```json
{
  "status": "resolved",
  "answer": "Camera 12 produced 4 high-priority alerts between 09:00 and 12:00.",
  "facts": [
    {"label": "Alert count", "value": 4},
    {"label": "Camera", "value": "Camera 12"}
  ],
  "sources": [
    {"type": "alert", "id": "alert-123", "timestamp": "2026-08-21T10:14:22Z"}
  ],
  "filters": {
    "start_at": "2026-08-21T09:00:00Z",
    "end_at": "2026-08-21T12:00:00Z"
  }
}
```

The output formatter may improve clarity and tone, but it must not remove sources, change facts, or introduce unsupported conclusions.

## 9. Clarification Handling

The chatbot should ask for missing information when a request cannot be safely scoped.

User:

> Show the alerts from yesterday.

Assistant:

> Which camera or cameras should I search? You can provide a camera name, camera ID, or `all permitted cameras`.

Other clarification triggers:

- Camera name matches multiple cameras.
- A time such as `14:32` has no date or timezone.
- A report request has no site or time range.
- A write request has no exact target.
- The user requests a hidden or inaccessible resource.
- A cross-camera investigation exceeds the user's permitted scope.

## 10. Agent Selection Examples

| User request | Agent | Expected behavior |
|---|---|---|
| How do I investigate an alert? | Help and Product Guide | Return workflow instructions and application link |
| Why was alert A-123 generated? | Alert Investigation | Retrieve alert metadata and evidence, then explain |
| Summarize today's warehouse alerts | Alert Summary | Resolve date/site, aggregate alerts, cite data |
| Is Camera 14 offline? | Camera Operations | Return live and last-seen status |
| Camera 14 has delayed video | Camera Troubleshooting | Check health signals and recommend next step |
| Which camera has the most alerts this month? | Insights and Analytics | Return ranked metrics and filters |
| Did I receive the alert email? | Notification | Check delivery history within permission scope |
| Disable email alerts for Camera 12 | Notification Configuration | Show proposed change and request approval |
| Create a ticket for this issue | Escalation | Collect missing context, preview evidence, request confirmation |
| Who disabled Camera 7? | Compliance and Audit | Search immutable audit events if authorized |

## 11. Product and Engineering Priorities

### Priority 0: Safety and foundations

- Typed tool registry
- JWT and tenant/site scope enforcement
- Structured router output
- Checkpointing
- Audit events
- Source references
- Prompt-injection tests

### Priority 1: Support value

- Help and Product Guide
- Alert Investigation
- Alert Summary
- Camera Operations
- Camera Troubleshooting
- Notification Support
- Insights and KPI

### Priority 2: Investigation depth

- Video Retrieval
- Incident Investigation
- Timeline and Sequence
- Image and Anomaly Analysis
- Model and Detection

### Priority 3: Controlled actions

- Notification Configuration
- Camera Configuration
- Surveillance Control
- False Positive and Feedback writes
- User and Access writes
- Sensitive Report Export

## 12. Design Principle

The maintainable pattern is:

```text
User Query
    |
Supervisor Router
    |
Intent + Entities + Permissions + Risk
    |
Domain Agent
    |
Typed Backend Tools
    |
Structured Findings
    |
Evidence and Policy Verifier
    |
Output Formatter
    |
User Response with Sources or Approval Request
```

The agent should reason about which tool to use, but the platform must decide what the user is allowed to access and whether an action may execute.
