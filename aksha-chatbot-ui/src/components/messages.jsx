import { Box, Stack, Typography } from '@mui/material';
import { color, font, radius } from '../tokens';
import {
  MetaLabel, ActionButton, AgentTile, StubTile, AGENT_LABELS, Freshness,
  RefChip, RepollButton, NotificationCaveat, DocPill, LanguagePill, RuledBody, Turn, FramePlaceholder,
  ThinkingTrace,
} from './shared';

// ---------------------------------------------------------------------------
// 1. Operator message — right-aligned accent bubble, asymmetric radius
//    (sharp bottom-right notch), per the v3.0 mockups.
// ---------------------------------------------------------------------------
export function OperatorMessage({ time, lang, text }) {
  return (
    <Turn sx={{ borderBottom: 'none', pb: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: lang ? 0.5 : 0 }}>
        {lang && (
          <MetaLabel size={9} sx={{ mr: 1, alignSelf: 'center', letterSpacing: '0.1em' }}>
            {time} · {lang}
          </MetaLabel>
        )}
        <Box
          component="span"
          sx={{
            background: color.accent, color: '#fff', borderRadius: radius.bubble,
            padding: '9px 12px', font: `400 12.5px/1.5 ${font.body}`, maxWidth: '80%',
          }}
        >
          {text}
        </Box>
      </Box>
      {!lang && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
          <MetaLabel size={9} sx={{ letterSpacing: '0.1em' }}>{time}</MetaLabel>
        </Box>
      )}
    </Turn>
  );
}

// ---------------------------------------------------------------------------
// 2. Standard cited agent answer. `agentKey` (the raw snake_case key, e.g.
//    "camera_operations") drives the tile/icon/label/per-agent rules; a
//    plain `agent` string is kept as a fallback for scripted demo data that
//    predates the per-agent tile system.
// ---------------------------------------------------------------------------
export function AgentAnswer({ agentKey, agent, freshness, body, frames, sources, actions, langBadge, steps, onSourceClick, onRepoll, followUps, onPickFollowUp }) {
  const label = agentKey ? AGENT_LABELS[agentKey] : agent;
  const isHelpGuide = agentKey === 'help_guide' || agentKey === 'error_explanation';
  const isLiveMonitoring = agentKey === 'live_monitoring';
  const isNotification = agentKey === 'notification';
  const hasSources = sources && sources.length > 0;

  // Live Monitoring never shows the filled "Live" pill — it's a REST poll,
  // not a streaming feed (AGENTS.md). Help & Guide carries no freshness pill
  // at all (documentation, not a live endpoint).
  let pill = null;
  if (freshness && !isHelpGuide) {
    if (isLiveMonitoring && freshness.kind === 'live') {
      pill = <Freshness kind="snapshot" label={`Snapshot · as of ${freshness.asOf || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} />;
    } else {
      pill = <Freshness kind={freshness.kind} label={freshness.label} />;
    }
  }

  return (
    <Turn>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
        <Stack direction="row" gap="7px" sx={{ alignItems: 'center' }}>
          {agentKey && (isHelpGuide ? null : <AgentTile agentKey={agentKey} />)}
          <Typography sx={{ font: `600 11px/1 ${font.body}` }}>
            {label}
          </Typography>
          {langBadge && <LanguagePill>{langBadge}</LanguagePill>}
          {isHelpGuide && <DocPill />}
        </Stack>
        {pill}
      </Box>
      {isNotification && <NotificationCaveat />}
      <RuledBody sx={{ fontSize: langBadge ? '13px' : '12.5px', lineHeight: langBadge ? 1.75 : 1.55 }}>{body}</RuledBody>
      {steps && steps.length > 0 && (
        <Box sx={{ mt: 1, ml: agentKey ? '31px' : 0 }}>
          <ThinkingTrace steps={steps} />
        </Box>
      )}
      {(frames || hasSources || actions) && (
        <Box sx={{ mt: 1.5, ml: agentKey ? '31px' : 0 }}>
          {frames && (
            <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${frames.length}, minmax(0, 1fr))`, gap: '7px', mb: 1.5, maxWidth: '100%' }}>
              {frames.map((f) => (
                <FramePlaceholder key={f.caption} {...f} width="100%" />
              ))}
            </Box>
          )}
          {hasSources && (
            <Stack direction="row" gap="6px" sx={{ flexWrap: 'wrap', alignItems: 'center', mb: actions ? 1.5 : 0 }}>
              {sources.map((s) => (
                <RefChip key={s} component="button" onClick={() => onSourceClick?.(s)}>{s}</RefChip>
              ))}
              {isLiveMonitoring && <RepollButton onClick={onRepoll} />}
            </Stack>
          )}
          {actions && (
            <Stack direction="row" gap={1}>
              {actions.map((a) => <ActionButton key={a.label} variant={a.variant}>{a.label}</ActionButton>)}
            </Stack>
          )}
        </Box>
      )}
      {followUps && followUps.length > 0 && (
        <Stack direction="row" gap="6px" sx={{ flexWrap: 'wrap', mt: 1.5, ml: agentKey ? '31px' : 0 }}>
          {followUps.map((q) => (
            <Box
              key={q}
              component="button"
              onClick={() => onPickFollowUp?.(q)}
              sx={{
                all: 'unset', cursor: 'pointer', border: `1px solid ${color.neutral300}`, borderRadius: `${radius.pill}px`,
                padding: '5px 10px', font: `500 11px/1.3 ${font.body}`, color: color.accent700,
                '&:hover': { background: color.accent100 },
              }}
            >
              {q}
            </Box>
          ))}
        </Stack>
      )}
    </Turn>
  );
}

