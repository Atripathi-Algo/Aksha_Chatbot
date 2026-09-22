# Agent Query Test — 2026-09-22

Live end-to-end test of all 9 chatbot agents (`aksha-chatbot-api`, `POST /v1/chat/invoke`, port 8010), 5 queries per agent (45 total). Each query used a fresh `thread_id` so no conversation history leaked between unrelated test queries. Responses below are pasted verbatim from the live `answer` field.

## Summary

| Agent | Queries | Resolved | Routing mismatches |
|---|---|---|---|
| Camera Operations (`camera_operations`) | 5 | 5/5 | 0 |
| Alert Investigation (`alert_investigation`) | 5 | 5/5 | 0 |
| Live Monitoring (`live_monitoring`) | 5 | 5/5 | 0 |
| Insights & Analytics (`insights_analytics`) | 5 | 5/5 | 1 |
| Notification (`notification`) | 5 | 5/5 | 0 |
| Help & Product Guide (`help_guide`) | 5 | 5/5 | 0 |
| Error & Status Explanation (`error_explanation`) | 5 | 5/5 | 0 |
| Camera Troubleshooting (`camera_troubleshooting`) | 5 | 5/5 | 0 |
| Timeline & Sequence (`timeline`) | 5 | 5/5 | 0 |

**Total: 45/45 queries returned `status: resolved`. 1 routing mismatch found:**

- Expected `insights_analytics`, routed to `timeline` — query: "Summarize alert activity for today."

---

## Camera Operations (`camera_operations`)

### 1. How many cameras do we have configured?

You currently have three cameras configured in the system: cam3, cam1-Gate-Camera, and cam2. Please let me know if you would like any additional details regarding their settings or current status.

### 2. Which cameras have email alerts enabled?

Email alerts are currently enabled for cam3, cam1-Gate-Camera, and cam2. Please let me know if you need assistance with any other camera settings today.

### 3. What camera groups exist and which cameras are in them?

The Algo Office Notifications group is currently configured in the system. It contains three cameras: cam3, cam1-Gate-Camera, and cam2. Please let me know if you need assistance with any other camera groups.

### 4. What's the FPS setting on the loading dock camera?

I am sorry, but the current camera records do not include a loading dock camera, so I cannot confirm its FPS setting. Please let me know if you would like me to check the settings for any of the available cameras.

### 5. List all cameras with person-detection enabled.

I have checked the system records for you, but none of the currently configured cameras have person-detection enabled, as the features are limited to live view and anomaly detection. Please let me know if you would like me to check any other settings or camera configurations.

---

## Alert Investigation (`alert_investigation`)

### 1. What alerts were triggered in the last 24 hours?

In the last 24 hours, multiple alerts were triggered on cam3. You can review the recent alert events recorded for this camera, starting from September 22, 2026. Please let me know if you would like me to check any additional details for you.

### 2. Show me alerts for the main entrance camera.

I can confirm that the main entrance camera corresponds to cam1-Gate-Camera in the system. However, the recent alert data provided currently covers camera cam3 rather than the gate camera. Please let me know if you would like me to check a different camera or if there is anything else I can assist you with.

### 3. Were there any intrusion alerts yesterday?

Yes, recent alert events were recorded for camera cam3 on September 22, 2026, starting from approximately 11:00 AM. Please let me know if you would like me to check any specific timeframes or other cameras for additional details.

### 4. Give me the details of alert ID ALT-10293.

I am unable to confirm details for alert ID ALT-10293 using the currently available recent alerts data. Please verify the alert identifier or let me know if you would like to review recent activity for a specific camera.

### 5. Has camera 7 triggered any alerts this week?

I am sorry, but there is no Camera 7 registered in the system. The available cameras are cam3, cam1-Gate-Camera, and cam2, none of which correspond to Camera 7. Please let me know if you would like me to check the alert activity for one of the existing cameras instead.

---

## Live Monitoring (`live_monitoring`)

### 1. Show me the live cameras right now.

As of now, the system shows three live cameras currently sending video: cam3, cam1-Gate-Camera, and cam2. You can view any of these feeds directly by using the watch live control on the camera's name. Please let me know if you need assistance with anything else today.

### 2. Which cameras are currently in spotlight view?

There are no cameras currently in spotlight view as of this snapshot. Please let me know if you would like me to check the status of any specific cameras or review active alerts.

### 3. Is the warehouse camera online at this moment?

As of this current snapshot, I do not see a camera specifically named warehouse in the system. The available cameras are cam3, cam1-Gate-Camera, and cam2, all of which are currently online and verified streaming. Please let me know if one of these corresponds to the warehouse area you wish to view.

