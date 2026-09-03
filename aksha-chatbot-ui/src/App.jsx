import { useEffect, useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { color, font, radius } from './tokens';
import ChatLauncher from './components/ChatLauncher';
import ChatPanel from './components/ChatPanel';
import ProcessingGraph from './components/ProcessingGraph';
import { conversation as demoConversation } from './data/mockConversation';
import { streamChat } from './api/chatClient';
import { listSessions, saveSession, deleteSession } from './data/chatHistory';

// Segmented Demo/Live switch — Demo replays the scripted design-spec transcript,
// Live sends real turns to aksha-chatbot-api. Lives on the host dashboard page,
// not inside the chat panel, since this toggle is test-harness-only and won't
// ship as part of the real chatbot bundle.
function ModeToggle({ mode, onModeChange }) {
  const seg = (value, label) => (
    <Box
      component="button"
      onClick={() => onModeChange(value)}
      aria-pressed={mode === value}
      sx={{
        cursor: 'pointer', border: `1px solid ${mode === value ? color.accent : color.neutral400}`,
        background: mode === value ? color.accent : 'transparent',
        color: mode === value ? '#fff' : color.ink,
        borderRadius: `${radius.pill}px`, padding: '6px 14px',
        font: `600 11px/1 ${font.body}`, letterSpacing: '0.02em',
      }}
    >
      {label}
    </Box>
  );
  return (
    <Stack direction="row" gap="6px">
      {seg('demo', 'Demo')}
      {seg('live', 'Live')}
    </Stack>
  );
}

const initialScope = [];

let nextId = 1;
const newId = () => `live-${nextId++}`;

export default function App() {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState('demo'); // 'demo' = scripted transcript, 'live' = real calls to aksha-chatbot-api
  const [liveMessages, setLiveMessages] = useState([]);
  const messages = mode === 'demo' ? demoConversation : liveMessages;
  const [scope, setScope] = useState(initialScope);
  const [unread, setUnread] = useState(0);
  const [threadId, setThreadId] = useState(() => crypto.randomUUID());
  const [sessions, setSessions] = useState(() => listSessions());
  // Live SSE activity, mirrored up here so ProcessingGraph (on the host
  // dashboard page, outside the chat panel) can highlight the node a real
  // turn is currently in — same events already driving the in-panel
  // "thinking" trace, just also kept at this level.
  const [liveStep, setLiveStep] = useState(null);
  const liveStepTimerRef = useRef(null);
  // Persist for the whole turn (not auto-cleared like liveStep's transient
  // status line) so the graph can keep showing which agent and tools a
  // finished turn actually used, not just flash it and disappear.
  const [liveAgent, setLiveAgent] = useState(null);
  const [liveTools, setLiveTools] = useState([]);
  // Groq answers a short turn fast enough that raw token delivery can look
  // like one instant reveal rather than a stream. This paces the on-screen
  // reveal independently of how fast the text actually arrived, so the
  // typing effect is always visible regardless of backend/LLM speed.
  const revealTimerRef = useRef(null);
  const REVEAL_CHARS_PER_TICK = 3;
  const REVEAL_TICK_MS = 15;

  const pushLiveStep = (step, autoClearMs) => {
    if (liveStepTimerRef.current) clearTimeout(liveStepTimerRef.current);
    setLiveStep(step);
    if (autoClearMs) {
      liveStepTimerRef.current = setTimeout(() => setLiveStep(null), autoClearMs);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Persist every live conversation to this device's recent-chats list —
  // there's no backend session store yet (no auth, in-memory checkpointer
  // only), so this is the only place a conversation survives a page reload.
  useEffect(() => {
    if (liveMessages.length === 0) return;
    const firstOperatorMsg = liveMessages.find((m) => m.type === 'operator');
    const title = firstOperatorMsg
      ? firstOperatorMsg.props.text.slice(0, 60) + (firstOperatorMsg.props.text.length > 60 ? '…' : '')
      : 'New conversation';
    saveSession(threadId, title, liveMessages, Date.now());
    setSessions(listSessions());
  }, [liveMessages, threadId]);

  const openPanel = () => { setOpen(true); setUnread(0); };
  const closePanel = () => setOpen(false);

  const startNewChat = () => {
    setLiveMessages([]);
    setThreadId(crypto.randomUUID());
    setMode('live');
  };

  const selectSession = (session) => {
    setLiveMessages(session.messages);
    setThreadId(session.threadId);
    setMode('live');
  };

  const removeSession = (id) => {
    deleteSession(id);
    setSessions(listSessions());
    if (id === threadId) startNewChat();
  };

  const replaceById = (id, item) => {
    setLiveMessages((m) => m.map((entry) => (entry.id === id ? item : entry)));
  };

  const sendMessage = (text, lang = 'EN') => {
    setMode('live'); // sending always means real chat — hop off the scripted demo transcript
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const streamingId = newId();

    setLiveMessages((m) => [
      ...m,
      { id: newId(), type: 'operator', props: { time, lang: lang === 'EN' ? undefined : lang, text } },
      { id: streamingId, type: 'streaming', props: { partialText: '', sourcesResolving: 'connecting…' } },
    ]);

    let accumulated = '';
    let routedAgent = null;
    let steps = [];
    let announcedStreaming = false;
    let revealed = 0;
    let pendingFinalize = null;

    if (revealTimerRef.current) {
      clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }

    const renderReveal = () => {
      replaceById(streamingId, {
        id: streamingId,
        type: 'streaming',
        props: { partialText: accumulated.slice(0, revealed), sourcesResolving: routedAgent || 'thinking…', steps, onStop: skipReveal },
      });
    };

    const tickReveal = () => {
      if (revealed < accumulated.length) {
        revealed = Math.min(accumulated.length, revealed + REVEAL_CHARS_PER_TICK);
        renderReveal();
        return;
      }
      clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
      if (pendingFinalize) {
        const fn = pendingFinalize;
        pendingFinalize = null;
        fn();
      }
    };

    const startReveal = () => {
      if (revealTimerRef.current) return;
      revealTimerRef.current = setInterval(tickReveal, REVEAL_TICK_MS);
    };

    function skipReveal() {
      revealed = accumulated.length;
      renderReveal();
      if (revealTimerRef.current) {
        clearInterval(revealTimerRef.current);
        revealTimerRef.current = null;
      }
      if (pendingFinalize) {
        const fn = pendingFinalize;
        pendingFinalize = null;
        fn();
      }
    }

    setLiveAgent(null);
    setLiveTools([]);
    pushLiveStep({ phase: 'sent' });

    streamChat(threadId, text, lang, {
      onRouted: (agent) => {
        routedAgent = agent;
        setLiveAgent(agent);
        pushLiveStep({ phase: 'routed', agent });
        replaceById(streamingId, { id: streamingId, type: 'streaming', props: { partialText: '', sourcesResolving: `routed to ${agent}`, steps } });
      },
      onThinking: (step) => {
        steps = [...steps, step];
        if (step.phase === 'tool_call') setLiveTools((t) => [...t, step.tool]);
        pushLiveStep({ ...step, agent: routedAgent });
        replaceById(streamingId, { id: streamingId, type: 'streaming', props: { partialText: accumulated, sourcesResolving: routedAgent || 'thinking…', steps } });
      },
      onToken: (chunk) => {
        accumulated += chunk;
        if (!announcedStreaming) {
          announcedStreaming = true;
          pushLiveStep({ phase: 'streaming', agent: routedAgent });
        }
        startReveal();
      },
      onClarification: ({ question, options }) => {
        pushLiveStep({ phase: 'clarification' }, 5000);
        replaceById(streamingId, {
          id: streamingId,
          type: 'clarification',
          props: {
            question,
            options: (options || []).map((label) => ({ label })),
          },
        });
      },
      onDone: (payload) => {
        pushLiveStep({ phase: 'done', status: payload.status, agent: payload.agent }, 5000);
        // The clarification path never streams tokens and already rendered
        // its own card via onClarification — finalizing here would overwrite
        // it with an empty "agent" bubble (blank body, no sources).
        if (payload.status === 'needs_clarification') {
          if (!open) setUnread((u) => u + 1);
          return;
        }
        const kind = payload.freshness?.kind;
        const finalize = () => {
          if (kind === 'stub') {
            replaceById(streamingId, { id: streamingId, type: 'stub', props: { body: accumulated, steps } });
          } else if (kind === 'degraded') {
            replaceById(streamingId, {
              id: streamingId,
              type: 'degraded',
              props: { body: accumulated, correlationId: payload.turn_id?.slice(0, 8) || 'unknown', onRetry: () => sendMessage(text, lang), steps },
            });
          } else {
            replaceById(streamingId, {
              id: streamingId,
              type: 'agent',
              props: {
                agentKey: payload.agent,
                freshness: { kind: 'live', label: payload.freshness?.label || 'Live' },
                body: accumulated,
                sources: (payload.sources || []).map((s) => s.label),
                langBadge: lang === 'EN' ? undefined : lang,
                steps,
                followUps: payload.follow_ups || [],
                onPickFollowUp: (q) => sendMessage(q, lang),
                onSourceClick: (label) => sendMessage(`What's the current status of ${label}?`, lang),
                onRepoll: () => sendMessage(text, lang),
              },
            });
          }
          if (!open) setUnread((u) => u + 1);
        };

        if (revealed >= accumulated.length) {
          finalize();
        } else {
          pendingFinalize = finalize;
        }
      },
      onError: (err) => {
        pushLiveStep({ phase: 'error' }, 5000);
        replaceById(streamingId, {
          id: streamingId,
          type: 'degraded',
          props: { body: `Couldn't reach the chatbot API (${err.message}). Is aksha-chatbot-api running on :8010?`, correlationId: 'connection', onRetry: () => sendMessage(text, lang) },
        });
      },
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#e9ebee', position: 'relative' }}>
      <Box sx={{ p: 4, maxWidth: 1020 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography sx={{ font: `700 10px/1 ${font.mono}`, letterSpacing: '0.08em', textTransform: 'uppercase', color: color.neutral600, mb: 1 }}>
              Aksha · UI test harness · not the production dashboard
            </Typography>
            <Typography sx={{ font: `800 28px/1.2 ${font.heading}`, mb: 1.5 }}>Operator dashboard (stand-in)</Typography>
          </Box>
          <Box sx={{ pt: '2px' }}>
            <ModeToggle mode={mode} onModeChange={setMode} />
          </Box>
        </Stack>
        <Typography sx={{ font: `400 14px/1.6 ${font.body}`, color: color.neutral700, mb: 3 }}>
          This page stands in for the real Aksha operator dashboard so the chatbot panel can be reviewed and tested
          in isolation. The seeded messages above the composer are scripted design-spec examples; anything you type
          below them is a real call to <code>aksha-chatbot-api</code> at :8010. Press <b>Alt+K</b> to toggle the panel.
          Demo/Live above switches the chat transcript source — it's a test-harness control, not part of the
          shipped chatbot.
        </Typography>
        <ProcessingGraph
          mode={mode}
          liveStep={mode === 'live' ? liveStep : null}
          liveAgent={mode === 'live' ? liveAgent : null}
          liveTools={mode === 'live' ? liveTools : []}
        />
        <Box sx={{ border: `2px dashed ${color.neutral400}`, borderRadius: 0, p: 4, mt: 3, color: color.neutral500, textAlign: 'center', font: `500 13px/1.5 ${font.body}` }}>
          Camera grid / alert tables would render here in the real dashboard.
        </Box>
      </Box>

      {!open && <ChatLauncher unreadCount={unread} onOpen={openPanel} />}
      <ChatPanel
        open={open}
        onClose={closePanel}
        messages={messages}
        scope={scope}
        onClear={() => setScope([])}
        onRemoveScope={(s) => setScope((sc) => sc.filter((x) => x.label !== s.label))}
        onSend={sendMessage}
        onPickSuggestion={(q) => sendMessage(q)}
        onClarificationSelect={(opt) => sendMessage(opt.label)}
        sessions={sessions}
        activeThreadId={threadId}
        onSelectSession={selectSession}
        onNewChat={startNewChat}
        onDeleteSession={removeSession}
      />
    </Box>
  );
}