// ---------------------------------------------------------------------------
// 3. Streaming answer
// ---------------------------------------------------------------------------
export function StreamingAnswer({ partialText, sourcesResolving, steps, onStop }) {
  return (
    <Turn>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography sx={{ font: `600 11px/1 ${font.body}` }}>Aksha</Typography>
        <Box component="span" sx={{
          background: color.neutral200, borderRadius: `${radius.pill}px`,
          padding: '3px 7px', font: `500 9.5px/1 ${font.body}`, color: color.neutral800,
        }}>
          Writing…
        </Box>
      </Box>
      {steps && steps.length > 0 && <ThinkingTrace steps={steps} live />}
      <Box sx={{ height: 3, borderRadius: `${radius.pill}px`, background: color.neutral200, overflow: 'hidden', mb: 1 }}>
        <Box sx={{
          width: '33%', height: 3, borderRadius: `${radius.pill}px`, background: color.accent,
          animation: 'streambar 1.4s linear infinite',
          '@keyframes streambar': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(300%)' } },
        }} />
      </Box>
      <RuledBody>
        {partialText}
        <Box component="span" sx={{
          display: 'inline-block', width: 7, height: 14, background: color.ink, verticalAlign: '-3px', ml: '3px',
          animation: 'cursorblink 1s step-end infinite',
          '@keyframes cursorblink': { '0%,49%': { opacity: 1 }, '50%,100%': { opacity: 0 } },
        }} />
      </RuledBody>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.25 }}>
        <Typography sx={{ font: `500 10px/1 ${font.body}`, color: color.neutral600 }}>
          {sourcesResolving}
        </Typography>
        <ActionButton onClick={onStop} disabled={!onStop}>Stop</ActionButton>
      </Box>
    </Turn>
  );
}

// ---------------------------------------------------------------------------
// 4. Clarification — "needs your answer"
// ---------------------------------------------------------------------------
export function ClarificationMessage({ question, options, onSelect }) {
  return (
    <Turn>
      <Box sx={{ background: color.accent100, borderRadius: `${radius.cardSm}px`, padding: '11px' }}>
        <Typography sx={{ font: `400 12.5px/1.55 ${font.body}`, mb: 1.25 }}>{question}</Typography>
        <Stack gap="5px">
          {options.map((opt) => (
            <Box
              key={opt.label}
              component="button"
              onClick={() => onSelect?.(opt)}
              sx={{
                all: 'unset', cursor: 'pointer', background: '#fff', borderRadius: `${radius.hover}px`,
                padding: '10px 11px', font: `600 12px/1.3 ${font.body}`, display: 'flex', justifyContent: 'space-between',
                '&:hover': { background: color.accent200 },
              }}
            >
              {opt.label}
              {opt.meta && <span style={{ fontWeight: 400, color: color.neutral700 }}>{opt.meta}</span>}
            </Box>
          ))}
        </Stack>
      </Box>
    </Turn>
  );
}

// ---------------------------------------------------------------------------
// 5. Cached / last-known answer
// ---------------------------------------------------------------------------
export function CachedAnswer({ body, ref, onRetry }) {
  return (
    <Turn>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ font: `600 11px/1 ${font.body}` }}>Aksha</Typography>
        <Freshness kind="cached" label={`Cached · last known ${ref.time}`} />
      </Box>
      <RuledBody>{body}</RuledBody>
      <Stack direction="row" gap="6px" sx={{ alignItems: "center",  mt: 1.25 }}>
        <RefChip dashed muted>{ref.label}</RefChip>
        <ActionButton onClick={onRetry}>Retry live</ActionButton>
      </Stack>
    </Turn>
  );
}

