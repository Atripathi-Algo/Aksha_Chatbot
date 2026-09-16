"""
In-memory per-thread conversation history — Phase 0 storage, same
not-restart-safe tradeoff as app/graph.py's MemorySaver checkpointer.

Both chat entry points (main.py's /v1/chat/stream, which calls route()/
run_agent() directly, and graph.py's /v1/chat/invoke, which calls the same
functions from its nodes) load history from here and append to it after a
turn resolves, so a follow-up question in the same thread has the prior
exchange as context regardless of which endpoint served it.
"""

from collections import OrderedDict

MAX_THREADS = 500  # bound total memory; oldest thread evicted past this
MAX_TURNS_PER_THREAD = 4  # user+assistant exchanges kept per thread

_history: "OrderedDict[str, list[dict]]" = OrderedDict()


def get_history(thread_id: str) -> list[dict]:
    """Returns a copy — callers may safely extend it without mutating storage."""
    return list(_history.get(thread_id, []))


def append_turn(thread_id: str, user_text: str, assistant_text: str) -> None:
    if not user_text or not assistant_text:
        return
    turns = _history.setdefault(thread_id, [])
    turns.append({"role": "user", "content": user_text})
    turns.append({"role": "assistant", "content": assistant_text})
    del turns[: max(0, len(turns) - MAX_TURNS_PER_THREAD * 2)]
    _history.move_to_end(thread_id)
    while len(_history) > MAX_THREADS:
        _history.popitem(last=False)
