"""Structured logging setup using structlog."""

import logging
import sys
from typing import Any

import structlog


def _compact_renderer(logger, name, event_dict):
    """
    Custom compact renderer for clean, colorful, readable logs.
    
    Format: [LEVEL] event.name | key=value key2=value2
    """
    # ANSI color codes
    COLORS = {
        "DEBUG": "\033[36m",     # Cyan
        "INFO": "\033[32m",      # Green
        "WARNING": "\033[33m",   # Yellow
        "ERROR": "\033[31m",     # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    
    # Get log level
    level = event_dict.pop("level", "info").upper()
    
    # Get event name
    event = event_dict.pop("event", "")
    
    # Get logger name (module path) - we'll skip displaying it for cleaner output
    logger_name = event_dict.pop("logger", "")
    
    # Remove timestamp and other metadata we don't need in compact mode
    event_dict.pop("timestamp", None)
    
    # Color for this log level
    level_color = COLORS.get(level, "")
    
    # Build the log message with colors
    level_str = f"{level_color}{BOLD}[{level}]{RESET}"
    event_str = f"{BOLD}{event}{RESET}"
    
    parts = [level_str, event_str]
    
    # Add context key-value pairs with subtle coloring
    if event_dict:
        kv_pairs = " ".join(
            f"{DIM}{k}={RESET}{v!r}" if not isinstance(v, (int, float, bool)) 
            else f"{DIM}{k}={RESET}{v}" 
            for k, v in sorted(event_dict.items())
        )
        parts.append(f"{DIM}|{RESET} {kv_pairs}")
    
    return " ".join(parts)


def configure_logging(log_level: str = "INFO", json_logs: bool = False) -> None:
    """
    Configure structured logging for the application.

    Args:
        log_level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_logs: If True, output logs in JSON format
    """
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper()),
    )
    
    # Silence noisy third-party loggers
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
    logging.getLogger("asyncpraw").setLevel(logging.WARNING)
    logging.getLogger("prawcore").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    # Configure structlog processors
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    if json_logs:
        # JSON output for production
        processors.append(structlog.processors.JSONRenderer())
    else:
        # Compact, readable console output for development
        processors.append(_compact_renderer)

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str | None = None) -> Any:
    """
    Get a logger instance.

    Args:
        name: Logger name (usually __name__ of the module)

    Returns:
        Structured logger instance
    """
    return structlog.get_logger(name)


def bind_context(**kwargs: Any) -> None:
    """
    Bind context variables to the logger.

    Args:
        **kwargs: Key-value pairs to add to log context
    """
    structlog.contextvars.bind_contextvars(**kwargs)


def clear_context() -> None:
    """Clear all context variables from the logger."""
    structlog.contextvars.clear_contextvars()

