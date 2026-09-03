// Client for aksha-chatbot-api's SSE endpoint. EventSource doesn't support
// POST bodies, so this parses the text/event-stream format directly off a
// fetch() ReadableStream.

// `??` (not `||`) so a Docker build can bake in an explicit empty string —
// meaning "same origin, let the reverse proxy route /v1/*" — without that
// falling back to the dev default the way `''  || fallback` would.
const API_BASE = import.meta.env.VITE_CHATBOT_API_URL ?? 'http://localhost:8010';

// callbacks: { onRouted(agent), onThinking({phase, ...}), onToken(text), onClarification({question, options}), onDone({status, agent, sources, freshness}), onError(err) }
export async function streamChat(threadId, userQuery, language, callbacks) {
  let response;
  try {
    response = await fetch(`${API_BASE}/v1/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_id: threadId, user_query: userQuery, language: (language || 'en').toLowerCase() }),
    });
  } catch (err) {
    callbacks.onError?.(err);
    return;
  }

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
