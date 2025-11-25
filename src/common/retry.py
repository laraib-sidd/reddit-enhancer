"""Retry decorators and utilities using tenacity."""

from typing import Any, Callable, TypeVar
from functools import wraps

from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
    after_log,
)

from src.common.logging import get_logger
from src.common.exceptions import (
    RedditAPIError,
    AIGenerationError,
    DatabaseError,
    RateLimitError,
)

logger = get_logger(__name__)

T = TypeVar("T")


def retry_on_api_error(
    max_attempts: int = 3,
    min_wait: int = 1,
    max_wait: int = 60,
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """
    Retry decorator for API calls with exponential backoff.

    Args:
        max_attempts: Maximum number of retry attempts
        min_wait: Minimum wait time in seconds
        max_wait: Maximum wait time in seconds

    Returns:
        Decorated function with retry logic
    """

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @retry(
            stop=stop_after_attempt(max_attempts),
            wait=wait_exponential(multiplier=1, min=min_wait, max=max_wait),
            retry=retry_if_exception_type(
                (RedditAPIError, AIGenerationError, DatabaseError, ConnectionError)
            ),
            before_sleep=before_sleep_log(logger, "INFO"),
            after=after_log(logger, "INFO"),
        )
        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> T:
            return await func(*args, **kwargs)

        @retry(
            stop=stop_after_attempt(max_attempts),
            wait=wait_exponential(multiplier=1, min=min_wait, max=max_wait),
            retry=retry_if_exception_type(
                (RedditAPIError, AIGenerationError, DatabaseError, ConnectionError)
            ),
            before_sleep=before_sleep_log(logger, "INFO"),
            after=after_log(logger, "INFO"),
        )
        @wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> T:
            return func(*args, **kwargs)

        # Return appropriate wrapper based on function type
        import inspect

        if inspect.iscoroutinefunction(func):
            return async_wrapper  # type: ignore
        return sync_wrapper  # type: ignore

    return decorator


def retry_on_rate_limit(
    max_attempts: int = 5,
    min_wait: int = 60,
    max_wait: int = 300,
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """
    Retry decorator specifically for rate limit errors.

    Args:
        max_attempts: Maximum number of retry attempts
        min_wait: Minimum wait time in seconds (default 60s)
        max_wait: Maximum wait time in seconds (default 5min)

    Returns:
        Decorated function with retry logic
    """

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @retry(
            stop=stop_after_attempt(max_attempts),
            wait=wait_exponential(multiplier=2, min=min_wait, max=max_wait),
            retry=retry_if_exception_type(RateLimitError),
            before_sleep=before_sleep_log(logger, "WARNING"),
            after=after_log(logger, "INFO"),
        )
        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> T:
            return await func(*args, **kwargs)

        @retry(
            stop=stop_after_attempt(max_attempts),
            wait=wait_exponential(multiplier=2, min=min_wait, max=max_wait),
            retry=retry_if_exception_type(RateLimitError),
            before_sleep=before_sleep_log(logger, "WARNING"),
            after=after_log(logger, "INFO"),
        )
        @wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> T:
            return func(*args, **kwargs)

        import inspect

        if inspect.iscoroutinefunction(func):
            return async_wrapper  # type: ignore
        return sync_wrapper  # type: ignore

    return decorator