// ---------------------------------------------------------------------------
// 6. Degraded / partial answer — neutral only, no red, no alarm glyph
//    (this is an expected, correctly-handled outcome, not an error state).
// ---------------------------------------------------------------------------
export function DegradedAnswer({ body, correlationId, onRetry, steps }) {
  return (
    <Turn>
      <Box sx={{ background: color.neutral100, border: `1px solid ${color.neutral300}`, borderRadius: `${radius.cardSm}px`, padding: '10px 11px' }}>
        <RuledBody>{body}</RuledBody>
        {steps && steps.length > 0 && <ThinkingTrace steps={steps} />}
        <Stack direction="row" gap="6px" sx={{ alignItems: "center", flexWrap: "wrap", mt: 1.25 }}>
          <Box component="span" sx={{ font: `500 9.5px/1.2 ${font.mono}`, background: color.neutral300, borderRadius: '6px', padding: '4px 7px' }}>
            turn {correlationId}
          </Box>
          <ActionButton onClick={onRetry}>Retry</ActionButton>
          <ActionButton>Copy id</ActionButton>
        </Stack>
      </Box>
    </Turn>
  );
}

// ---------------------------------------------------------------------------
// 6b. Declines to guess — styled as a normal answer (no warning treatment);
//     only the follow-up actions distinguish it. Correct, desired behavior.
// ---------------------------------------------------------------------------
export function DeclineAnswer({ agentKey, body, onRephrase, onAskOperator }) {
  const label = agentKey ? AGENT_LABELS[agentKey] : 'Help & Product Guide';
  return (
    <Turn>
      <Stack direction="row" gap="7px" sx={{ alignItems: 'center', mb: 1 }}>
        {agentKey && <AgentTile agentKey={agentKey} />}
        <Typography sx={{ font: `600 11px/1 ${font.body}` }}>{label}</Typography>
        <DocPill />
      </Stack>
      <RuledBody sx={{ mb: 1.25 }}>{body}</RuledBody>
      <Stack direction="row" gap="6px" sx={{ flexWrap: 'wrap', ml: '31px' }}>
        <Box component="button" onClick={onRephrase} sx={{
          all: 'unset', cursor: 'pointer', background: color.accent100, borderRadius: `${radius.pill}px`,
          padding: '5px 10px', font: `500 11px/1 ${font.body}`, color: color.accent700,
        }}>
          Rephrase
        </Box>
        <Box component="button" onClick={onAskOperator} sx={{
          all: 'unset', cursor: 'pointer', border: `1px solid ${color.neutral300}`, borderRadius: `${radius.pill}px`,
          padding: '5px 10px', font: `500 11px/1 ${font.body}`,
        }}>
          Ask an operator
        </Box>
      </Stack>
    </Turn>
  );
}

// ---------------------------------------------------------------------------
// 6c. Stub / unrouted — dashed tile, dashed "Not implemented" pill.
// ---------------------------------------------------------------------------
export function StubAnswer({ body, steps }) {
  return (
    <Turn>
      <Stack direction="row" gap="7px" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Stack direction="row" gap="7px" sx={{ alignItems: 'center' }}>
          <StubTile />
          <Typography sx={{ font: `600 11px/1 ${font.body}`, color: color.neutral800 }}>Unrouted</Typography>
        </Stack>
        <Freshness kind="stub" label="Not implemented" />
      </Stack>
      <RuledBody>{body}</RuledBody>
      {steps && steps.length > 0 && <ThinkingTrace steps={steps} />}
    </Turn>
  );
}

// ---------------------------------------------------------------------------
// 7. Escalation confirmation
// ---------------------------------------------------------------------------
export function EscalationMessage({ time, intro, fields }) {
  return (
    <Turn>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ font: `700 9.5px/1 ${font.heading}`, letterSpacing: '0.16em', textTransform: 'uppercase', color: color.accent700 }}>Aksha</Typography>
        <Typography sx={{ font: `600 9.5px/1 ${font.body}`, letterSpacing: '0.1em', textTransform: 'uppercase', color: color.neutral700 }}>Escalated · {time}</Typography>
      </Box>
      <RuledBody sx={{ mb: 1.5 }}>{intro}</RuledBody>
      <Box sx={{ border: `1px solid ${color.neutral300}`, borderRadius: `${radius.cardSm}px`, overflow: 'hidden', ml: '15px' }}>
        {fields.map((f, i) => (
          <Box key={f.label} sx={{ display: 'flex', justifyContent: 'space-between', padding: '9px 11px', borderBottom: i < fields.length - 1 ? `1px solid ${color.neutral200}` : 'none', font: `500 12px/1.3 ${font.body}` }}>
            <Typography sx={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: color.neutral700 }}>{f.label}</Typography>
            {f.multiline ? null : <Typography sx={{ fontWeight: 600 }}>{f.value}</Typography>}
          </Box>
        ))}
      </Box>
      <Stack direction="row" gap={1} sx={{ mt: 1.5, ml: '15px' }}>
        <ActionButton variant="secondary">Edit details</ActionButton>
        <ActionButton>View ticket</ActionButton>
      </Stack>
    </Turn>
  );
}

