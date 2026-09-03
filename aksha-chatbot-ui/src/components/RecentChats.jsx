import { Box, Stack, Typography } from '@mui/material';
import { MessageSquare, Plus, X } from 'lucide-react';
import { color, font, radius } from '../tokens';

function relativeTime(ts) {
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

export default function RecentChats({ sessions, activeThreadId, onSelect, onNewChat, onDelete }) {
  return (
    <Box sx={{ borderBottom: `1px solid ${color.neutral200}`, background: color.neutral100, padding: '10px' }}>
      <Box sx={{ padding: '2px 4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography sx={{ font: `600 11px/1 ${font.body}` }}>
          Recent chats {sessions.length > 0 ? `· ${sessions.length}` : ''}
        </Typography>
        <Box
          component="button"
          onClick={onNewChat}
          sx={{
            all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px',
            font: `500 10px/1 ${font.body}`, color: color.accent700,
          }}
        >
          <Plus size={12} strokeWidth={2.4} /> New chat
        </Box>
      </Box>
      {sessions.length === 0 ? (
        <Typography sx={{ padding: '8px 4px', font: `400 11px/1.4 ${font.body}`, color: color.neutral700 }}>
          Live conversations you've had will show up here — stored on this device only.
        </Typography>
      ) : (
        <Stack gap="5px">
          {sessions.map((s) => (
            <Box
              key={s.threadId}
              component="button"
              onClick={() => onSelect(s)}
              sx={{
                all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '9px',
                background: s.threadId === activeThreadId ? color.accent100 : '#fff',
                borderRadius: `${radius.hover}px`, padding: '8px 10px',
                '&:hover': { background: color.accent100 },
              }}
            >
              <Box sx={{
                width: 22, height: 22, borderRadius: `${radius.tile}px`, flex: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: color.neutral200, color: color.neutral800,
              }}>
                <MessageSquare size={13} strokeWidth={2} />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ font: `600 11px/1.2 ${font.body}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.title}
                </Typography>
                <Typography sx={{ font: `400 9.5px/1.3 ${font.body}`, color: color.neutral700, mt: '3px' }}>
                  {relativeTime(s.updatedAt)}
                </Typography>
              </Box>
              <Box
                component="span"
                role="button"
                aria-label="Delete chat"
                onClick={(e) => { e.stopPropagation(); onDelete(s.threadId); }}
                sx={{ display: 'flex', color: color.neutral600, flex: 'none', '&:hover': { color: color.neutral800 } }}
              >
                <X size={13} />
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
