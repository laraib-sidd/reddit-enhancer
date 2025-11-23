"""Async database connection management."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from src.config.settings import get_settings
from src.config.constants import DB_POOL_SIZE, DB_MAX_OVERFLOW, DB_POOL_TIMEOUT
from src.common.logging import get_logger
from src.common.exceptions import DatabaseError

logger = get_logger(__name__)

# Global engine and session factory
_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    """
    Get or create the global async database engine.

    Returns:
        AsyncEngine instance

    Raises:
        DatabaseError: If engine creation fails
    """
    global _engine

    if _engine is None:
        try:
            settings = get_settings()
            db_url = settings.database.async_url

            logger.info("database.creating_engine", url=db_url.split("@")[0])  # Log without credentials

            _engine = create_async_engine(
                db_url,
                pool_size=DB_POOL_SIZE,
                max_overflow=DB_MAX_OVERFLOW,
                pool_timeout=DB_POOL_TIMEOUT,
                pool_pre_ping=True,  # Verify connections before using
                echo=not settings.is_production,  # SQL logging in dev
            )
        except Exception as e:
            logger.error("database.engine_creation_failed", error=str(e))
            raise DatabaseError(f"Failed to create database engine: {e}") from e

    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """
    Get or create the global session factory.

    Returns:
        Session factory
    """
    global _session_factory

    if _session_factory is None:
        engine = get_engine()
        _session_factory = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )

    return _session_factory


@asynccontextmanager
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Get an async database session.

    Usage:
        async with get_session() as session:
            # Use session
            ...

    Yields:
        AsyncSession instance

    Raises:
        DatabaseError: If session creation fails
    """
    session_factory = get_session_factory()

    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error("database.session_error", error=str(e))
            raise DatabaseError(f"Database session error: {e}") from e
        finally:
            await session.close()


async def init_db() -> None:
    """
    Initialize database - create all tables.

    This should be called at application startup.
    """
    from src.infrastructure.database.models import Base

    engine = get_engine()

    try:
        logger.info("database.initializing")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("database.initialized")
    except Exception as e:
        logger.error("database.initialization_failed", error=str(e))
        raise DatabaseError(f"Failed to initialize database: {e}") from e


async def close_db() -> None:
    """Close database connections."""
    global _engine, _session_factory

    if _engine:
        logger.info("database.closing")
        await _engine.dispose()
        _engine = None
        _session_factory = None
        logger.info("database.closed")