// ---------------------------------------------------------------------------
// 8. Approval request (future type — not wired up yet). Every real agent is
//    read-only today (AGENTS.md); this stays a labeled, not-live preview.
// ---------------------------------------------------------------------------
export function ApprovalRequest({ actionLabel, target, consequence, expiresIn, onApprove, onReject }) {
  return (
    <Turn sx={{ borderBottom: 'none' }}>
      <MetaLabel size={9} sx={{ letterSpacing: '0.16em', mb: 1 }}>Future type · not wired up</MetaLabel>
      <Box sx={{ border: `1px solid ${color.neutral300}`, borderRadius: `${radius.card}px`, overflow: 'hidden', opacity: 0.9 }}>
        <Box sx={{ background: color.accent, color: '#fff', padding: '9px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ font: `600 11px/1 ${font.body}` }}>Approval required</Typography>
          <Typography sx={{ font: `500 10px/1 ${font.body}` }}>Expires in {expiresIn}</Typography>
        </Box>
        <Box sx={{ padding: '16px 12px', background: '#fff' }}>
          <Typography sx={{ font: `400 12.5px/1.55 ${font.body}`, mb: 1.5 }}>
            I'm ready to <b>{actionLabel}</b> for <Box component="span" sx={{ borderBottom: `2px solid ${color.accent}`, fontWeight: 600 }}>{target}</Box>. {consequence}
          </Typography>
          <Typography sx={{ borderTop: `1px solid ${color.neutral200}`, pt: 1, mb: 1.5, font: `400 11.5px/1.5 ${font.body}`, color: color.neutral800 }}>
            Changes system state · logged against your operator ID · reversible from Camera settings.
          </Typography>
          <Stack direction="row" gap="7px">
            <ActionButton variant="primary" onClick={onApprove} sx={{ flex: 1, borderRadius: `${radius.pill}px` }}>Approve</ActionButton>
            <ActionButton variant="secondary" onClick={onReject} sx={{ flex: 1, borderRadius: `${radius.pill}px` }}>Reject</ActionButton>
          </Stack>
        </Box>
      </Box>
    </Turn>
  );
}

// ---------------------------------------------------------------------------
// 9. Rich output — table
// ---------------------------------------------------------------------------
export function RichOutputTable({ title, columns, rows, footer, exportLabel = 'CSV' }) {
  return (
    <Box sx={{ border: `1px solid ${color.neutral300}`, borderRadius: `${radius.cardSm}px`, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: color.neutral100, borderBottom: `1px solid ${color.neutral200}` }}>
        <Typography sx={{ font: `700 9px/1 ${font.heading}`, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{title}</Typography>
        <Stack direction="row" gap={1}>
          <Typography sx={{ font: `600 9px/1 ${font.body}`, letterSpacing: '0.1em', textTransform: 'uppercase', color: color.accent700, cursor: 'pointer' }}>{exportLabel}</Typography>
          <Typography sx={{ font: `600 9px/1 ${font.body}`, letterSpacing: '0.1em', textTransform: 'uppercase', color: color.accent700, cursor: 'pointer' }}>EXPAND</Typography>
        </Stack>
      </Box>
      <Box sx={{ overflowX: 'auto' }}>
      <Box component="table" sx={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse' }}>
        <Box component="thead">
          <Box component="tr">
            {columns.map((c) => <Box component="th" key={c} sx={{ textAlign: 'left', padding: '6px 10px', fontWeight: 700 }}>{c}</Box>)}
          </Box>
        </Box>
        <Box component="tbody">
          {rows.map((r, i) => (
            <Box component="tr" key={i} sx={{ borderTop: `1px solid ${color.divider}` }}>
              {r.map((cell, j) => (
                <Box component="td" key={j} sx={{ padding: '6px 10px', fontWeight: j === 0 ? 600 : 400, color: cell === 'OFF' ? color.accent700 : color.ink }}>{cell}</Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
      </Box>
      {footer && (
        <Typography sx={{ padding: '5px 10px', borderTop: `1px solid ${color.divider}`, font: `500 9.5px/1.2 ${font.body}`, letterSpacing: '0.08em', textTransform: 'uppercase', color: color.neutral700 }}>
          {footer}
        </Typography>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// 10. Rich output — horizontal bar chart
// ---------------------------------------------------------------------------
export function RichOutputBar({ title, bars, footer, maxValue }) {
  const max = maxValue ?? Math.max(...bars.map((b) => b.value));
  const shades = [color.accent800, color.accent500, color.accent500, color.accent300, color.accent300];
  return (
    <Box sx={{ border: `1px solid ${color.neutral300}`, borderRadius: `${radius.cardSm}px`, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: color.neutral100, borderBottom: `1px solid ${color.neutral200}` }}>
        <Typography sx={{ font: `700 9px/1 ${font.heading}`, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{title}</Typography>
        <Typography sx={{ font: `600 9px/1 ${font.body}`, letterSpacing: '0.1em', textTransform: 'uppercase', color: color.accent700, cursor: 'pointer' }}>PNG</Typography>
      </Box>
      <Stack gap="9px" sx={{ padding: '12px 10px' }}>
        {bars.map((b, i) => (
          <Box key={b.label} sx={{ display: 'grid', gridTemplateColumns: '96px 1fr 26px', alignItems: 'center', gap: '8px', font: `500 10px/1 ${font.body}` }}>
            <span>{b.label}</span>
            <Box sx={{ height: 14, background: color.neutral200 }}>
              <Box sx={{ height: 14, width: `${(b.value / max) * 100}%`, background: shades[i] ?? color.accent300 }} />
            </Box>
            <span style={{ fontWeight: 700, textAlign: 'right' }}>{b.value}</span>
          </Box>
        ))}
      </Stack>
      {footer && (
        <Typography sx={{ padding: '5px 10px', borderTop: `1px solid ${color.divider}`, font: `500 9.5px/1.2 ${font.body}`, letterSpacing: '0.08em', textTransform: 'uppercase', color: color.neutral700 }}>
          {footer}
        </Typography>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// 11. Rich output — donut chart
// ---------------------------------------------------------------------------
export function RichOutputDonut({ title, slices, footer }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const circumference = 2 * Math.PI * 42;
  let offset = 0;
  const dashArrays = slices.map((s) => {
    const len = (s.value / total) * circumference;
    const arr = `${len} ${circumference - len}`;
    const rotate = (offset / total) * 360 - 90;
    offset += s.value;
    return { arr, rotate };
  });
  return (
    <Box sx={{ border: `1px solid ${color.neutral300}`, borderRadius: `${radius.cardSm}px`, overflow: 'hidden' }}>
      <Typography sx={{ padding: '6px 10px', background: color.neutral100, borderBottom: `1px solid ${color.neutral200}`, font: `700 9px/1 ${font.heading}`, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        {title}
      </Typography>
      <Stack direction="row" gap={2} sx={{ alignItems: "center",  padding: '12px 10px' }}>
        <svg viewBox="0 0 120 120" width={100} height={100} role="img" aria-label={title}>
          <circle cx="60" cy="60" r="42" fill="none" stroke={color.accent200} strokeWidth="22" />
          {slices.map((s, i) => (
            <circle
              key={s.label}
              cx="60" cy="60" r="42" fill="none"
              stroke={s.color}
              strokeWidth="22"
              strokeDasharray={dashArrays[i].arr}
              transform={`rotate(${dashArrays[i].rotate} 60 60)`}
            />
          ))}
        </svg>
        <Stack gap="8px" flex={1}>
          {slices.map((s) => (
            <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, font: `500 10.5px/1 ${font.body}` }}>
              <Box sx={{ width: 12, height: 12, background: s.color, flex: 'none' }} />
              <span style={{ flex: 1 }}>{s.label}</span>
              <b>{s.value}</b>
              <span style={{ color: color.neutral700, width: 30, textAlign: 'right' }}>{Math.round((s.value / total) * 100)}%</span>
            </Box>
          ))}
        </Stack>
      </Stack>
      {footer && (
        <Typography sx={{ padding: '5px 10px', borderTop: `1px solid ${color.divider}`, font: `500 9.5px/1.2 ${font.body}`, letterSpacing: '0.08em', textTransform: 'uppercase', color: color.neutral700 }}>
          {footer}
        </Typography>
      )}
    </Box>
  );
}
