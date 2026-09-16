"""
Per-call cost/budget tracking — Section 4.5 #8 / Section 5.3 / Section 8.2:
"Ship per-tenant budgets with Phase 0, not later... CHATBOT_DAILY_COST_LIMIT
and the 70/90/100% budget alerts are the backstop against a single noisy
tenant or a retry loop... this is what tells you which of the seven Phase 1
agents is actually expensive in production, rather than guessing."

Scoped down from that design the same way conversation_store.py and the
MemorySaver checkpointer already are: in-memory (resets on restart) and NOT
per-tenant — Section 5.6's audit found there is no tenant_id anywhere in
this system yet (the JWT carries only siteId and a single role string), so
"per-tenant budgets" isn't buildable until that gap closes. This is one
process-wide daily counter, not N per-tenant ones.

Per-token dollar rates are NOT invented here. Groq's tracked models are on
a free, unmetered developer tier (Section 4.6) and Ollama is always local —
$0 is the accurate, verified default for both. Gemini's real per-token rate
is not independently verified anywhere in this codebase, so it also
defaults to $0 (tracked honestly as "unpriced", not silently wrong) until an
operator fills in a real rate from their own Google AI Studio billing page
via the *_COST_PER_1M_* env vars below — same principle this project
already applies everywhere else (never invent a fact you can't verify),
applied here to dollar figures instead of alert data.

Token COUNTS are exact whenever a provider's response reports them; a
streamed call that doesn't (see llm_client.py's fallback estimator) is
still recorded, but flagged tokens_estimated=True so a reader never mistakes
an estimate for a metered count.
"""

import os
import threading
from dataclasses import dataclass, field
from datetime import date

from app.logging_config import get_logger

logger = get_logger(component="cost_tracker")

DAILY_COST_LIMIT = float(os.getenv("CHATBOT_DAILY_COST_LIMIT", "0") or 0)
_ALERT_THRESHOLDS = (0.7, 0.9, 1.0)


def _rate(provider: str, model: str, kind: str) -> float:
    """kind is 'input' or 'output'. Env var shape:
    <PROVIDER>_COST_PER_1M_<INPUT|OUTPUT>_<sanitized model name> first,
    falling back to a provider-wide <PROVIDER>_COST_PER_1M_<INPUT|OUTPUT>,
    falling back to 0.0 (unpriced) — see module docstring for why 0.0 is a
    labeled default here, not a guess."""
    sanitized = "".join(c if c.isalnum() else "_" for c in model.upper())
    provider_u = provider.upper()
    specific = os.getenv(f"{provider_u}_COST_PER_1M_{kind.upper()}_{sanitized}")
    if specific is not None:
        return float(specific)
    general = os.getenv(f"{provider_u}_COST_PER_1M_{kind.upper()}")
    if general is not None:
        return float(general)
    return 0.0


@dataclass
class _DailyTotals:
    day: date = field(default_factory=date.today)
    cost: float = 0.0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    calls: int = 0
    alerted: set = field(default_factory=set)  # thresholds already logged today


_lock = threading.Lock()
_totals = _DailyTotals()


def _rollover_if_new_day() -> None:
    today = date.today()
    if _totals.day != today:
        _totals.day = today
        _totals.cost = 0.0
        _totals.prompt_tokens = 0
        _totals.completion_tokens = 0
        _totals.calls = 0
        _totals.alerted.clear()


def record_call(
    provider: str,
    model: str,
    tier: str,
    node: str,
    prompt_tokens: int,
    completion_tokens: int,
    tokens_estimated: bool = False,
    duration_ms: int | None = None,
) -> float:
    """Log this call's usage/cost (Section 6.1's "Input/output token counts.
    Estimated cost." trace attributes) and fold it into today's running
    total. Returns this call's own estimated cost in dollars (0.0 if
    unpriced)."""
    input_cost = (prompt_tokens / 1_000_000) * _rate(provider, model, "input")
    output_cost = (completion_tokens / 1_000_000) * _rate(provider, model, "output")
    call_cost = input_cost + output_cost

    with _lock:
        _rollover_if_new_day()
        _totals.cost += call_cost
        _totals.prompt_tokens += prompt_tokens
        _totals.completion_tokens += completion_tokens
        _totals.calls += 1
        daily_cost = _totals.cost
        daily_calls = _totals.calls
        newly_crossed = []
        if DAILY_COST_LIMIT > 0:
            pct = daily_cost / DAILY_COST_LIMIT
            for threshold in _ALERT_THRESHOLDS:
                if pct >= threshold and threshold not in _totals.alerted:
                    _totals.alerted.add(threshold)
                    newly_crossed.append(threshold)

    logger.info(
        "llm_call_cost",
        provider=provider,
        model=model,
        tier=tier,
        node=node,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        tokens_estimated=tokens_estimated,
        duration_ms=duration_ms,
        call_cost_usd=round(call_cost, 6),
        daily_cost_usd=round(daily_cost, 6),
        daily_budget_usd=DAILY_COST_LIMIT or None,
    )

    # Logged once per threshold per day, outside the lock — alerting is a
    # side effect of crossing a line, not something that needs to serialize
    # with the counters themselves.
    for threshold in newly_crossed:
        logger.warning(
            "daily_cost_budget_alert",
            threshold_pct=int(threshold * 100),
            daily_cost_usd=round(daily_cost, 6),
            daily_budget_usd=DAILY_COST_LIMIT,
            daily_calls=daily_calls,
        )

    return call_cost


def get_daily_summary() -> dict:
    """Read-only snapshot — used by /v1/health/ready for at-a-glance
    visibility without standing up a separate dashboard (Section 6.1's
    dashboards are design only; this is the Phase-0-scale substitute)."""
    with _lock:
        _rollover_if_new_day()
        return {
            "date": _totals.day.isoformat(),
            "calls": _totals.calls,
            "prompt_tokens": _totals.prompt_tokens,
            "completion_tokens": _totals.completion_tokens,
            "cost_usd": round(_totals.cost, 6),
            "budget_usd": DAILY_COST_LIMIT or None,
            "budget_pct": round((_totals.cost / DAILY_COST_LIMIT) * 100, 1) if DAILY_COST_LIMIT > 0 else None,
        }
