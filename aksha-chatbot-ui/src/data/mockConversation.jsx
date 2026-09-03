// Scripted conversation used to exercise every message type in the panel.
// Mirrors mockup 3a ("Complete thread — all message types, one ledger") plus
// the rich-output examples from 4b and the multi-agent example from 4c.
// This is local UI-only data — no backend call happens yet. Replace with the
// real SSE-driven message stream once aksha-chatbot-api exists.

export const conversation = [
  { type: 'operator', props: { time: '10:04', text: 'Show all high-risk alerts from Camera 12 today.' } },
  {
    type: 'agent',
    props: {
      agentKey: 'alert_investigation',
      freshness: { kind: 'live', label: 'Live · 10:04:12' },
      body: (
        <>
          Two high-risk alerts on Camera 12 today. Both are loading-bay intrusion detections, 41 minutes apart.
        </>
      ),
      frames: [
        { label: 'Frame · CAM 12 09:23', caption: 'ALT-4471', timeLabel: '09:23' },
        { label: 'Frame · CAM 12 08:42', caption: 'ALT-4468', timeLabel: '08:42' },
      ],
      sources: ['ALT-4471 · 09:23', 'ALT-4468 · 08:42', 'CAM 12 · LOADING BAY'],
      actions: [{ label: 'OPEN IN ALERTS', variant: 'secondary' }, { label: 'COPY ANSWER', variant: 'ghost' }],
    },
  },
  { type: 'operator', props: { time: '10:06', text: 'Which cameras have email alerts enabled?' } },
  {
    type: 'agentTable',
    props: {
      agentKey: 'camera_operations',
      agent: 'Camera Operations',
      freshness: { kind: 'live', label: 'Live · 10:12' },
      body: 'Nine of eleven cameras have email alerts on. Camera 3 and Camera 19 are off.',
      table: {
        title: 'Table · 11 rows',
        columns: ['Camera', 'Group', 'Email'],
        rows: [
          ['CAM 03 · LOBBY', 'Indoor', 'OFF'],
          ['CAM 07 · NORTH GATE', 'Perimeter', 'ON'],
          ['CAM 12 · LOADING BAY', 'Yard', 'ON'],
          ['CAM 19 · PERIMETER S', 'Perimeter', 'OFF'],
          ['CAM 21 · NORTH GATE 2', 'Perimeter', 'ON'],
        ],
        footer: 'Showing 5 of 11 · /api/camgroup',
      },
    },
  },
  {
    type: 'clarification',
    props: {
      question: 'Two cameras match "North Gate". Which one did you mean?',
      options: [
        { label: 'CAM 07 · NORTH GATE', meta: '4 alerts' },
        { label: 'CAM 21 · NORTH GATE 2', meta: '11 alerts' },
        { label: 'Both' },
      ],
    },
  },
  { type: 'operator', props: { time: '10:09', lang: 'HI', text: 'कैमरा 12 पर आज कौन-कौन से हाई-रिस्क अलर्ट आए?' } },
  {
    type: 'agent',
    props: {
      agentKey: 'alert_investigation',
      langBadge: 'HI',
      freshness: { kind: 'live', label: 'Live · 10:09' },
      body: (
        <>
          आज <b style={{ borderBottom: '2px solid #326BC9' }}>CAM 12</b> पर दो हाई-रिस्क अलर्ट दर्ज हुए — <b style={{ borderBottom: '2px solid #326BC9' }}>ALT-4471</b> (09:23) और <b style={{ borderBottom: '2px solid #326BC9' }}>ALT-4468</b> (08:42)। दोनों लोडिंग बे में intrusion detection हैं।
        </>
      ),
      sources: ['ALT-4471 · 09:23', 'ALT-4468 · 08:42'],
    },
  },
  {
    type: 'cached',
    props: {
      body: "Camera 14 was online as of 09:42. The live status feed hasn't refreshed since — treat this as last known, not current.",
      ref: { label: 'CAM 14 · STATUS 09:42', time: '09:42' },
    },
  },
  {
    type: 'degraded',
    props: {
      body: "The alert service isn't responding right now, so I can't confirm this morning's deliveries. Camera settings and site documentation are still available.",
      correlationId: 'a91f-7c02-4d18',
    },
  },
  {
    type: 'escalation',
    props: {
      time: '10:14',
      intro: "I've sent this to the on-call engineer. Here's what was captured — check it before you close the panel.",
      fields: [
        { label: 'Ticket', value: 'SUP-2291' },
        { label: 'Camera', value: 'CAM 07 · NORTH GATE' },
        { label: 'Alert', value: 'ALT-4462 · 07:15' },
      ],
    },
  },
  {
    type: 'approval',
    props: {
      actionLabel: 'disable email alerts',
      target: 'CAM 12 · LOADING BAY',
      consequence: 'This stops notification emails to 3 recipients until re-enabled.',
      expiresIn: '4:52',
    },
  },
  { type: 'operator', props: { time: '10:22', text: 'How do this month’s alerts break down by severity?' } },
  {
    type: 'agentDonut',
    props: {
      agentKey: 'insights_analytics',
      agent: 'Insights & Analytics',
      freshness: { kind: 'live', label: '118 alerts' },
      body: 'Low severity dominates at 47%. High risk is 18 alerts — 15% — and 11 of those are on the perimeter group.',
      donut: {
        title: 'Severity mix',
        slices: [
          { label: 'HIGH', value: 18, color: '#163364' },
          { label: 'MEDIUM', value: 44, color: '#4176cd' },
          { label: 'LOW', value: 56, color: '#d6e3f7' },
        ],
        footer: '/api/insight · Aug 1–24',
      },
    },
  },
];

export const suggestedQuestions = [
  'Show all high-risk alerts from Camera 12 today.',
  'Which cameras have email alerts enabled?',
  'Is anything happening right now near the loading bay?',
];

// The six real, implemented Phase 1 agents (see docs/CHATBOT_SYSTEM_ARCHITECTURE.md
// Section 9b). Multi-Language Support is deliberately not listed here — it's a
// translation step applied to any agent's answer, not its own routable agent
// (AGENTS.md: "Multi-Language is not an agent").
export const agentDirectory = [
  { key: 'camera_operations', name: 'Camera Operations', ref: '/api/camera · /api/camgroup', live: true },
  { key: 'alert_investigation', name: 'Alert Investigation', ref: '/api/recentAlert · /api/alert', live: true },
  { key: 'live_monitoring', name: 'Live Monitoring', ref: '/api/active/getLiveCamera', live: true },
  { key: 'insights_analytics', name: 'Insights & Analytics', ref: '/api/insightReport', live: true },
  { key: 'notification', name: 'Notification (read-only)', ref: '/api/email_notification', live: true },
  { key: 'help_guide', name: 'Help & Product Guide', ref: 'indexed docs, no live endpoint', live: false },
  { key: 'error_explanation', name: 'Error & Status Explanation', ref: 'static glossary, no live endpoint', live: false },
];