### 4. What's the current live status of all cameras?

As of now, cam3, cam1-Gate-Camera, and cam2 are all online and actively streaming video feeds. You can view any of these feeds live by using the Watch live control on the camera name. Please let me know if you need assistance with any specific camera.

### 5. Are any cameras currently down or offline?

As of now, all three cameras listed in the current snapshot are verified as actively streaming video feed with no offline or down statuses reported. You may use the watch live control on any camera name to check their feeds. Please let me know if you need assistance with anything else.

---

## Insights & Analytics (`insights_analytics`)

### 1. Give me the insight report for the last 7 days.

I am unable to find any alert data for the last 7 days. If you would like to review activity, please feel free to try a different date range.

### 2. How many alerts happened this month compared to last month?

I found no alert data recorded for this month or last month. Please feel free to try a different date range to check historical alert activity.

### 3. What's the trend in false-positive alerts recently?

Reviewing the last 7 days of alert history, I found no data recorded for false-positive alerts during this period. Please feel free to try a different date range if you would like to check another timeframe.

### 4. Which camera generated the most alerts this week?

I am unable to confirm alert counts because the requested date range was too large for the system to process. Please try asking for a narrower range, such as a specific week or month, and I would be happy to help you find that information.

### 5. Summarize alert activity for today. ⚠️ routed to `timeline`

Alert activity today spans twenty-five episodes across cam3 and cam1-Gate-Camera, starting with cam3 at 2026-09-21 11:27:00 and concluding with cam3 at 2026-09-22 11:21:36. Notable activity periods include frequent episodes on cam3 throughout the afternoon of September 21, followed by a long quiet gap overnight until activity resumed on both cameras around 08:39 on September 22. All recorded timestamps represent evidence capture times.

---

## Notification (`notification`)

### 1. What are the email notification settings?

The configured email recipients for notifications and alert reports are googlecolab@algoanalytics.com, with a pending new email set to cctv.alerts@algoanalytics.com. Please note that these are configured recipients only, as we do not have delivery-confirmation logs available.

### 2. Who gets notified for camera group Warehouse-A?

No notification config was found for that group, so it may not have any set up, or that group name or ID may not exist. Please note that this endpoint requires the group's actual database ID rather than its display name if you would like to check again.

### 3. Do we get a notification every time an alert fires, or only for certain types?

Notifications are sent to the configured addresses googlecolab@algoanalytics.com for alerts and reports, but delivery-confirmation logs are not available to verify if every single alert triggers a message.

### 4. Was the notification for alert ALT-10293 delivered?

I can confirm that notification emails for alert ALT-10293 are configured to be sent to googlecolab@algoanalytics.com. However, delivery-confirmation logs are not currently available in the system, so I am unable to verify whether the message was actually received.

### 5. List the notification recipients for the main gate group.

No notification configuration was found for the main gate group. This could mean the group has no notification settings configured, that no camera group by this name or ID exists at all, or that this isn't the group's real database ID. Please verify the exact group identifier through Camera Operations if you are unsure.

---

## Help & Product Guide (`help_guide`)

### 1. How do I search for an alert?

I can certainly help point you in the right direction regarding product features, but please note that the available documentation search results currently only contain proposed design notes for alert agents rather than shipped user workflows. For checking live alerts or investigating specific events on your cameras, please feel free to ask about a specific camera or alert instead.

### 2. How does multi-language support work?

Multi-language support is currently a proposed feature and is not yet available in the product. The planned design includes detecting user language and translating final responses while preserving canonical fields like timestamps, camera names, and alert IDs. Please let me know if you have questions about any specific currently available camera or alert features.

### 3. What does the spotlight view feature do?

I am sorry, but the documentation search results available to me do not contain information about the spotlight view feature. Please let me know if you would like me to look into a different product topic or guide.

### 4. How do camera groups relate to notification settings?

I am unable to confirm the exact relationship between camera groups and notification settings from the available documentation, as the notification configuration agent features currently listed are part of a proposed design rather than confirmed shipped behavior. Please feel free to ask about specific camera statuses or existing read-only configurations if you need further assistance today.

### 5. What can this chatbot help me with?

As the Help and Product Guide agent, I can answer questions about how to use Aksha, investigate alerts, manage cameras, and navigate features like the Insights page. Please note that the multi-language support and certain advanced agent capabilities mentioned in our internal design catalogs are currently planned features and not yet available. Feel free to ask about a specific camera, alert, or product feature whenever you need assistance.

