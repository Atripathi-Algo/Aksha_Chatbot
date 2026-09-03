import { Box, Stack, Typography } from '@mui/material';
import { AGENT_LABELS } from './shared';
import { color, font } from '../tokens';

// A literal picture of the real LangGraph wiring (aksha-chatbot-api/app/graph.py)
// plus the SSE events each stage actually emits (app/main.py) — kept in sync
// with those two files by hand since there's no auto-generated diagram yet.
//   normalize_query -> route_request -> [needs_clarification?] -> END
//                                     -> domain_worker -> format_response -> END
//
// When `mode="live"`, `liveStep` (App.jsx, mirroring the same SSE stream that
// drives the in-panel "thinking" trace) drives which node is highlighted, so
// this reads the actual turn in progress rather than standing still.

const NODE = { w: 160, h: 64 };

// SSE/graph phase -> node key(s) to highlight.
function activeKeys(step) {
  if (!step) return [];
  switch (step.phase) {
    case 'sent': return ['normalize'];
    case 'routed':
    case 'routing': return ['route'];
    case 'tool_call':
    case 'tool_result': return ['domain', 'registry'];
    case 'formatting':
    case 'streaming': return ['format'];
    case 'clarification': return ['clarify'];
    case 'done': return step.status === 'needs_clarification' ? ['clarify'] : ['answer'];
    default: return [];
  }
}

function describeStep(step) {
  if (!step) return null;
  switch (step.phase) {
    case 'sent': return 'Received query — normalizing…';
    case 'routed': return `Routed to ${step.agent}`;
    case 'routing': return step.intent
      ? `Classified as "${step.intent}" (${Math.round((step.confidence ?? 0) * 100)}% confidence, ${step.risk_level} risk)`
      : 'Classifying intent…';
    case 'tool_call': {
      const argsText = step.args && Object.keys(step.args).length ? ` with ${JSON.stringify(step.args)}` : '';
      return `Calling ${step.tool}${argsText}`;
    }
    case 'tool_result': return step.ok ? `${step.tool} succeeded` : `${step.tool} failed (${step.error_code || 'unknown error'})`;
    case 'formatting': return 'Writing the answer…';
    case 'streaming': return 'Streaming the answer…';
    case 'clarification': return 'Asked the operator to clarify';
    case 'done': return step.status === 'needs_clarification'
      ? 'Waiting on operator clarification'
      : step.status === 'resolved'
      ? `Answered — ${AGENT_LABELS[step.agent] || step.agent || 'agent'}`
      : 'Answer degraded — see chat';
    case 'error': return "Couldn't reach the chatbot API";
    default: return null;
  }
}

// Up to 2 display lines summarizing the actual tools called this turn,
// deduped (a multi-round tool loop can call the same tool twice) and
// truncated so a long list doesn't overflow the node.
function toolsLines(tools) {
  const unique = [...new Set(tools)];
  if (unique.length === 0) return null;
  if (unique.length <= 2) return unique;
  return [unique[0], `+${unique.length - 1} more`];
}

