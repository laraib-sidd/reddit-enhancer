"""Async database connection management."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

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
            db_url = settings.db_async_url

            # Mask password in URL for logging
            safe_url = db_url
            if "@" in db_url:
                # Format: postgresql+asyncpg://user:password@host/db
                parts = db_url.split("://", 1)
                if len(parts) == 2:
                    protocol = parts[0]
                    rest = parts[1]
                    if "@" in rest:
                        credentials, host_part = rest.split("@", 1)
                        if ":" in credentials:
                            username = credentials.split(":")[0]
                            safe_url = f"{protocol}://{username}:****@{host_part}"

            logger.info("database.creating_engine", url=safe_url)

            # Supabase uses pgbouncer which doesn't support prepared statements
            # We need to disable them for compatibility
            _engine = create_async_engine(
                db_url,
                pool_size=DB_POOL_SIZE,
                max_overflow=DB_MAX_OVERFLOW,
                pool_timeout=DB_POOL_TIMEOUT,
                pool_pre_ping=True,  # Verify connections before using
                echo=False,  # Disable SQL logging (too verbose)
                connect_args={
                    "server_settings": {
                        "jit": "off",  # Disable JIT for pgbouncer
                    },
                    "statement_cache_size": 0,  # Disable prepared statements
                },
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
    Initialize database by running Alembic migrations.

    This should be called at application startup.
    Uses Alembic for proper migration management instead of create_all().
    """
    from src.config.constants import DB_SCHEMA_NAME
    from sqlalchemy import text
    import subprocess
    import os

    engine = get_engine()

    try:
        logger.info("database.initializing", schema=DB_SCHEMA_NAME)

        # Create schema if it doesn't exist
        async with engine.begin() as conn:
            await conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {DB_SCHEMA_NAME}"))
            logger.info("database.schema_created", schema=DB_SCHEMA_NAME)

        # Run Alembic migrations
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=project_root,
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            logger.error("database.migration_failed", stderr=result.stderr)
            raise DatabaseError(f"Alembic migration failed: {result.stderr}")

        logger.info("database.migrations_applied", output=result.stdout.strip())
        logger.info("database.initialized", schema=DB_SCHEMA_NAME)
    except DatabaseError:
        raise
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
