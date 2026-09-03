import { useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { ChevronDown, X, Download, History } from 'lucide-react';
import { color, font } from '../tokens';
import { ActionButton } from './shared';
import AgentDirectory from './AgentDirectory';
import RecentChats from './RecentChats';
import akshaLogo from '../assets/aksha-logo.png';

export default function PanelHeader({
  onClose, showDownload = true,
  sessions = [], activeThreadId, onSelectSession, onNewChat, onDeleteSession,
}) {
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '11px 14px', borderBottom: `1px solid ${color.neutral200}`,
        }}
      >
        <Stack direction="row" gap={1} sx={{ alignItems: "center" }}>
          <Box
            component="img"
            src={akshaLogo}
            alt=""
            aria-hidden="true"
            sx={{ width: 20, height: 20, borderRadius: '6px', flex: 'none', objectFit: 'cover' }}
          />
          <Typography sx={{ font: `600 13px/1 ${font.body}`, letterSpacing: '-0.01em' }}>
            Aksha Assist
          </Typography>
        </Stack>
        <Stack direction="row" gap={0.75} sx={{ alignItems: 'center' }}>
          <ActionButton onClick={() => { setRecentOpen((v) => !v); setAgentsOpen(false); }} aria-label="Recent chats" sx={{ gap: '5px' }}>
            <History size={13} />
          </ActionButton>
          <ActionButton onClick={() => { setAgentsOpen((v) => !v); setRecentOpen(false); }} sx={{ gap: '5px' }}>
            Agents <ChevronDown size={13} style={{ display: 'block' }} />
          </ActionButton>
          {showDownload && (
            <ActionButton aria-label="Download conversation">
              <Download size={13} />
            </ActionButton>
          )}
          <ActionButton onClick={onClose} aria-label="Close chat panel">
            <X size={15} />
          </ActionButton>
        </Stack>
      </Box>
      {agentsOpen && <AgentDirectory onClose={() => setAgentsOpen(false)} />}
      {recentOpen && (
        <RecentChats
          sessions={sessions}
          activeThreadId={activeThreadId}
          onSelect={(s) => { onSelectSession?.(s); setRecentOpen(false); }}
          onNewChat={() => { onNewChat?.(); setRecentOpen(false); }}
          onDelete={onDeleteSession}
        />
      )}
    </Box>
  );
}
