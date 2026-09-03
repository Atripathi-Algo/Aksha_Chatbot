# Agents

Eight agents. Every answer names the one that produced it; the badge replaces the
generic role label in the same position and size.

| Agent | Reads | Badge | Output shapes |
|---|---|---|---|
| Help & Product Guide | indexed docs / UserManual | neutral | prose + manual-section citation, doc version |
| Alert Investigation (basic) | `/api/alert` · `/api/myAlert` | accent | prose, alert-ID chips, frames, table |
| Camera Operations | `/api/camera` · `/api/camgroup` | accent | table |
| Live Monitoring | `/api/active` · Socket.IO | accent | prose + live frame; freshness "Socket · n s ago" |
| Insights & Analytics | `/api/insight` · `/api/insightReport` | accent | bar chart, donut, table, date-range label |
| Notification (read) | `/api/notification` | accent | delivery status list; never sends mail |
| Multi-Language Support | chatbot layer only | neutral + language code | rephrases another agent's result; footer names both |
| Error Code Explanation | chatbot layer only | neutral | mono code header + plain-language cause block |

Rules:
- Accent badge = reads a live endpoint, therefore carries a freshness label.
- Neutral badge = chatbot layer, **no** freshness label (nothing live was read).
- Multi-agent answers collapse the badge to "n agents" + names, and present one
  labelled fact list — never several separate replies.
- Routing is automatic in phase one; the directory in the header is informational.
