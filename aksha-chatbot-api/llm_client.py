"""
Provider-switchable LLM client for the Aksha chatbot.

Swaps between Gemini, Groq, and Ollama
based on the CHATBOT_MODEL_PROVIDER env var, per Section 8.2 of
docs/CHATBOT_SYSTEM_ARCHITECTURE.md. Both providers speak the same
messages/tools shape, so callers never need to know which one is active.
"""

import os
import threading
import time
from collections.abc import Iterator
from dataclasses import dataclass, field
from typing import Any, Literal

from dotenv import load_dotenv
from langsmith import traceable

from app.cost_tracker import record_call

load_dotenv()

# Optional tracing (Section 6.1: "LangSmith or Arize Phoenix may be enabled
# for development and evaluation with redaction"). @traceable is a safe
# no-op unless LANGSMITH_TRACING=true and LANGSMITH_API_KEY are set — it
# doesn't need a LangChain-wrapped client to work, so decorating these two
# dispatch methods captures every real LLM call this service makes,
# regardless of provider, without touching call sites. Deliberately NOT
# relying on LangGraph's own auto-instrumentation for this: that only covers
# graph.invoke() (the /v1/chat/invoke path), and the frontend's real traffic
# goes through /v1/chat/stream, which calls these methods directly and
# never runs through the compiled graph at all (see app/graph.py's
# module docstring).

Tier = Literal["strong", "cheap"]

# Section 4.6's recommendation, applied: router and formatter calls fire on
# *every* turn regardless of complexity and need no deep reasoning (forced
# tool-call classification, templated prose) — Section 4.5 #2 calls tiering
# them to a small/cheap model "the single highest-leverage change available".
# Domain-worker tool-calling reasoning (app/agent_executor.py) stays on the
# strong model, requested explicitly rather than relying on this default, so
# a reader doesn't have to trace the call site back here to know which tier
# a given call uses.
_DEFAULT_TIER: Tier = "strong"


def _resolve_model(prefix: str, tier: Tier, strong_default: str, cheap_default: str | None = None) -> str:
    """cheap_default=None means "same model as strong unless overridden" —
    the right default for Ollama, where a cheap tier only helps if a second,
    genuinely smaller model is actually pulled locally; forcing a different
    model name nobody pulled would just break every cheap-tier call."""
    strong = os.getenv(f"{prefix}_MODEL", strong_default)
    if tier == "cheap":
        return os.getenv(f"{prefix}_MODEL_CHEAP", cheap_default or strong)
    return strong


def _estimate_tokens(text: str) -> int:
    """Rough fallback only — used when a provider's streaming response
    doesn't report exact usage (see _stream_ollama). ~0.75 words/token is
    the commonly-cited ratio for English prose; good enough for a cost
    *estimate* on an unpriced-by-default call, not for billing precision."""
    return max(1, round(len(text.split()) / 0.75))


def _estimate_prompt_tokens(messages: list[dict[str, str]]) -> int:
    return _estimate_tokens(" ".join(str(m.get("content", "")) for m in messages))


@dataclass
class ChatResult:
    content: str | None
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    raw: Any = None


# Provider SDK clients are expensive to open (each wraps its own pooled HTTP
# client, so a fresh instance means a fresh TCP+TLS handshake) and safe to
# share — reuse one per provider across every call in the process instead of
# constructing one per LLM call. Lazy + lock-guarded because FastAPI runs
# sync endpoints in a thread pool, so first use can race across threads.
_client_lock = threading.Lock()
_gemini_client = None
_groq_client = None
_ollama_client = None

# Audit finding (second pass, 2026-09-16): none of the three provider clients
# passed a timeout, so a stalled provider held the request open indefinitely —
# on the streaming path that meant an SSE connection (and a FastAPI worker
# thread) stuck open for as long as nginx's own read timeout allowed (3600s
# in aksha-chatbot-ui/nginx.conf), with the UI stuck on "thinking…" the whole
# time. This bounds it at the client level, well under that ceiling, so a
# stalled call fails fast with a real error instead of hanging near an hour.
LLM_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", "60"))


def _get_gemini_client():
    global _gemini_client
    if _gemini_client is None:
        with _client_lock:
            if _gemini_client is None:
                from openai import OpenAI

                api_key = os.getenv("GEMINI_API_KEY")
                if not api_key:
                    raise RuntimeError("GEMINI_API_KEY is not set (check chatbot.env)")
                _gemini_client = OpenAI(
                    api_key=api_key,
                    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                    timeout=LLM_TIMEOUT_SECONDS,
                )
    return _gemini_client


