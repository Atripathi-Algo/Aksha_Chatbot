import { Box, Stack, Typography } from '@mui/material';
import { color, font, radius } from '../tokens';
import { agentDirectory } from '../data/mockConversation';
import { AgentTile } from './shared';

export default function AgentDirectory() {
  return (
    <Box sx={{ borderBottom: `1px solid ${color.neutral200}`, background: color.neutral100, padding: '10px' }}>
      <Box sx={{ padding: '2px 4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography sx={{ font: `600 11px/1 ${font.body}` }}>
          Agents · {agentDirectory.length}
        </Typography>
        <Typography sx={{ font: `500 9.5px/1 ${font.body}`, color: color.neutral700 }}>
          Routed automatically
        </Typography>
      </Box>
      <Stack gap="5px">
        {agentDirectory.map((a) => (
          <Box key={a.key} sx={{ display: 'flex', alignItems: 'center', gap: '9px', background: '#fff', borderRadius: `${radius.hover}px`, padding: '8px 10px' }}>
            <AgentTile agentKey={a.key} size={22} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ font: `600 11px/1.2 ${font.body}` }}>{a.name}</Typography>
              <Typography sx={{ font: `400 9.5px/1.3 ${font.mono}`, color: color.neutral700, mt: '3px' }}>{a.ref}</Typography>
            </Box>
          </Box>
        ))}
      </Stack>
      <Typography sx={{ padding: '8px 4px 2px', font: `400 10px/1.4 ${font.body}`, color: color.neutral700 }}>
        Tinted tile = reads a live endpoint · neutral tile = answers from indexed documentation.
      </Typography>
    </Box>
  );
}
