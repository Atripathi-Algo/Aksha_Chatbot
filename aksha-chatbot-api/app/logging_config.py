"""
structlog setup — see docs/CHATBOT_SYSTEM_ARCHITECTURE.md Section 6.1.
Binds thread_id/turn_id via contextvars so every log line inside a request
carries them automatically, without threading them through every call.
"""

import logging
import re
import sys

import structlog

# Basic PII redaction (Section 5.1/6.1's "unrestricted personal data" gap) —
# a regex scrubber, not a full PII-detection model. Deliberately scoped to
# emails and phone numbers, the two kinds an operator is most likely to type
# straight into a chat query (which several call sites log verbatim, e.g.
# main.py's "turn_start" event) or that could appear inside tool-result data.
# The phone pattern requires at least one separator between digit groups
# rather than matching 10 bare digits — a bare-digit match would also catch
# runs inside Mongo ObjectIds, UUIDs, and token counts, silently corrupting
# useful log data for a false-positive "PII" match.
_EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
_PHONE_RE = re.compile(r"(?<!\d)(?:\+?\d{1,3}[-.\s])?\(?\d{3}\)?[-.\s]\d{3}[-.\s]?\d{4}(?!\d)")


def _redact_text(value: str) -> str:
    value = _EMAIL_RE.sub("[redacted-email]", value)
    value = _PHONE_RE.sub("[redacted-phone]", value)
    return value


def _redact_value(value):
    if isinstance(value, str):
        return _redact_text(value)
    if isinstance(value, dict):
        return {k: _redact_value(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_redact_value(v) for v in value]
    return value


def _redact_pii(logger, method_name, event_dict):
    for key, value in event_dict.items():
        event_dict[key] = _redact_value(value)
    return event_dict


def configure_logging(json_output: bool = False) -> None:
    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=logging.INFO)

    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        _redact_pii,
    ]

    structlog.configure(
        processors=shared_processors
        + [
            structlog.processors.JSONRenderer()
            if json_output
            else structlog.dev.ConsoleRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(**initial_context):
    return structlog.get_logger(**initial_context)


def bind_turn_context(thread_id: str, turn_id: str, **extra) -> None:
    structlog.contextvars.bind_contextvars(thread_id=thread_id, turn_id=turn_id, **extra)


def clear_turn_context() -> None:
    structlog.contextvars.clear_contextvars()