---

## Error & Status Explanation (`error_explanation`)

### 1. What does the camera status 'creating' mean?

The camera status creating means the device was just added and is still being provisioned by the backend. Please wait a moment and refresh the view, as this is simply a transient state right after creating a camera and not an error.

### 2. What does 'offline' status mean for a camera?

The offline status means the camera is not currently connected or available to the Aksha backend. To resolve this, please check that the camera is powered on and reachable over the network, verify its RTSP link, and then refresh the camera status.

### 3. What does the error 'stream unavailable' mean?

The stream unavailable message indicates that the detection pipeline lost its RTSP video connection to the camera and could not read a frame from the stream. Please check the camera's network connection and RTSP link to resolve this issue. A follow-up notification will be sent automatically once the connection recovers.

### 4. Explain the 'reconnecting' status.

I do not currently have an explanation for that specific message on file. Please feel free to ask another operator or check with support for more details regarding the reconnecting status.

### 5. What does it mean when a camera shows 'no signal'?

I don't have an explanation for that specific message on file. Please check with support or ask another operator for guidance on this status.

---

## Camera Troubleshooting (`camera_troubleshooting`)

### 1. Why is cam3 not showing any video?

For cam3, video frames are actually arriving right now, so this is very likely a case where the status label is stale and still reads creating while the feed is already working. No action is needed for the feed itself, as the label should clear on refresh. Please let us know if you need any further assistance with this camera.

### 2. Which cameras have stopped sending frames?

All checked cameras, including cam1-Gate-Camera, cam2, and cam3, are currently healthy and verified as streaming video frames. There are no cameras that have stopped sending frames at this time.

### 3. Why does cam1-Gate-Camera say 'creating' for so long?

For cam1-Gate-Camera, video frames are actually arriving right now even though the status still reads creating. This is very likely because the status label is stale, as 'creating' is a transient provisioning state and this camera has clearly finished provisioning since it's streaming. No action is needed for the feed, and the label should clear on refresh.

### 4. Why is the warehouse camera not detecting motion?

I cannot find a camera named warehouse in the system, and detection-pipeline health is not available through this system, so I am unable to confirm why motion detection is not occurring. Please let me know if you would like me to check any of the available cameras instead.

### 5. What could cause a camera to keep disconnecting?

I have checked all connected cameras, and none are currently reporting disconnects or health issues; all checked cameras are actively streaming video. While I cannot confirm past disconnect times or recent backend errors because those signals are not available here, all current feeds are verified as streaming successfully. Please let me know if you would like me to check a specific camera's status further.

---

## Timeline & Sequence (`timeline`)

### 1. Give me a timeline of today's alerts on cam3.

Here is the chronological timeline of alert episodes for cam3, based on evidence capture times. Activity begins with an episode from 2026-09-21 11:27:00 to 11:32:49, followed by several subsequent alert runs throughout the day and into the next morning. A notable overnight quiet gap occurs between September 21 at 19:54:35 and September 22 at 08:39:27, before activity resumes until the final recorded episode ending at 2026-09-22 11:25:18.

### 2. What happened on cam3 between 12:30 and 12:45?

On cam3 between 12:30 and 12:45, alert activity was captured as part of an episode that started at 2026-09-21 12:28:55 and ended at 2026-09-21 13:23:23. During this time, the camera recorded 341 frames over a duration of 3268 seconds, following a quiet gap of 363 seconds. Please let me know if you would like me to check any other specific time frames.

### 3. Show alert clusters for cam3 in the last 3 hours.

For cam3, the timeline shows five alert episodes captured between 2026-09-22 08:39:27 and 2026-09-22 11:25:18. The activity begins with a sustained cluster, followed by shorter intermittent episodes at 09:22:14 and 09:38:18 with quiet gaps of about 25 and 15 minutes. The sequence concludes with two more active clusters starting at 10:04:21 and 10:28:16, the latter running for nearly an hour. Please let me know if you would like me to examine any specific portion of this sequence in more detail.

### 4. What's the sequence of alerts on the main entrance camera today?

I have checked the records for the main entrance camera today, and there are currently no alert episodes recorded for that timeframe. Please let me know if you would like me to check a different time window or another camera location.

### 5. Show me the gap between alerts on cam3 this morning.

Hello. For camera cam3 this morning, the quiet gaps between alert episodes vary, starting with a 409-second gap after the first episode and ranging up to a 1,543-second gap later in the morning. All timestamps represent the evidence capture time recorded by the system. Please let me know if you would like me to detail the gaps for any specific time range today.

---
