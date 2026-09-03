"""
structlog setup — see docs/CHATBOT_SYSTEM_ARCHITECTURE.md Section 6.1.
Binds thread_id/turn_id via contextvars so every log line inside a request
carries them automatically, without threading them through every call.
"""

import logging
import sys

import structlog


def configure_logging(json_output: bool = False) -> None:
    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=logging.INFO)

    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
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
