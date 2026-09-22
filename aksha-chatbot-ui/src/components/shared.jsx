import { useState } from 'react';
import { Box, Stack, Typography, Button as MuiButton } from '@mui/material';
import { Video, Bell, Clock, BarChart3, Mail, Book, AlertCircle, Compass, Wrench, History, Check, X, PenLine, ChevronDown, ChevronRight } from 'lucide-react';
import { color, font, radius } from '../tokens';

// Per-agent glyph + tile tone — AGENTS.md: "accent-100 tile = reads a live
// endpoint, therefore carries a freshness pill; neutral-200 tile =
// documentation-backed, no freshness pill."
const AGENT_ICONS = {
  camera_operations: Video,
  alert_investigation: Bell,
  live_monitoring: Clock,
  insights_analytics: BarChart3,
  notification: Mail,
  help_guide: Book,
  error_explanation: AlertCircle,
  camera_troubleshooting: Wrench,
  timeline: History,
};

export const AGENT_LABELS = {
  camera_operations: 'Camera Operations',
  alert_investigation: 'Alert Investigation',
  live_monitoring: 'Live Monitoring',
  insights_analytics: 'Insights & Analytics',
  notification: 'Notification',
  help_guide: 'Help & Product Guide',
  error_explanation: 'Error & Status Explanation',
  camera_troubleshooting: 'Camera Troubleshooting',
  timeline: 'Timeline & Sequence',
};

// 24px avatar tile, 8px radius, aria-hidden — the agent name text is the
// accessible label, per AGENTS.md.
export function AgentTile({ agentKey, size = 24 }) {
  const Icon = AGENT_ICONS[agentKey] || Book;
  const isDocBacked = agentKey === 'help_guide' || agentKey === 'error_explanation';
  return (
    <Box
      aria-hidden="true"
      sx={{
        width: size, height: size, borderRadius: `${radius.tile}px`, flex: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isDocBacked ? color.neutral200 : color.accent100,
        color: isDocBacked ? color.neutral800 : color.accent,
        mt: '1px',
      }}
    >
      <Icon size={Math.round(size * 0.58)} strokeWidth={2} />
    </Box>
  );
}

// Dashed variant for the "stub" / unrouted state (AGENTS.md's sixth
// cross-cutting state) — no fill, dashed border, neutral ring.
export function StubTile({ size = 24 }) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        width: size, height: size, borderRadius: `${radius.tile}px`, flex: 'none',
        border: `1px dashed ${color.neutral500}`, color: color.neutral700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', mt: '1px',
      }}
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v8" /><path d="M8 12h8" />
      </svg>
    </Box>
  );
}

// Small caps meta label — "OPERATOR · 10:04", "SOURCES", etc.
export function MetaLabel({ children, weight = 600, color: c = color.neutral600, size = 9.5, sx = {} }) {
  return (
    <Typography
      sx={{
        font: `${weight} ${size}px/1 ${font.heading}`,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: c,
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}

// Small pill-shaped micro-buttons (SEND, RETRY, DOWNLOAD...). Radius follows
// the v3.0 "hover row" geometry (8px) rather than the full pill radius, so
// action buttons read as buttons, not tags.
export function ActionButton({ variant = 'ghost', children, ...props }) {
  const styles = {
    primary: { background: color.accent, color: '#fff', border: `1px solid ${color.accent}` },
    secondary: { background: 'transparent', color: color.ink, border: `1px solid ${color.neutral400}` },
    ghost: { background: 'transparent', color: color.accent700, border: '1px solid transparent' },
  }[variant];
  return (
    <MuiButton
      disableElevation
      sx={{
        ...styles,
        borderRadius: `${radius.hover}px`,
        padding: '5px 10px',
        font: `500 10.5px/1 ${font.body}`,
        minWidth: 0,
        '&:hover': { opacity: 0.85, ...styles },
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
}

// Agent name + tile pairing used in a message header. `name` is the
// accessible label (the tile itself is aria-hidden).
export function AgentBadge({ name, tone = 'accent' }) {
  const style = tone === 'accent'
    ? { background: color.accent100, color: color.accent700 }
    : { background: color.neutral200, color: color.neutral800 };
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '3px 7px', borderRadius: `${radius.pill}px`,
        font: `500 9.5px/1 ${font.body}`,
        ...style,
      }}
    >
      {name}
    </Box>
  );
}

// Freshness pill — three-valued per AGENTS.md: live (filled tinted pill,
// filled dot), degraded (outlined, hollow dot — neutral only, never red),
// stub (dashed border, dashed pill). `snapshot` is Live Monitoring's special
// case: same outlined treatment as degraded, but a clock glyph instead of a
// dot, because it's a REST poll and must never imply a live feed.
export function Freshness({ kind, label }) {
  if (kind === 'stub') {
    return (
      <Box component="span" sx={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        border: `1px dashed ${color.neutral600}`, borderRadius: `${radius.pill}px`,
        padding: '3px 7px', font: `500 9.5px/1 ${font.body}`, color: color.neutral800,
      }}>
        {label}
      </Box>
    );
  }
  if (kind === 'snapshot') {
    return (
      <Box component="span" sx={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        border: `1px solid ${color.neutral400}`, borderRadius: `${radius.pill}px`,
        padding: '3px 7px', font: `500 9.5px/1 ${font.body}`, color: color.neutral800,
      }}>
        <Clock size={9} strokeWidth={2.4} style={{ flex: 'none' }} />
        {label}
      </Box>
    );
  }
  if (kind === 'degraded' || kind === 'cached') {
    return (
      <Box component="span" sx={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        border: `1px solid ${color.neutral400}`, borderRadius: `${radius.pill}px`,
        padding: '3px 7px', font: `500 9.5px/1 ${font.body}`, color: color.neutral800,
      }}>
        <Box component="span" sx={{ width: 5, height: 5, borderRadius: '50%', border: `1.5px solid ${color.neutral700}`, flex: 'none' }} />
        {label}
      </Box>
    );
  }
  // live (default)
  return (
    <Box component="span" sx={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: color.accent100, borderRadius: `${radius.pill}px`,
      padding: '3px 7px', font: `500 9.5px/1 ${font.body}`, color: color.accent700,
    }}>
      <Box component="span" sx={{ width: 5, height: 5, borderRadius: '50%', background: color.accent, flex: 'none' }} />
      {label}
    </Box>
  );
}

