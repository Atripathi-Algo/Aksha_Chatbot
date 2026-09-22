// Recent-chats persistence for the Aksha Assistant widget. There's no
// backend session store (no auth, and app/conversation_store.py's own
// per-thread memory is in-memory-only, capped at 500 threads/4 turns and
// gone on a backend restart — see its docstring), so a conversation is only
// ever recoverable from here: per-browser, per-device, gone if the user
// clears site data. Same tradeoff and same shape as aksha-chatbot-ui's
// data/chatHistory.js — ported here because this widget, not that one, is
// the real embedded product surface.

const STORAGE_KEY = "aksha_chatbot_widget_sessions_v1";
const MAX_SESSIONS = 20;

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  } catch {
    // Storage full, disabled, or unavailable (private browsing) — recent
    // chats just won't persist this session; not worth surfacing as an error.
  }
}

export function listSessions() {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

// Upserts by threadId. `title` is only set the first time (from the first
// operator message) so it doesn't keep changing as the conversation grows.
export function saveSession(threadId, title, messages, updatedAt) {
  const sessions = readAll();
  const existing = sessions.find((s) => s.threadId === threadId);
  if (existing) {
    existing.messages = messages;
    existing.updatedAt = updatedAt;
  } else {
    sessions.push({ threadId, title, messages, updatedAt });
  }
  writeAll(sessions);
}

export function deleteSession(threadId) {
  writeAll(readAll().filter((s) => s.threadId !== threadId));
}
