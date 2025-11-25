"""Circuit breaker pattern implementation for resilient API calls."""

from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, TypeVar
from functools import wraps

from src.common.logging import get_logger
from src.common.exceptions import RedditEnhancerException

logger = get_logger(__name__)

T = TypeVar("T")


class CircuitState(Enum):
    """Circuit breaker states."""

    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Failing, reject calls
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreakerOpen(RedditEnhancerException):
    """Raised when circuit breaker is open."""

    pass


class CircuitBreaker:
    """
    Circuit breaker to prevent cascading failures.

    The circuit breaker has three states:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Too many failures, reject requests immediately
    - HALF_OPEN: Testing recovery, allow limited requests
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: type[Exception] = Exception,
    ):
        """
        Initialize circuit breaker.

        Args:
            failure_threshold: Number of failures before opening circuit
            recovery_timeout: Seconds to wait before attempting recovery
            expected_exception: Exception type to catch
        """
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception

        self.failure_count = 0
        self.last_failure_time: datetime | None = None
        self.state = CircuitState.CLOSED

    def _should_attempt_reset(self) -> bool:
        """Check if we should attempt to reset the circuit."""
        if self.state == CircuitState.OPEN and self.last_failure_time:
            timeout_threshold = datetime.now() - timedelta(seconds=self.recovery_timeout)
            return self.last_failure_time < timeout_threshold
        return False

    def call(self, func: Callable[..., T], *args: Any, **kwargs: Any) -> T:
        """
        Execute function with circuit breaker protection (sync version).

        Args:
            func: Function to execute
            *args: Positional arguments
            **kwargs: Keyword arguments

        Returns:
            Function result

        Raises:
            CircuitBreakerOpen: If circuit is open
        """
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                logger.info("circuit_breaker.attempting_reset", state=self.state.value)
                self.state = CircuitState.HALF_OPEN
            else:
                logger.warning("circuit_breaker.rejected", state=self.state.value)
                raise CircuitBreakerOpen("Circuit breaker is open")

        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except self.expected_exception as e:
            self._on_failure()
            raise e

    async def call_async(self, func: Callable[..., T], *args: Any, **kwargs: Any) -> T:
        """
        Execute async function with circuit breaker protection.

        Args:
            func: Async function to execute
            *args: Positional arguments
            **kwargs: Keyword arguments

        Returns:
            Function result

        Raises:
            CircuitBreakerOpen: If circuit is open
        """
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                logger.info("circuit_breaker.attempting_reset", state=self.state.value)
                self.state = CircuitState.HALF_OPEN
            else:
                logger.warning("circuit_breaker.rejected", state=self.state.value)
                raise CircuitBreakerOpen("Circuit breaker is open")

        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except self.expected_exception as e:
            self._on_failure()
            raise e

    def _on_success(self) -> None:
        """Handle successful call."""
        if self.state == CircuitState.HALF_OPEN:
            logger.info("circuit_breaker.closed", state=self.state.value)
            self.state = CircuitState.CLOSED
        self.failure_count = 0

    def _on_failure(self) -> None:
        """Handle failed call."""
        self.failure_count += 1
        self.last_failure_time = datetime.now()

        if self.failure_count >= self.failure_threshold:
            logger.error(
                "circuit_breaker.opened",
                failure_count=self.failure_count,
                threshold=self.failure_threshold,
            )
            self.state = CircuitState.OPEN


def with_circuit_breaker(
    failure_threshold: int = 5,
    recovery_timeout: int = 60,
    expected_exception: type[Exception] = Exception,
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """
    Decorator to add circuit breaker protection to a function.

    Args:
        failure_threshold: Number of failures before opening circuit
        recovery_timeout: Seconds to wait before attempting recovery
        expected_exception: Exception type to catch

    Returns:
        Decorated function with circuit breaker
    """
    breaker = CircuitBreaker(failure_threshold, recovery_timeout, expected_exception)

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> T:
            return await breaker.call_async(func, *args, **kwargs)

        @wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> T:
            return breaker.call(func, *args, **kwargs)

        import inspect

        if inspect.iscoroutinefunction(func):
            return async_wrapper  # type: ignore
        return sync_wrapper  # type: ignore

    return decorator
