// Recent-chats persistence. There's no backend auth/session store yet
// (Section 0.3 — no authentication during development) and the backend's
// own LangGraph checkpointer is in-memory only (Section 9e "still open"),
// so this lives entirely in the browser: per-device, not per-operator, and
// gone if localStorage is cleared. Good enough for a dev/test harness;
// swap for a real backend-backed history once auth/persistence land.

const STORAGE_KEY = 'aksha_chat_history_v1';
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
    // Storage full or unavailable (private browsing, etc.) — recent chats
    // just won't persist this session; not worth surfacing as an error.
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