function Node({ x, y, title, sub, tone = 'neutral', dashed = false, active = false }) {
  const fill = tone === 'accent' ? color.accent100 : '#fff';
  const stroke = active ? color.accent : tone === 'accent' ? color.accent500 : color.neutral400;
  const titleColor = tone === 'accent' ? color.accent700 : color.ink;
  return (
    <g>
      {active && (
        <rect
          x={x - 4} y={y - 4} width={NODE.w + 8} height={NODE.h + 8} rx={13}
          fill="none" stroke={color.accent} strokeWidth={1.5} opacity={0.45}
        >
          <animate attributeName="opacity" values="0.55;0.12;0.55" dur="1.6s" repeatCount="indefinite" />
        </rect>
      )}
      <rect
        x={x} y={y} width={NODE.w} height={NODE.h} rx={9}
        fill={fill} stroke={stroke} strokeWidth={active ? 2 : 1.4}
        strokeDasharray={dashed ? '4 3' : undefined}
        filter="url(#node-shadow)"
      />
      {active && (
        <circle cx={x + NODE.w - 11} cy={y + 11} r={4} fill={color.accent}>
          <animate attributeName="opacity" values="1;0.35;1" dur="1.1s" repeatCount="indefinite" />
        </circle>
      )}
      <text x={x + NODE.w / 2} y={y + 25} textAnchor="middle" fontFamily={font.body} fontSize="12.5" fontWeight="700" fill={titleColor}>
        {title}
      </text>
      {sub.map((line, i) => {
        const isLiveValue = typeof line === 'object';
        const text = isLiveValue ? line.text : line;
        return (
          <text
            key={i} x={x + NODE.w / 2} y={y + 40 + i * 12.5} textAnchor="middle"
            fontFamily={isLiveValue ? font.mono : font.body}
            fontSize="9.5" fontWeight={isLiveValue ? '700' : '400'}
            fill={isLiveValue ? color.accent700 : color.neutral700}
          >
            {text}
          </text>
        );
      })}
    </g>
  );
}

function EdgeLabel({ x, y, children }) {
  const w = Math.max(46, children.length * 5.6);
  return (
    <g>
      <rect x={x - w / 2} y={y - 10} width={w} height={14} rx={4} fill="#fff" />
      <text x={x} y={y} textAnchor="middle" fontFamily={font.mono} fontSize="9" fill={color.accent700}>{children}</text>
    </g>
  );
}

