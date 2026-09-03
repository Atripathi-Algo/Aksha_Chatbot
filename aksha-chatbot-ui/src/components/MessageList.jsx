import { Box, Stack, Typography } from '@mui/material';
import { color, font } from '../tokens';
import { MetaLabel, AgentTile, AGENT_LABELS, Freshness, RuledBody, Turn } from './shared';
import {
  OperatorMessage, AgentAnswer, StreamingAnswer, ClarificationMessage,
  CachedAnswer, DegradedAnswer, DeclineAnswer, StubAnswer, EscalationMessage, ApprovalRequest,
  RichOutputTable, RichOutputBar, RichOutputDonut,
} from './messages';

// Agent answers that embed a rich output (table/bar/donut) share the same
// header + ruled body as a plain AgentAnswer, then place the chart/table
// where AgentAnswer would put frames/sources — matching mockup 4b. This is
// the labeled §8 proposal (structured data), not what the live API sends.
function AgentWithRichOutput({ agentKey, agent, freshness, body, richOutput }) {
  const label = agentKey ? AGENT_LABELS[agentKey] : agent;
  return (
    <Turn>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Stack direction="row" gap="7px" sx={{ alignItems: 'center' }}>
          {agentKey && <AgentTile agentKey={agentKey} />}
          <Typography sx={{ font: `600 11px/1 ${font.body}` }}>
            {label}
          </Typography>
        </Stack>
        {freshness && <Freshness kind={freshness.kind} label={freshness.label} />}
      </Box>
      <RuledBody sx={{ mb: 1.5 }}>{body}</RuledBody>
      <Box sx={{ ml: agentKey ? '31px' : 0 }}>{richOutput}</Box>
    </Turn>
  );
}

export default function MessageList({ items, onClarificationSelect }) {
  return (
    <Stack sx={{ flex: 1, minWidth: 0, overflowY: 'auto', overflowX: 'hidden' }}>
      {items.map((item, i) => {
        switch (item.type) {
          case 'operator':
            return <OperatorMessage key={i} {...item.props} />;
          case 'agent':
            return <AgentAnswer key={i} {...item.props} />;
          case 'streaming':
            return <StreamingAnswer key={i} {...item.props} />;
          case 'clarification':
            return <ClarificationMessage key={i} {...item.props} onSelect={onClarificationSelect} />;
          case 'cached':
            return <CachedAnswer key={i} {...item.props} />;
          case 'degraded':
            return <DegradedAnswer key={i} {...item.props} />;
          case 'decline':
            return <DeclineAnswer key={i} {...item.props} />;
          case 'stub':
            return <StubAnswer key={i} {...item.props} />;
          case 'escalation':
            return <EscalationMessage key={i} {...item.props} />;
          case 'approval':
            return <ApprovalRequest key={i} {...item.props} />;
          case 'agentTable':
            return (
              <AgentWithRichOutput
                key={i}
                agentKey={item.props.agentKey}
                agent={item.props.agent}
                freshness={item.props.freshness}
                body={item.props.body}
                richOutput={<RichOutputTable {...item.props.table} />}
              />
            );
          case 'agentBar':
            return (
              <AgentWithRichOutput
                key={i}
                agentKey={item.props.agentKey}
                agent={item.props.agent}
                freshness={item.props.freshness}
                body={item.props.body}
                richOutput={<RichOutputBar {...item.props.bar} />}
              />
            );
          case 'agentDonut':
            return (
              <AgentWithRichOutput
                key={i}
                agentKey={item.props.agentKey}
                agent={item.props.agent}
                freshness={item.props.freshness}
                body={item.props.body}
                richOutput={<RichOutputDonut {...item.props.donut} />}
              />
            );
          default:
            return (
              <Turn key={i}>
                <MetaLabel>Unknown message type: {item.type}</MetaLabel>
              </Turn>
            );
        }
      })}
    </Stack>
  );
}
