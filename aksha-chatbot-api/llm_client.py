"""
Provider-switchable LLM client for the Aksha chatbot.

Swaps between Groq (cloud, free developer tier) and Ollama (local, always free)
based on the CHATBOT_MODEL_PROVIDER env var, per Section 8.2 of
docs/CHATBOT_SYSTEM_ARCHITECTURE.md. Both providers speak the same
messages/tools shape, so callers never need to know which one is active.
"""

import os
from collections.abc import Iterator
from dataclasses import dataclass, field
from typing import Any

from dotenv import load_dotenv

load_dotenv()


@dataclass
class ChatResult:
    content: str | None
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    raw: Any = None


class LLMClient:
    def __init__(self, provider: str | None = None):
        self.provider = (provider or os.getenv("CHATBOT_MODEL_PROVIDER", "ollama")).lower()
        if self.provider not in ("groq", "ollama"):
            raise ValueError(f"Unknown CHATBOT_MODEL_PROVIDER: {self.provider!r} (expected 'groq' or 'ollama')")

    def chat(self, messages: list[dict[str, str]], tools: list[dict[str, Any]] | None = None) -> ChatResult:
        if self.provider == "groq":
            return self._chat_groq(messages, tools)
        return self._chat_ollama(messages, tools)

    def stream_chat(self, messages: list[dict[str, str]]) -> Iterator[str]:
        """Yield text deltas as they arrive. No tools — this is for the
        formatter's final prose pass, not tool-calling turns."""
        if self.provider == "groq":
            yield from self._stream_groq(messages)
        else:
            yield from self._stream_ollama(messages)

    def _stream_groq(self, messages) -> Iterator[str]:
        from groq import Groq

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set (check .env)")
        client = Groq(api_key=api_key)
        model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        stream = client.chat.completions.create(model=model, messages=messages, stream=True)
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    def _stream_ollama(self, messages) -> Iterator[str]:
        from ollama import Client

        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        model = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
        client = Client(host=base_url)
        for chunk in client.chat(model=model, messages=messages, stream=True):
            delta = chunk["message"].get("content")
            if delta:
                yield delta

    def _chat_groq(self, messages, tools) -> ChatResult:
        from groq import Groq

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set (check .env)")

        client = Groq(api_key=api_key)
        model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        resp = client.chat.completions.create(model=model, messages=messages, tools=tools)
        choice = resp.choices[0].message
        tool_calls = [
            {"id": tc.id, "name": tc.function.name, "arguments": tc.function.arguments}
            for tc in (choice.tool_calls or [])
        ]
        return ChatResult(content=choice.content, tool_calls=tool_calls, raw=resp)

    def _chat_ollama(self, messages, tools) -> ChatResult:
        from ollama import Client

        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        model = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

        client = Client(host=base_url)
        resp = client.chat(model=model, messages=messages, tools=tools)
        message = resp["message"]
        tool_calls = [
            {"id": None, "name": tc["function"]["name"], "arguments": tc["function"]["arguments"]}
            for tc in (message.get("tool_calls") or [])
        ]
        return ChatResult(content=message.get("content"), tool_calls=tool_calls, raw=resp)


if __name__ == "__main__":
    import sys

    provider = sys.argv[1] if len(sys.argv) > 1 else None
    client = LLMClient(provider)
    result = client.chat([{"role": "user", "content": "Reply with exactly one word: pong"}])
    print(f"provider={client.provider}")
    print(f"content={result.content!r}")
