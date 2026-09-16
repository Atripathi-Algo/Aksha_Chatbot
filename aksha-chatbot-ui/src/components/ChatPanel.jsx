import { useMediaQuery, useTheme } from '@mui/material';
import { Box } from '@mui/material';
import { color, shadowLg, radius, panel } from '../tokens';
import PanelHeader from './PanelHeader';
import ScopeChips from './ScopeChips';
import EmptyState from './EmptyState';
import MessageList from './MessageList';
import Composer from './Composer';

export default function ChatPanel({
  open, onClose, messages, scope, onClear, onRemoveScope, onSend, onClarificationSelect, onPickSuggestion,
  sessions, activeThreadId, onSelectSession, onNewChat, onDeleteSession, sending,
}) {
  const theme = useTheme();
  const isBottomSheet = useMediaQuery(theme.breakpoints.down('lg')); // < 1100px per mockup 3c
  const isFullScreen = useMediaQuery(theme.breakpoints.down('sm')); // < 600px per TOKENS.md geometry

  if (!open) return null;

  // v3.0: a floating, rounded panel inset from the corner — not a full-height
  // docked sidebar — per TOKENS.md's "400–420px floating, inset 16px
  // bottom-right" geometry. Bottom sheet / full screen keep their own shape.
  const containerSx = isFullScreen
    ? { position: 'fixed', inset: 0, borderRadius: 0 }
    : isBottomSheet
    ? {
        position: 'fixed', left: 0, right: 0, bottom: 0, height: panel.bottomSheetHeight,
        borderTopLeftRadius: `${radius.panel}px`, borderTopRightRadius: `${radius.panel}px`,
        border: `1px solid ${color.neutral300}`, borderBottom: 'none',
      }
    : {
        position: 'fixed', right: 16, bottom: 16, width: panel.width,
        height: 'min(720px, calc(100vh - 32px))',
        borderRadius: `${radius.panel}px`, border: `1px solid ${color.neutral300}`,
      };

  return (
    <Box
      role="dialog"
      aria-label="Aksha assistant"
      sx={{
        ...containerSx,
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        boxShadow: shadowLg,
        overflow: 'hidden',
        zIndex: 1300,
      }}
    >
      {isBottomSheet && !isFullScreen && (
        <Box sx={{ display: 'flex', justifyContent: 'center', padding: '6px 0 2px', background: '#fff' }}>
          <Box sx={{ width: 44, height: 4, borderRadius: '99px', background: color.neutral400 }} />
        </Box>
      )}
      <PanelHeader
        onClose={onClose}
        sessions={sessions} activeThreadId={activeThreadId}
        onSelectSession={onSelectSession} onNewChat={onNewChat} onDeleteSession={onDeleteSession}
      />
      <ScopeChips scope={scope} onClear={onClear} onRemove={onRemoveScope} />
      {messages.length === 0 ? (
        <EmptyState onPick={onPickSuggestion} />
      ) : (
        <MessageList items={messages} onClarificationSelect={onClarificationSelect} />
      )}
      <Composer onSend={onSend} disabled={sending} />
    </Box>
  );
}