def _get_groq_client():
    global _groq_client
    if _groq_client is None:
        with _client_lock:
            if _groq_client is None:
                from groq import Groq

                api_key = os.getenv("GROQ_API_KEY")
                if not api_key:
                    raise RuntimeError("GROQ_API_KEY is not set (check .env)")
                _groq_client = Groq(api_key=api_key, timeout=LLM_TIMEOUT_SECONDS)
    return _groq_client


def _get_ollama_client():
    global _ollama_client
    if _ollama_client is None:
        with _client_lock:
            if _ollama_client is None:
                from ollama import Client

                base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
                _ollama_client = Client(host=base_url, timeout=LLM_TIMEOUT_SECONDS)
    return _ollama_client


class LLMClient:
    def __init__(self, provider: str | None = None):
        self.provider = (provider or os.getenv("CHATBOT_MODEL_PROVIDER", "ollama")).lower()
        if self.provider not in ("gemini", "groq", "ollama"):
            raise ValueError(f"Unknown CHATBOT_MODEL_PROVIDER: {self.provider!r} (expected 'gemini', 'groq', or 'ollama')")

    @traceable(run_type="llm", name="LLMClient.chat")
    def chat(
        self,
        messages: list[dict[str, str]],
        tools: list[dict[str, Any]] | None = None,
        tier: Tier = _DEFAULT_TIER,
        node: str = "",
    ) -> ChatResult:
        if self.provider == "gemini":
            return self._chat_gemini(messages, tools, tier, node)
        if self.provider == "groq":
            return self._chat_groq(messages, tools, tier, node)
        return self._chat_ollama(messages, tools, tier, node)

    @traceable(run_type="llm", name="LLMClient.stream_chat")
    def stream_chat(self, messages: list[dict[str, str]], tier: Tier = _DEFAULT_TIER, node: str = "") -> Iterator[str]:
        """Yield text deltas as they arrive. No tools — this is for the
        formatter's final prose pass, not tool-calling turns."""
        if self.provider == "gemini":
            yield from self._stream_gemini(messages, tier, node)
        elif self.provider == "groq":
            yield from self._stream_groq(messages, tier, node)
        else:
            yield from self._stream_ollama(messages, tier, node)

    def _stream_groq(self, messages, tier: Tier, node: str) -> Iterator[str]:
        client = _get_groq_client()
        model = _resolve_model("GROQ", tier, "openai/gpt-oss-120b", "openai/gpt-oss-20b")
        start = time.perf_counter()
        # stream_options.include_usage asks the OpenAI-compatible endpoint to
        # append one final chunk carrying exact usage, with an empty
        # choices list — real counts, not the word-count fallback below.
        stream = client.chat.completions.create(
            model=model, messages=messages, stream=True, stream_options={"include_usage": True}
        )
        usage = None
        for chunk in stream:
            if getattr(chunk, "usage", None):
                usage = chunk.usage
            if chunk.choices:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        if usage:
            duration_ms = round((time.perf_counter() - start) * 1000)
            record_call("groq", model, tier, node, usage.prompt_tokens, usage.completion_tokens, duration_ms=duration_ms)

    def _stream_gemini(self, messages, tier: Tier, node: str) -> Iterator[str]:
        client = _get_gemini_client()
        model = _resolve_model("GEMINI", tier, "gemini-3.6-flash", "gemini-flash-lite-latest")
        start = time.perf_counter()
        stream = client.chat.completions.create(
            model=model, messages=messages, stream=True, stream_options={"include_usage": True}
        )
        usage = None
        for chunk in stream:
            if getattr(chunk, "usage", None):
                usage = chunk.usage
            if chunk.choices:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        if usage:
            duration_ms = round((time.perf_counter() - start) * 1000)
            record_call("gemini", model, tier, node, usage.prompt_tokens, usage.completion_tokens, duration_ms=duration_ms)

    def _stream_ollama(self, messages, tier: Tier, node: str) -> Iterator[str]:
        client = _get_ollama_client()
        model = _resolve_model("OLLAMA", tier, "llama3.1:8b")
        start = time.perf_counter()
        collected = []
        prompt_tokens = completion_tokens = None
        for chunk in client.chat(model=model, messages=messages, stream=True):
            delta = chunk["message"].get("content")
            if delta:
                collected.append(delta)
                yield delta
            if chunk.get("done"):
                prompt_tokens = chunk.get("prompt_eval_count")
                completion_tokens = chunk.get("eval_count")
        # Ollama's final chunk usually carries real counts; fall back to a
        # word-count estimate only if it didn't (older server versions).
        estimated = prompt_tokens is None or completion_tokens is None
        duration_ms = round((time.perf_counter() - start) * 1000)
        record_call(
            "ollama", model, tier, node,
            prompt_tokens if prompt_tokens is not None else _estimate_prompt_tokens(messages),
            completion_tokens if completion_tokens is not None else _estimate_tokens("".join(collected)),
            tokens_estimated=estimated,
            duration_ms=duration_ms,
        )

    def _chat_groq(self, messages, tools, tier: Tier, node: str) -> ChatResult:
        client = _get_groq_client()
        model = _resolve_model("GROQ", tier, "openai/gpt-oss-120b", "openai/gpt-oss-20b")
        start = time.perf_counter()
        resp = client.chat.completions.create(model=model, messages=messages, tools=tools)
        duration_ms = round((time.perf_counter() - start) * 1000)
        choice = resp.choices[0].message
        tool_calls = [
            {"id": tc.id, "name": tc.function.name, "arguments": tc.function.arguments}
            for tc in (choice.tool_calls or [])
        ]
        if getattr(resp, "usage", None):
            record_call("groq", model, tier, node, resp.usage.prompt_tokens, resp.usage.completion_tokens, duration_ms=duration_ms)
        return ChatResult(content=choice.content, tool_calls=tool_calls, raw=resp)

    def _chat_gemini(self, messages, tools, tier: Tier, node: str) -> ChatResult:
        client = _get_gemini_client()
        model = _resolve_model("GEMINI", tier, "gemini-3.6-flash", "gemini-flash-lite-latest")
        start = time.perf_counter()
        resp = client.chat.completions.create(model=model, messages=messages, tools=tools)
        duration_ms = round((time.perf_counter() - start) * 1000)
        choice = resp.choices[0].message
        tool_calls = [
            {"id": tc.id, "name": tc.function.name, "arguments": tc.function.arguments}
            for tc in (choice.tool_calls or [])
        ]
        if getattr(resp, "usage", None):
            record_call("gemini", model, tier, node, resp.usage.prompt_tokens, resp.usage.completion_tokens, duration_ms=duration_ms)
        return ChatResult(content=choice.content, tool_calls=tool_calls, raw=resp)

    def check_reachable(self) -> tuple[bool, str]:
        """Audit finding (second pass, 2026-09-16): /v1/health/ready reported
        healthy unconditionally — it never actually contacted the configured
        provider, so a wrong OLLAMA_BASE_URL (localhost inside a container
        points at the container itself, not the host) or a bad API key
        produced two "healthy" containers in which every turn failed. Uses
        each provider's cheap metadata listing, never a real generation call,
        so this is safe to run on every health check tick."""
        try:
            if self.provider == "gemini":
                _get_gemini_client().models.list()
            elif self.provider == "groq":
                _get_groq_client().models.list()
            else:
                _get_ollama_client().list()
            return True, "ok"
        except Exception as e:
            return False, str(e)

    def _chat_ollama(self, messages, tools, tier: Tier, node: str) -> ChatResult:
        client = _get_ollama_client()
        model = _resolve_model("OLLAMA", tier, "llama3.1:8b")
        start = time.perf_counter()
        resp = client.chat(model=model, messages=messages, tools=tools)
        duration_ms = round((time.perf_counter() - start) * 1000)
        message = resp["message"]
        tool_calls = [
            {"id": None, "name": tc["function"]["name"], "arguments": tc["function"]["arguments"]}
            for tc in (message.get("tool_calls") or [])
        ]
        prompt_tokens = resp.get("prompt_eval_count")
        completion_tokens = resp.get("eval_count")
        estimated = prompt_tokens is None or completion_tokens is None
        record_call(
            "ollama", model, tier, node,
            prompt_tokens if prompt_tokens is not None else _estimate_prompt_tokens(messages),
            completion_tokens if completion_tokens is not None else _estimate_tokens(message.get("content") or ""),
            tokens_estimated=estimated,
            duration_ms=duration_ms,
        )
        return ChatResult(content=message.get("content"), tool_calls=tool_calls, raw=resp)


if __name__ == "__main__":
    import sys

    provider = sys.argv[1] if len(sys.argv) > 1 else None
    client = LLMClient(provider)
    result = client.chat([{"role": "user", "content": "Reply with exactly one word: pong"}])
    print(f"provider={client.provider}")
    print(f"content={result.content!r}")