function Arrow({ d, active = false }) {
  return (
    <path
      d={d} fill="none"
      stroke={active ? color.accent : color.neutral500}
      strokeWidth={active ? 1.8 : 1.3}
      markerEnd={active ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
    />
  );
}

export default function ProcessingGraph({ mode, liveStep, liveAgent, liveTools = [] }) {
  const active = activeKeys(liveStep);
  const is = (key) => active.includes(key);
  const statusText = mode === 'live' ? describeStep(liveStep) : null;
  const isLive = mode === 'live';

  const uniqueToolCount = new Set(liveTools).size;
  const toolLines = toolsLines(liveTools);
  const routeSub = liveAgent
    ? ['LLM classifies intent', { text: `→ ${liveAgent}` }]
    : ['LLM classifies intent', '+ risk level'];
  const domainSub = toolLines
    ? [`Called ${uniqueToolCount} tool${uniqueToolCount === 1 ? '' : 's'}:`, { text: toolLines.join(', ') }]
    : ['picked agent calls tools,', 'up to 3 rounds'];
  const registrySub = toolLines
    ? toolLines.map((t) => ({ text: t }))
    : ['cameras · alerts · notifs', 'Node API or docs/*.md'];

  return (
    <Box sx={{ border: `1px solid ${color.neutral300}`, background: '#fff' }}>
      <Box sx={{ padding: '12px 16px', borderBottom: `1px solid ${color.neutral200}` }}>
        <Typography sx={{ font: `700 11px/1 ${font.heading}`, letterSpacing: '0.06em', textTransform: 'uppercase', color: color.neutral800 }}>
          Chatbot processing graph
        </Typography>
        <Typography sx={{ font: `400 11px/1.5 ${font.body}`, color: color.neutral700, mt: 0.5 }}>
          The actual LangGraph state machine a message runs through, from composer to on-screen answer.
        </Typography>
      </Box>

      <Stack
        direction="row"
        gap="8px"
        sx={{
          alignItems: 'center', padding: '9px 16px', borderBottom: `1px solid ${color.neutral200}`,
          background: statusText ? color.accent100 : color.neutral100,
        }}
      >
        <Box sx={{
          width: 7, height: 7, borderRadius: '50%', flex: 'none',
          background: statusText ? color.accent : color.neutral400,
          animation: statusText ? 'pg-pulse 1.1s ease-in-out infinite' : 'none',
        }} />
        <Typography sx={{ font: `600 11px/1.4 ${font.mono}`, color: statusText ? color.accent700 : color.neutral600 }}>
          {statusText || (isLive ? 'Idle — send a message to watch this run live.' : 'Switch to Live above to watch a real turn move through this graph.')}
        </Typography>
        <style>{'@keyframes pg-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }'}</style>
      </Stack>

      <Box sx={{ overflowX: 'auto', padding: '18px 16px 8px' }}>
        <svg viewBox="0 0 1040 340" style={{ width: '100%', minWidth: 820, height: 'auto', display: 'block' }} role="img"
          aria-label="Flow diagram: a query is normalized, then routed by an LLM which may ask a clarifying question or hand off to a domain worker that calls tools from a typed registry in a loop, whose results a formatter turns into a streamed answer with follow-up suggestions; when live, the node currently running is highlighted from real SSE events.">
          <defs>
            <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#1b2029" floodOpacity="0.12" />
            </filter>
            <marker id="arrowhead" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" fill={color.neutral500} />
            </marker>
            <marker id="arrowhead-active" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" fill={color.accent} />
            </marker>
          </defs>

          {/* Row 1 */}
          <Node x={8} y={70} title="Composer" sub={['operator types /', 'picks a suggestion']} />
          <Arrow d="M148 102 L 176 102" />
          <EdgeLabel x={162} y={92}>POST /stream</EdgeLabel>

          <Node x={176} y={70} title="normalize_query" sub={['trims whitespace']} active={is('normalize')} />
          <Arrow d="M326 102 L 354 102" active={is('route')} />

          <Node x={354} y={70} title="route_request" sub={routeSub} tone="accent" active={is('route')} />
          <Arrow d="M514 102 L 542 102" active={is('domain')} />
          <EdgeLabel x={528} y={92}>continue</EdgeLabel>

          <Node x={542} y={70} title="domain_worker" sub={domainSub} tone="accent" active={is('domain')} />
          <Arrow d="M702 102 L 730 102" active={is('format')} />
          <EdgeLabel x={716} y={92}>results</EdgeLabel>

          <Node x={730} y={70} title="format_response" sub={['formatter LLM writes prose', '+ suggests follow-ups']} tone="accent" active={is('format')} />

          {/* Row 1 -> Row 2 */}
          <Arrow d="M434 134 L 434 210" active={is('clarify')} />
          <EdgeLabel x={434} y={172}>routed event</EdgeLabel>

          <Arrow d="M622 134 L 622 210" active={is('registry')} />
          <EdgeLabel x={622} y={172}>thinking events</EdgeLabel>

          <Arrow d="M810 134 L 810 210" active={is('answer')} />
          <EdgeLabel x={810} y={172}>token · done</EdgeLabel>

          {/* Row 2 */}
          <Node x={354} y={210} title="needs_clarification?" sub={['e.g. which camera?']} dashed active={is('clarify')} />
          <Node x={542} y={210} title="Tool registry" sub={registrySub} active={is('registry')} />
          <Node x={730} y={210} title="Answer in chat" sub={['sources, follow-ups,', 'freshness pill']} active={is('answer')} />

          {/* Clarification loop back to composer */}
          <path d="M354 236 C 220 300, 120 230, 78 134" fill="none" stroke={color.neutral500} strokeWidth={1.3} strokeDasharray="3 3" markerEnd="url(#arrowhead)" />
          <EdgeLabel x={200} y={296}>END · operator answers, thread continues</EdgeLabel>
        </svg>
      </Box>
      <Box sx={{ padding: '10px 16px 14px' }}>
        <Typography sx={{ font: `400 10.5px/1.5 ${font.body}`, color: color.neutral600 }}>
          Source: <code>aksha-chatbot-api/app/graph.py</code> (state machine) and <code>app/main.py</code> (SSE events) — updated by hand alongside those files, not generated.
        </Typography>
      </Box>
    </Box>
  );
}
