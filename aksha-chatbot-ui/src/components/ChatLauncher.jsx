import { Box, Typography } from '@mui/material';
import { MessageCircle } from 'lucide-react';
import { color, font, shadowLg } from '../tokens';

// Floating round launcher, bottom-right — sits where the panel itself opens
// (inset 16px bottom-right, per TOKENS.md), matching the v3.0 floating-panel
// geometry rather than the old flat edge-docked tab. Alt+K toggles too.
export default function ChatLauncher({ unreadCount = 0, onOpen }) {
  const hasUnread = unreadCount > 0;
  return (
    <Box
      component="button"
      onClick={onOpen}
      aria-label={hasUnread ? `Open Aksha assistant, ${unreadCount} new answer` : 'Open Aksha assistant'}
      sx={{
        all: 'unset', cursor: 'pointer',
        position: 'fixed', right: 16, bottom: 16,
        width: 56, height: 56, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: color.accent, color: '#fff', boxShadow: shadowLg,
        zIndex: 1300,
      }}
    >
      <MessageCircle size={24} strokeWidth={2} />
      {hasUnread && (
        <Box sx={{
          position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: '9px',
          background: color.ink, color: '#fff', border: '2px solid #fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', px: '3px',
        }}>
          <Typography sx={{ font: `700 9.5px/1 ${font.body}` }}>{unreadCount}</Typography>
        </Box>
      )}
    </Box>
  );
}