// The "CAM 07 · NORTH GATE" pill used in a source row, and — with
// dashed={true} — the assumed-window pill ("Default window · 7 days") and
// language pill (HI/MR).
export function RefChip({ children, dashed = false, muted = false, component = 'span', ...props }) {
  return (
    <Box
      component={component}
      sx={{
        border: `1px ${dashed ? 'dashed' : 'solid'} ${dashed ? color.neutral600 : color.neutral300}`,
        borderRadius: `${radius.pill}px`,
        padding: '4px 9px',
        font: `500 10px/1 ${font.body}`,
        color: muted ? color.neutral800 : color.ink,
        textDecoration: 'none',
        cursor: props.href || props.onClick ? 'pointer' : 'default',
        '&:hover': (props.href || props.onClick) ? { background: color.accent200 } : {},
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

// Help & Guide's flat "Documentation" pill — no border, no dot, explicitly
// not a freshness indicator (the agent has none).
export function DocPill() {
  return (
    <Box component="span" sx={{
      background: color.neutral200, borderRadius: `${radius.pill}px`,
      padding: '3px 7px', font: `500 9.5px/1 ${font.body}`, color: color.neutral800,
    }}>
      Documentation
    </Box>
  );
}

// Translated-message language pill (HI/MR) shown beside the agent name —
// AGENTS.md: "Multi-Language is not an agent... shown as a small language
// pill, never its own tile or badge."
export function LanguagePill({ children }) {
  return (
    <Box component="span" sx={{
      border: `1px solid ${color.neutral400}`, borderRadius: `${radius.pill}px`,
      padding: '3px 7px', font: `600 9px/1 ${font.body}`, letterSpacing: '0.06em', color: color.neutral800,
    }}>
      {children}
    </Box>
  );
}

// Live Monitoring's "Re-poll" action — a filled tinted pill button, distinct
// from a plain source pill (AGENTS.md: re-poll, not auto-refresh).
export function RepollButton({ onClick }) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        all: 'unset', cursor: 'pointer',
        borderRadius: `${radius.pill}px`, padding: '4px 9px',
        font: `500 10px/1 ${font.body}`, color: color.accent700, background: color.accent100,
      }}
    >
      Re-poll
    </Box>
  );
}

// Notification agent's standing caveat — chrome, not model output. Always
// shown on a Notification answer, per AGENTS.md.
export function NotificationCaveat() {
  return (
    <Box sx={{
      background: color.neutral100, border: `1px solid ${color.neutral300}`,
      borderRadius: `${radius.cardSm - 1}px`, padding: '9px 10px', mb: 1.25,
      font: `500 11px/1.5 ${font.body}`, color: color.neutral800,
    }}>
      Configured recipients — not confirmed delivery. Delivery logs don't exist yet, so this never claims a message was received.
    </Box>
  );
}

