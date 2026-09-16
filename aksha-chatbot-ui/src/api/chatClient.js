// Client for aksha-chatbot-api's SSE endpoint. EventSource doesn't support
// POST bodies, so this parses the text/event-stream format directly off a
// fetch() ReadableStream.

// `??` (not `||`) so a Docker build can bake in an explicit empty string —
// meaning "same origin, let the reverse proxy route /v1/*" — without that
// falling back to the dev default the way `''  || fallback` would.
const API_BASE = import.meta.env.VITE_CHATBOT_API_URL ?? 'http://localhost:8010';

// callbacks: { onRouted(agent), onThinking({phase, ...}), onToken(text), onClarification({question, options}), onDone({status, agent, sources, freshness}), onError(err) }
//
// Audit finding (second pass, 2026-09-16): this used to have no cancellation
// path and no error handling around the read loop itself — only the initial
// fetch() was wrapped in try/catch. A connection reset, proxy timeout, or
// server restart mid-stream rejected reader.read() unhandled, so onError
// never fired and the caller had no way to know the stream had died. Now
// returns an abort() function so a caller (App.jsx) can cancel a superseded
// turn instead of leaving it to run to completion (or hang) in the
// background, and the whole read loop is inside the same try/catch as the
// fetch so a mid-stream failure reaches onError exactly like a failed fetch
// does.
export function streamChat(threadId, userQuery, language, callbacks) {
  const controller = new AbortController();

  (async () => {
    let response;
    try {
      response = await fetch(`${API_BASE}/v1/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: threadId, user_query: userQuery, language: (language || 'en').toLowerCase() }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        callbacks.onError?.(new Error(`Chatbot API returned ${response.status}`));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line.
        let boundary;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          dispatchFrame(frame, callbacks);
        }
      }
    } catch (err) {
      // An abort() call (superseded by a new send, or the panel closing)
      // rejects here too — that's an intentional cancellation, not a real
      // failure, so it must not surface as an error bubble.
      if (err?.name === 'AbortError') return;
      callbacks.onError?.(err);
    }
  })();

  return { abort: () => controller.abort() };
}

function dispatchFrame(frame, callbacks) {
  let eventName = 'message';
  let dataLine = '';
  for (const line of frame.split('\n')) {
    if (line.startsWith('event: ')) eventName = line.slice(7).trim();
    else if (line.startsWith('data: ')) dataLine = line.slice(6);
  }
  if (!dataLine) return;

  let payload;
  try {
    payload = JSON.parse(dataLine);
  } catch {
    return;
  }

  switch (eventName) {
    case 'routed':
      callbacks.onRouted?.(payload.agent);
      break;
    case 'thinking':
      callbacks.onThinking?.(payload);
      break;
    case 'token':
      callbacks.onToken?.(payload.text);
      break;
    case 'clarification':
      callbacks.onClarification?.(payload);
      break;
    case 'done':
      callbacks.onDone?.(payload);
      break;
    default:
      break;
  }
}
