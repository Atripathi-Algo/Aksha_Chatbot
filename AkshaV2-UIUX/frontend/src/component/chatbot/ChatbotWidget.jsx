import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  BarChart3,
  Bot,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleHelp,
  Clock3,
  History,
  Mail,
  MessageSquare,
  Play,
  Plus,
  RefreshCcw,
  Send,
  Square,
  Trash2,
  Video,
  Wrench,
  X,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { socket } from "../../router/socket";
import { listSessions, saveSession, deleteSession } from "./chatHistory";
import "./chatbot.scss";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

// Categorical identity color for a camera, stable across every chart and
// every query — assigned by each camera's position in an alphabetically
// sorted name list (never by its rank in a given result, which changes
// query to query as alert counts change; see dataviz skill's "color follows
// the entity, never its rank"). The first 3 slots of this 8-hue order are
// validated all-pairs CVD-safe; slots 4-8 are validated adjacent-pairs only
// (fine for a legend a reader scans in order, not a scatter of same-colored
// dots) — see the dataviz skill's palette.md.
const CAMERA_PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
const CAMERA_OTHER_COLOR = "#9aa1af";

function cameraColor(name, allNames) {
  const sorted = [...new Set(allNames)].sort();
  const index = sorted.indexOf(name);
  return index >= 0 && index < CAMERA_PALETTE.length ? CAMERA_PALETTE[index] : CAMERA_OTHER_COLOR;
}

const API_BASE = process.env.REACT_APP_CHATBOT_API_URL || window.location.origin;
const SUGGESTIONS = [
  "How many alerts did cam1-Gate-Camera have on 2026-09-03?",
  "Show recent alerts from cam3.",
  "Which cameras are live right now?",
];