// Body text block shared by every agent-answer variant.
export function RuledBody({ children, sx = {} }) {
  return (
    <Box sx={{ font: `400 12.5px/1.55 ${font.body}`, ...sx }}>
      {children}
    </Box>
  );
}

// One row in the message ledger — shared padding/border rhythm.
export function Turn({ children, sx = {} }) {
  return (
    <Box sx={{ padding: '16px', borderBottom: `1px solid ${color.neutral200}`, ...sx }}>
      {children}
    </Box>
  );
}

// Image/frame placeholder — real frames aren't wired up yet, so this stands
// in for <image-slot> from the mockups: 16:9, 9px radius, grayscale-toned,
// captioned.
export function FramePlaceholder({ label, caption, timeLabel, width = 190, height = 100 }) {
  return (
    <Box component="figure" sx={{ m: 0, border: `1px solid ${color.neutral300}`, borderRadius: '9px', overflow: 'hidden', width }}>
      <Box
        sx={{
          height,
          background: `repeating-linear-gradient(135deg, ${color.neutral200} 0 8px, ${color.neutral100} 8px 16px)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color.neutral600,
          font: `500 9px/1.3 ${font.body}`,
          textAlign: 'center',
          px: 1,
        }}
      >
        {label}
      </Box>
      <Box
        component="figcaption"
        sx={{
          padding: '5px 7px',
          display: 'flex',
          justifyContent: 'space-between',
          background: color.neutral100,
          font: `500 9.5px/1.2 ${font.body}`,
        }}
      >
        <span style={{ fontWeight: 600 }}>{caption}</span>
        <span style={{ color: color.neutral700, fontWeight: 400 }}>{timeLabel}</span>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Live "thinking" trace — routing decision, each tool call and its result,
// and the formatting step, streamed live over SSE (main.py's "thinking"
// event) as the agent works, not just the final answer. `live` keeps it
// expanded and growing while streaming; once the turn is done it collapses
// into a "Show reasoning" disclosure so it doesn't clutter finished answers.
// ---------------------------------------------------------------------------
function stepIcon(step) {
  if (step.phase === 'routing') return Compass;
  if (step.phase === 'tool_call') return Wrench;
  if (step.phase === 'tool_result') return step.ok ? Check : X;
  if (step.phase === 'formatting') return PenLine;
  return Wrench;
}

function stepText(step) {
  switch (step.phase) {
    case 'routing':
      return `Classified as "${step.intent}" (${Math.round((step.confidence ?? 0) * 100)}% confidence, ${step.risk_level} risk)`;
    case 'tool_call': {
      const argsText = step.args && Object.keys(step.args).length ? ` with ${JSON.stringify(step.args)}` : '';
      return `Calling ${step.tool}${argsText}`;
    }
    case 'tool_result':
      return step.ok ? `${step.tool} succeeded` : `${step.tool} failed (${step.error_code || 'unknown error'})`;
    case 'formatting':
      return 'Writing the answer…';
    default:
      return '';
  }
}

export function ThinkingTrace({ steps, live = false }) {
  const [open, setOpen] = useState(live);
  if (!steps || steps.length === 0) return null;

  const list = (
    <Stack gap="5px" sx={{ mt: 0.75 }}>
      {steps.map((step, i) => {
        const Icon = stepIcon(step);
        const failed = step.phase === 'tool_result' && !step.ok;
        const tone = failed ? color.neutral800 : color.neutral600;
        return (
          <Stack key={i} direction="row" gap="6px" sx={{ alignItems: 'center' }}>
            <Icon size={11} strokeWidth={2.2} style={{ flex: 'none', color: tone }} />
            <Typography sx={{ font: `500 10.5px/1.3 ${font.mono}`, color: tone }}>{stepText(step)}</Typography>
          </Stack>
        );
      })}
    </Stack>
  );

  if (live) {
    return (
      <Box sx={{ mb: 1 }}>
        <MetaLabel size={9.5} sx={{ letterSpacing: '0.08em' }}>Thinking</MetaLabel>
        {list}
      </Box>
    );
  }

  return (
    <Box sx={{ mb: open ? 1 : 0 }}>
      <Box
        component="button"
        onClick={() => setOpen((v) => !v)}
        sx={{
          all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px',
          font: `500 10px/1 ${font.body}`, color: color.neutral600,
        }}
      >
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        {open ? 'Hide reasoning' : `Show reasoning · ${steps.length} step${steps.length === 1 ? '' : 's'}`}
      </Box>
      {open && list}
    </Box>
  );
}
