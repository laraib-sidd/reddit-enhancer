"""Database retry logic for transient connection errors."""

from functools import wraps
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
import asyncpg.exceptions as asyncpg_exc
from sqlalchemy.exc import OperationalError, DBAPIError

from src.common.logging import get_logger

logger = get_logger(__name__)


def retry_on_db_error(max_attempts: int = 3):
    """
    Decorator to retry database operations on transient connection errors.
    
    Retries on:
    - ConnectionDoesNotExistError
    - InterfaceError
    - OperationalError
    
    Args:
        max_attempts: Maximum number of retry attempts
        
    Returns:
        Decorated function with retry logic
        
    Example:
        >>> @retry_on_db_error(max_attempts=3)
        ... async def get_posts():
        ...     return await session.execute(select(PostModel))
    """
    return retry(
        retry=retry_if_exception_type((
            asyncpg_exc.ConnectionDoesNotExistError,
            asyncpg_exc.InterfaceError,
            asyncpg_exc.ConnectionFailureError,
            OperationalError,
            DBAPIError,
        )),
        stop=stop_after_attempt(max_attempts),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        before_sleep=lambda retry_state: logger.warning(
            "database.retry_attempt",
            attempt=retry_state.attempt_number,
            max_attempts=max_attempts,
        ),
        reraise=True,
    )


async def execute_with_retry(session, stmt, max_attempts: int = 3):
    """
    Execute a SQLAlchemy statement with automatic retry on connection errors.
    
    Args:
        session: AsyncSession instance
        stmt: SQLAlchemy statement to execute
        max_attempts: Maximum number of retry attempts
        
    Returns:
        Query result
        
    Raises:
        DatabaseError: If all retry attempts fail
        
    Example:
        >>> stmt = select(PostModel).where(PostModel.id == post_id)
        >>> result = await execute_with_retry(session, stmt)
    """
    @retry_on_db_error(max_attempts=max_attempts)
    async def _execute():
        return await session.execute(stmt)
    
    return await _execute()