// One thread_id per conversation, not per message — the backend keys its
// conversation memory off this, so minting a fresh one on every send (as
// this used to do) silently discarded that memory on every single turn.
const makeThreadId = () =>
  `frontend-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

// Per-agent presentation, per the design handoff's §3/§4: API-backed agents
// (real Node-backend tool calls) get the accent tile; documentation-backed
// agents (help_guide's doc search, error_explanation's static glossary) get
// the neutral tile. Keyed by the snake_case key the `done` event sends;
// AGENT_BY_LABEL mirrors it by label since the earlier `routed` event only
// has the label, not the key, so the agent identity can render the instant
// routing completes rather than waiting for `done`.
const AGENTS = {
  camera_operations: { label: "Camera Operations", icon: Video, tone: "accent" },
  alert_investigation: { label: "Alert Investigation", icon: Bell, tone: "accent" },
  live_monitoring: { label: "Live Monitoring", icon: Clock3, tone: "accent" },
  insights_analytics: { label: "Insights & Analytics", icon: BarChart3, tone: "accent" },
  notification: { label: "Notification", icon: Mail, tone: "accent" },
  camera_troubleshooting: { label: "Camera Troubleshooting", icon: Wrench, tone: "accent" },
  timeline: { label: "Timeline & Sequence", icon: History, tone: "accent" },
  help_guide: { label: "Help & Product Guide", icon: BookOpen, tone: "neutral" },
  error_explanation: { label: "Error & Status Explanation", icon: CircleHelp, tone: "neutral" },
};
const AGENT_BY_LABEL = Object.fromEntries(
  Object.entries(AGENTS).map(([key, meta]) => [meta.label, { key, ...meta }])
);

function resolveAgent(key, label) {
  if (key && AGENTS[key]) return { key, ...AGENTS[key] };
  if (label && AGENT_BY_LABEL[label]) return AGENT_BY_LABEL[label];
  return null;
}

// The API returns configured recipients, never delivery confirmation — this
// caveat is chrome, not model output, so it always renders for a resolved
// notification answer rather than depending on the formatter to say it.
const NOTIFICATION_CAVEAT = "Configured recipients — not confirmed delivery.";

// Defensive backstop, not the fix — the formatter's own system prompt now
// says plain prose only, but this renders as plain text with no markdown
// parser, so any markdown the model still slips in would otherwise show up
// as literal asterisks (**cam3**) instead of formatting anything. Only
// strips the double-asterisk bold and backtick spans actually observed in
// the wild — single asterisks are left alone, since stripping those risks
// mangling a legitimate one (multiplication, a stray character) far more
// than it's ever seen the model use for emphasis.
function stripMarkdown(text) {
  if (!text) return text;
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/`(.+?)`/g, "$1");
}

function FreshnessPill({ freshness, agentKey, asOf }) {
  if (!freshness || !freshness.kind || !freshness.label) return null;
  // Live Monitoring reads a REST snapshot, not a real-time push (§4) — it
  // must never show the same filled "Live" dot as an agent backed by a
  // genuinely live feed, or operators will read more freshness into it than
  // the endpoint actually guarantees.
  if (agentKey === "live_monitoring" && freshness.kind === "live") {
    const label = asOf ? `Snapshot · as of ${asOf}` : "Snapshot";
    return <span className="aksha-pill aksha-pill-fresh aksha-pill-fresh-snapshot">{label}</span>;
  }
  return <span className={`aksha-pill aksha-pill-fresh aksha-pill-fresh-${freshness.kind}`}>{freshness.label}</span>;
}

// The Node API bakes its own http://localhost:5000 origin into every image
// URL it returns — correct only for a browser on the server's own machine.
// Rewriting to a same-origin relative path lets nginx's own proxy (see
// default.conf's /alerts/ location) resolve it for any real client. Falls
// back to the raw URL if it isn't a valid absolute URL to begin with.
function toSameOriginPath(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.pathname + parsed.search;
  } catch {
    return rawUrl;
  }
}

function Frames({ frames, onExpand }) {
  if (!frames || frames.length === 0) return null;
  return (
    <div className="aksha-frame-grid">
      {frames.map((frame, index) => (
        <figure className="aksha-frame" key={`${frame.url}-${index}`}>
          <button
            type="button"
            className="aksha-frame-expand"
            onClick={() => onExpand(frame)}
            aria-label={`Expand alert frame from ${frame.camera}`}
          >
            <img
              src={toSameOriginPath(frame.url)}
              alt={frame.alert_name ? `${frame.alert_name} — alert frame from ${frame.camera}` : `Alert frame from ${frame.camera}`}
              loading="lazy"
            />
          </button>
          <figcaption>
            {frame.alert_name ? <span className="aksha-frame-alert-name">{frame.alert_name}</span> : null}
            {frame.camera}{frame.time ? ` · ${frame.time}` : ""}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

// Full-size view of one alert frame, opened by clicking its thumbnail in
// Frames above. Lives at the panel root (not per-message) so it overlays
// the whole widget, including the composer, and closes on backdrop click,
// the close button, or Escape.
function FrameLightbox({ frame, onClose }) {
  useEffect(() => {
    if (!frame) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [frame, onClose]);

  if (!frame) return null;
  return (
    <div className="aksha-frame-lightbox" role="dialog" aria-modal="true" aria-label="Expanded alert frame" onClick={onClose}>
      <button type="button" className="aksha-frame-lightbox-close" aria-label="Close" onClick={onClose}><X size={20} /></button>
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={toSameOriginPath(frame.url)} alt={frame.alert_name ? `${frame.alert_name} — alert frame from ${frame.camera}` : `Alert frame from ${frame.camera}`} />
        <figcaption>
          {frame.alert_name ? <span className="aksha-frame-alert-name">{frame.alert_name}</span> : null}
          {frame.camera}{frame.time ? ` · ${frame.time}` : ""}
        </figcaption>
      </figure>
    </div>
  );
}

// Gridlines/axes, per the dataviz skill's mark specs: hairline, solid, one
// step off the surface color — never the default chart.js near-black.
const GRID_COLOR = "#e6e8ec";
const AXIS_TEXT_COLOR = "#526078";
const AXIS_FONT = { family: "Inter, sans-serif", size: 11 };

// Camera alert-count bar chart — one bar per camera, each carrying that
// camera's identity color (consistent with the hourly-trend chart below).
// A single series across categories needs no legend (dataviz skill,
// marks-and-anatomy.md): the x-axis labels already name each bar.
function AlertCountChart({ rows }) {
  const cameras = rows.map((r) => r.camera);
  return (
    <Bar
      data={{
        labels: cameras,
        datasets: [
          {
            data: rows.map((r) => r.alert_count || 0),
            backgroundColor: cameras.map((name) => cameraColor(name, cameras)),
            borderRadius: 4,
            borderSkipped: "bottom",
            maxBarThickness: 24,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (ctx) => `${ctx.parsed.y.toLocaleString()} alerts` },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: AXIS_TEXT_COLOR, font: AXIS_FONT } },
          y: {
            beginAtZero: true,
            grid: { color: GRID_COLOR },
            ticks: { color: AXIS_TEXT_COLOR, font: AXIS_FONT, precision: 0 },
          },
        },
      }}
    />
  );
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

// Hourly alert-volume trend — one line per camera, sharing AlertCountChart's
// camera-color mapping so the same camera reads as the same color across
// both charts (dataviz skill: "color follows the entity, never its rank").
// Only rendered for rows that actually carry hourly_counts (older cached
// turns, or a tool failure, simply won't have it — never fabricated here).
function HourlyTrendChart({ rows }) {
  const withHours = rows.filter((r) => Array.isArray(r.hourly_counts));
  if (withHours.length === 0) return null;
  const cameras = withHours.map((r) => r.camera);
  return (
    <Line
      data={{
        labels: HOUR_LABELS,
        datasets: withHours.map((row) => {
          const color = cameraColor(row.camera, cameras);
          return {
            label: row.camera,
            data: row.hourly_counts,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: color,
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 2,
            tension: 0.15,
          };
        }),
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: withHours.length > 1
            ? { display: true, position: "bottom", labels: { color: AXIS_TEXT_COLOR, font: AXIS_FONT, boxWidth: 10, boxHeight: 10 } }
            : { display: false },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: AXIS_TEXT_COLOR, font: AXIS_FONT, maxTicksLimit: 12 } },
          y: {
            beginAtZero: true,
            grid: { color: GRID_COLOR },
            ticks: { color: AXIS_TEXT_COLOR, font: AXIS_FONT, precision: 0 },
          },
        },
      }}
    />
  );
}

// Table + charts for Insights & Analytics — built entirely from
// extract_analytics' deterministic rows (never asked of the LLM as text).
// Both charts are a visual restatement of the table's own columns, not new
// information; rows arrive pre-sorted highest-first from the backend
// (tools_insights.py), so the table and the bar chart's category order both
// follow it — order always matches what the prose says led.
function AnalyticsPanel({ rows }) {
  if (!rows || rows.length === 0) return null;
  const hasPriority = rows.some((r) => r.priority);
  const hasTopObject = rows.some((r) => r.top_object);
  const hasHourly = rows.some((r) => Array.isArray(r.hourly_counts));

  return (
    <details className="aksha-analytics" open>
      <summary>Show data</summary>

      <div className="aksha-analytics-chart" role="img" aria-label="Alert count by camera">
        <AlertCountChart rows={rows} />
      </div>

      {hasHourly && (
        <div className="aksha-analytics-chart" role="img" aria-label="Alert count by hour of day">
          <HourlyTrendChart rows={rows} />
        </div>
      )}

      <div className="aksha-table-wrap">
        <table className="aksha-analytics-table">
          <thead>
            <tr>
              <th>Camera</th>
              {hasPriority && <th>Priority</th>}
              <th className="aksha-num">Alerts</th>
              <th>Peak</th>
              {hasTopObject && <th>Top object</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.camera}>
                <td>{row.camera}</td>
                {hasPriority && <td>{row.priority || "—"}</td>}
                <td className="aksha-num">{(row.alert_count || 0).toLocaleString()}</td>
                <td>{row.peak_hour || "—"}</td>
                {hasTopObject && <td>{row.top_object || "—"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

// If a camera goes offline mid-watch, the socket channel just stops
// emitting — nothing tells the UI that happened. Without this, the <img>
// silently freezes on the last frame and keeps showing "● LIVE" forever,
// which reads as "still live" when it isn't. Track how long it's been since
// the last frame and flip to an honest "feed unavailable" state instead of
// leaving a stale image looking current.
const LIVE_FEED_STALE_MS = 8000;

// Reuses the same Socket.IO connection the Monitor page's camera tiles use
// (src/router/socket.js) — the live feed is per-camera binary JPEG frames
// pushed over a channel named after the exact Camera_Name, converted to a
// data URL client-side. There is no separate stream URL to fetch; this is
// the only way to render it, in or out of the chat. See Camera.jsx for the
// pattern this mirrors.
function LiveCameraFeed({ camera }) {
  const [frame, setFrame] = useState(null);
  const [stale, setStale] = useState(false);
  const lastFrameAt = useRef(Date.now());

  useEffect(() => {
    lastFrameAt.current = Date.now();
    setStale(false);

    const handleFrame = (data) => {
      if (!data?.image) return;
      lastFrameAt.current = Date.now();
      setStale(false);
      const blob = new Blob([data.image], { type: data.type });
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) setFrame(reader.result);
      };
      reader.readAsDataURL(blob);
    };
    socket.on(camera, handleFrame);

    const staleCheck = setInterval(() => {
      if (Date.now() - lastFrameAt.current > LIVE_FEED_STALE_MS) setStale(true);
    }, 2000);

    // Pass the same handler reference to off() — a bare socket.off(camera)
    // would strip every listener on this channel, including the Monitor
    // page's own tile if it's watching the same camera at the same time.
    return () => {
      socket.off(camera, handleFrame);
      clearInterval(staleCheck);
    };
  }, [camera]);

  return (
    <div className="aksha-live-frame">
      {frame
        ? <img src={frame} alt={`Live feed from ${camera}`} className={stale ? "is-stale" : undefined} />
        : <div className="aksha-live-frame-waiting">{stale ? "Feed unavailable" : "Connecting…"}</div>}
      {stale
        ? <span className="aksha-live-badge aksha-live-badge-stale" aria-hidden="true">FEED UNAVAILABLE</span>
        : <span className="aksha-live-badge" aria-hidden="true">● LIVE</span>}
    </div>
  );
}

// At most this many cameras streaming at once, across the whole panel —
// each "Watch live" is a real running socket subscription and continuous
// image decode, and nothing was stopping an operator from opening several
// across a long conversation with no sense of the cumulative cost.
const MAX_CONCURRENT_LIVE_FEEDS = 2;

// The camera's own source pill IS the live-watch control for Live Monitoring
// answers — found live: a separate "Watch live" chip below the (identical-
// looking, non-interactive) source pills was easy to miss entirely, and
// operators reasonably tried clicking the camera name itself first. Opt-in
// per camera, per message still holds — mirrors this agent's existing
// Re-poll convention (manual action, not automatic streaming) rather than
// opening a live video connection for every camera in every past answer the
// moment the panel renders. Watching state lives in the parent (not locally)
// so the concurrent-feed cap applies across every message, not per-card.
function LiveCameraPill({ camera, watching, disabled, onToggle }) {
  return (
    <div className="aksha-live-camera">
      <button
        type="button"
        className="aksha-pill aksha-pill-source aksha-pill-live"
        onClick={onToggle}
        aria-pressed={watching}
        disabled={disabled}
        title={
          watching
            ? `Stop watching ${camera}`
            : disabled
              ? `Stop another live feed first (max ${MAX_CONCURRENT_LIVE_FEEDS} at once)`
              : `Watch ${camera} live`
        }
      >
        {watching ? <Square size={10} /> : <Play size={10} />} {camera}
      </button>
      {watching && <LiveCameraFeed camera={camera} />}
    </div>
  );
}

function SourcePills({ sources }) {
  // An empty sources array renders no row at all — an empty rail reads as a
  // load failure rather than "this answer legitimately has no sources".
  if (!sources || sources.length === 0) return null;
  return (
    <div className="aksha-source-row">
      {sources.map((source, index) => (
        <span className="aksha-pill aksha-pill-source" key={`${source.source_id}-${index}`}>{source.label}</span>
      ))}
    </div>
  );
}

function AgentHeader({ agent, freshness, writing, asOf }) {
  const Icon = agent?.icon || Bot;
  return (
    <div className="aksha-agent-header">
      <span className={`aksha-agent-tile aksha-agent-tile-${agent?.tone || "accent"}`} aria-hidden="true">
        <Icon size={14} />
      </span>
      <span className="aksha-agent-name">{agent?.label || "Aksha Assistant"}</span>
      {writing
        ? <span className="aksha-pill aksha-pill-writing">Writing…</span>
        : <FreshnessPill freshness={freshness} agentKey={agent?.key} asOf={asOf} />}
    </div>
  );
}

function relativeTime(ts) {
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

// Recent-chats dropdown — reads/writes through chatHistory.js, storage
// scoped to this browser only (see that file's docstring for why).
function RecentChats({ sessions, activeThreadId, onSelect, onNewChat, onDelete }) {
  return (
    <div className="aksha-recent-chats">
      <div className="aksha-recent-chats-head">
        <span>Recent chats{sessions.length > 0 ? ` · ${sessions.length}` : ""}</span>
        <button type="button" onClick={onNewChat}><Plus size={12} /> New chat</button>
      </div>
      {sessions.length === 0 ? (
        <p className="aksha-recent-chats-empty">Conversations you've had will show up here — stored on this device only.</p>
      ) : (
        <ul>
          {sessions.map((s) => (
            <li key={s.threadId}>
              <button
                type="button"
                className={`aksha-recent-chat-item${s.threadId === activeThreadId ? " active" : ""}`}
                onClick={() => onSelect(s)}
              >
                <span className="aksha-recent-chat-icon"><MessageSquare size={13} /></span>
                <span className="aksha-recent-chat-text">
                  <span className="aksha-recent-chat-title">{s.title}</span>
                  <span className="aksha-recent-chat-time">{relativeTime(s.updatedAt)}</span>
                </span>
              </button>
              <button
                type="button"
                className="aksha-recent-chat-delete"
                aria-label="Delete chat"
                onClick={() => onDelete(s.threadId)}
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState([]);
  const [liveAnswer, setLiveAnswer] = useState("");
  const [streamAgent, setStreamAgent] = useState(null);
  // Reasoning steps are opt-in, not shown by default while a turn streams —
  // matches the completed-answer card's own <details> (closed until the
  // operator clicks "Reasoning and data checks").
  const [showWorking, setShowWorking] = useState(false);
  const [threadId, setThreadId] = useState(makeThreadId);
  const messagesRef = useRef(null);
  // Shared across every message's camera pills, not per-card — that's what
  // makes the concurrent-feed cap actually a cap instead of a per-message
  // allowance that resets for each new answer.
  const [watchingCameras, setWatchingCameras] = useState(() => new Set());
  const [sessions, setSessions] = useState(() => listSessions());
  const [recentOpen, setRecentOpen] = useState(false);
  const [expandedFrame, setExpandedFrame] = useState(null);

  // Pin to the floor on every new message, streamed token, and reasoning
  // step — a token arriving below the fold is useless if the operator has
  // to scroll down to see it land.
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, liveAnswer, working, loading]);

  // Persist every conversation to this device's recent-chats list — there's
  // no backend session store (no auth, and app/conversation_store.py's own
  // memory is in-memory-only and gone on a backend restart), so this is the
  // only place a conversation survives closing the panel or reloading the
  // page. Unlike aksha-chatbot-ui's version of this effect, `messages` here
  // only changes once per completed turn (streaming state lives in
  // `liveAnswer`/`working`, not in `messages`), so there's no per-token
  // write storm to debounce and no in-flight placeholder to filter out.
  // `agent` is stored as its string key, never the resolved object — that
  // object carries a lucide-react icon COMPONENT, which JSON.stringify
  // would silently drop; resolveAgent(key, null) rebuilds it on load.
  useEffect(() => {
    if (messages.length === 0) return;
    const persistable = messages.map((m) => (m.agent ? { ...m, agent: m.agent.key } : m));
    const firstUserMsg = messages.find((m) => m.role === "user");
    const title = firstUserMsg
      ? firstUserMsg.text.slice(0, 60) + (firstUserMsg.text.length > 60 ? "…" : "")
      : "New conversation";
    saveSession(threadId, title, persistable, Date.now());
    setSessions(listSessions());
  }, [messages, threadId]);

  const startNewChat = () => {
    setMessages([]);
    setThreadId(makeThreadId());
    setWatchingCameras(new Set());
    setRecentOpen(false);
  };

  const selectSession = (session) => {
    const rehydrated = session.messages.map((m) => (
      typeof m.agent === "string" ? { ...m, agent: resolveAgent(m.agent, null) } : m
    ));
    setMessages(rehydrated);
    setThreadId(session.threadId);
    setWatchingCameras(new Set());
    setRecentOpen(false);
  };

  const removeSession = (id) => {
    deleteSession(id);
    setSessions(listSessions());
    if (id === threadId) startNewChat();
  };

  const toggleWatching = (camera) => {
    setWatchingCameras((prev) => {
      const next = new Set(prev);
      if (next.has(camera)) {
        next.delete(camera);
      } else if (next.size < MAX_CONCURRENT_LIVE_FEEDS) {
        next.add(camera);
      }
      // At cap and this camera isn't already one of the watched ones: the
      // pill renders disabled for exactly this case, so a click shouldn't
      // normally reach here — no-op rather than silently stopping another
      // camera's feed the operator didn't ask to stop.
      return next;
    });
  };

  const sendMessage = async (text) => {
    const value = (text || query).trim();
    if (!value || loading) return;
    setQuery("");
    setMessages((items) => [...items, { role: "user", text: value }]);
    setLoading(true);
    setWorking([]);
    setLiveAnswer("");
    setStreamAgent(null);
    let answer = "";
    const reasoning = [];
    let recommendations = [];
    let doneEvent = null;
    let clarification = null;
    try {
      const response = await fetch(`${API_BASE}/v1/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: threadId,
          user_query: value,
          language: "en",
        }),
      });
      if (!response.ok || !response.body) throw new Error(`Chatbot API returned ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        buffer += decoder.decode(chunk, { stream: true });
        let boundary;
        while ((boundary = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const eventName = frame.split("\n").find((line) => line.startsWith("event: "))?.slice(7).trim();
          const dataLine = frame.split("\n").find((line) => line.startsWith("data: "));
          if (!dataLine) continue;
          const event = JSON.parse(dataLine.slice(6));
          if (eventName === "routed") {
            // Tile + name render from this the instant routing completes —
            // well before the first answer token arrives.
            setStreamAgent(resolveAgent(null, event.agent));
          } else if (eventName === "thinking") {
            const detail = event.tool
              ? `${event.phase === "tool_result" ? "Checked" : "Using"} ${event.tool}`
              : event.phase === "formatting" ? "Preparing a grounded answer" : event.phase;
            if (detail && !reasoning.includes(detail)) {
              reasoning.push(detail);
              setWorking([...reasoning]);
            }
          } else if (eventName === "token") {
            answer += event.text || "";
            setLiveAnswer(answer);
          } else if (eventName === "clarification") {
            clarification = { question: event.question, options: event.options || [] };
          } else if (eventName === "done") {
            recommendations = event.follow_ups || [];
            doneEvent = event;
          }
        }
      }

      if (doneEvent?.status === "needs_clarification" && clarification) {
        setMessages((items) => [...items, { role: "clarification", ...clarification }]);
      } else if (!answer) {
        // The backend's own formatter always fills `text` for every real
        // status (resolved, stub, degraded) — an empty answer after a clean
        // `done` means the stream itself lost data, not that there's nothing
        // to say. State that plainly instead of inventing a conversational
        // non-answer; the turn_id is the actual, checkable fact here.
        setMessages((items) => [...items, {
          role: "assistant",
          text: `No answer text was received for this turn${doneEvent?.turn_id ? ` (ref ${doneEvent.turn_id.slice(0, 8)})` : ""}.`,
          agent: resolveAgent(doneEvent?.agent, null) || streamAgent,
          freshness: { kind: "degraded", label: "Degraded" },
          sources: doneEvent?.sources,
          status: "failed",
        }]);
      } else {
        setMessages((items) => [...items, {
          role: "assistant",
          text: answer,
          reasoning,
          recommendations,
          agent: resolveAgent(doneEvent?.agent, null) || streamAgent,
          freshness: doneEvent?.freshness,
          sources: doneEvent?.sources,
          frames: doneEvent?.frames,
          analytics: doneEvent?.analytics,
          status: doneEvent?.status,
          question: value,
          asOf: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);
      }
    } catch (error) {
      // Same principle: say what actually broke (the real fetch/HTTP error),
      // not a generic "temporarily unavailable" that could mean anything
      // from a network outage to a real bug — and use the same degraded
      // styling as a backend-reported failure rather than a special case.
      setMessages((items) => [...items, {
        role: "assistant",
        text: `Request failed: ${error.message}`,
        freshness: { kind: "degraded", label: "Degraded" },
        status: "failed",
      }]);
    } finally {
      setLoading(false);
      setStreamAgent(null);
    }
  };

  return (
    <div className="aksha-chatbot-widget">
      {open && (
        <section className="aksha-chatbot-panel" aria-label="Aksha support chatbot">
          <header className="aksha-chatbot-panel-header">
            <div className="aksha-chatbot-title"><Bot size={20} /><div><strong>Aksha Assistant</strong><span>Live camera and alert data</span></div></div>
            <div className="aksha-chatbot-header-actions">
              <button
                type="button"
                onClick={() => setRecentOpen((value) => !value)}
                aria-label="Recent chats"
                title="Recent chats"
                aria-expanded={recentOpen}
              >
                <History size={17} />
              </button>
              <button type="button" onClick={startNewChat} aria-label="New chat" title="New chat"><Plus size={17} /></button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close chatbot" title="Close"><X size={18} /></button>
            </div>
          </header>
          {recentOpen && (
            <RecentChats
              sessions={sessions}
              activeThreadId={threadId}
              onSelect={selectSession}
              onNewChat={startNewChat}
              onDelete={removeSession}
            />
          )}
          <div className="aksha-chatbot-toolbar"><span><Clock3 size={13} /> Current Aksha data</span>{messages.length > 0 && <button type="button" onClick={startNewChat}><Trash2 size={13} /> Clear</button>}</div>
          <div className="aksha-chatbot-messages" ref={messagesRef}>
            {messages.length === 0 && <p className="aksha-chatbot-welcome">Ask about your cameras, alerts, live status, or insight reports.</p>}
            {messages.map((message, index) => {
              if (message.role === "user") {
                return <div key={`user-${index}`} className="aksha-chatbot-message user">{message.text}</div>;
              }

              if (message.role === "clarification") {
                return (
                  <div key={`clarify-${index}`} className="aksha-chatbot-message assistant aksha-card-clarify">
                    <div className="aksha-clarify-question">{message.question}</div>
                    <div className="aksha-clarify-options">
                      {message.options.map((option) => (
                        <button type="button" key={option} onClick={() => sendMessage(option)}>{option}</button>
                      ))}
                    </div>
                  </div>
                );
              }

              const degraded = message.freshness?.kind === "degraded";
              const stub = message.freshness?.kind === "stub";
              return (
                <div
                  key={`assistant-${index}`}
                  className={`aksha-chatbot-message assistant aksha-card-answer${degraded ? " aksha-card-degraded" : ""}${stub ? " aksha-card-stub" : ""}`}
                >
                  <div className="aksha-agent-header-row">
                    <AgentHeader agent={message.agent} freshness={message.freshness} asOf={message.asOf} />
                    {message.agent?.key === "live_monitoring" && message.question && (
                      <button
                        type="button"
                        className="aksha-repoll"
                        onClick={() => sendMessage(message.question)}
                        title="Re-poll"
                        aria-label="Re-poll live status"
                      >
                        <RefreshCcw size={12} /> Re-poll
                      </button>
                    )}
                  </div>
                  {message.reasoning?.length > 0 && (
                    <details className="aksha-chatbot-reasoning">
                      <summary>Reasoning and data checks</summary>
                      <ul>{message.reasoning.map((step) => <li key={step}>{step}</li>)}</ul>
                    </details>
                  )}
                  <div className="aksha-answer-body">{stripMarkdown(message.text)}</div>
                  <Frames frames={message.frames} onExpand={setExpandedFrame} />
                  <AnalyticsPanel rows={message.analytics} />
                  {message.agent?.key === "live_monitoring" && message.status === "resolved" && message.sources?.length > 0 ? (
                    <div className="aksha-live-camera-list">
                      {message.sources
                        .filter((source) => source.source_type === "camera")
                        .map((source) => (
                          <LiveCameraPill
                            camera={source.label}
                            key={source.source_id}
                            watching={watchingCameras.has(source.label)}
                            disabled={!watchingCameras.has(source.label) && watchingCameras.size >= MAX_CONCURRENT_LIVE_FEEDS}
                            onToggle={() => toggleWatching(source.label)}
                          />
                        ))}
                    </div>
                  ) : (
                    <SourcePills sources={message.sources} />
                  )}
                  {message.agent?.key === "notification" && message.status === "resolved" && (
                    <div className="aksha-caveat-card">{NOTIFICATION_CAVEAT}</div>
                  )}
                  {message.recommendations?.length > 0 && (
                    <div className="aksha-chatbot-recommendations">
                      <span>Recommended next questions</span>
                      {message.recommendations.map((recommendation) => (
                        <button type="button" key={recommendation} onClick={() => sendMessage(recommendation)}>{recommendation}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {loading && (
              <div className="aksha-chatbot-message assistant aksha-card-answer aksha-card-streaming">
                <AgentHeader agent={streamAgent} writing />
                <div className="aksha-writing-bar" aria-hidden="true"><span /></div>
                <div className="aksha-chatbot-working">
                  <button type="button" onClick={() => setShowWorking((value) => !value)}>
                    <CircleCheck size={14} /> {showWorking ? "Hide reasoning" : "Show reasoning"} {showWorking ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {showWorking && <ul>{working.map((step) => <li key={step}>{step}</li>)}</ul>}
                </div>
                {liveAnswer && <div className="aksha-answer-body aksha-chatbot-live-answer">{stripMarkdown(liveAnswer)}</div>}
              </div>
            )}
          </div>
          {messages.length === 0 && <div className="aksha-chatbot-suggestions">{SUGGESTIONS.map((suggestion) => <button type="button" key={suggestion} onClick={() => sendMessage(suggestion)}>{suggestion}</button>)}</div>}
          <form className="aksha-chatbot-composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask Aksha..." aria-label="Ask Aksha" disabled={loading} />
            <button type="submit" disabled={loading || !query.trim()} aria-label="Send question"><Send size={17} /></button>
          </form>
        </section>
      )}
      <button type="button" className="aksha-chatbot-launcher" onClick={() => setOpen((value) => !value)} aria-label="Open Aksha Assistant">
        {open ? <X size={22} /> : <Bot size={22} />}<span>{open ? "Close" : "Ask Aksha"}</span>
      </button>
      <FrameLightbox frame={expandedFrame} onClose={() => setExpandedFrame(null)} />
    </div>
  );
};

export default ChatbotWidget;
