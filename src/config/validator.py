"""Configuration validation on startup."""

import asyncio
from typing import Any

from src.common.exceptions import ConfigurationError
from src.common.logging import get_logger
from src.config.settings import get_settings

logger = get_logger(__name__)


async def validate_database_connection() -> dict[str, Any]:
    """
    Validate database connection on startup.
    
    Returns:
        Connection info dict
        
    Raises:
        ConfigurationError: If database connection fails
    """
    try:
        from src.infrastructure.database.connection import get_engine
        from sqlalchemy import text
        
        engine = get_engine()
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar_one()
            
        logger.info("config.validation.database_ok", version=version[:50])
        return {"status": "ok", "version": version[:50]}
        
    except Exception as e:
        logger.error("config.validation.database_failed", error=str(e))
        raise ConfigurationError(f"Database connection failed: {e}") from e


async def validate_reddit_credentials() -> dict[str, Any]:
    """
    Validate Reddit API credentials.
    
    Returns:
        Validation result dict
        
    Raises:
        ConfigurationError: If Reddit credentials are invalid
    """
    try:
        from src.infrastructure.reddit.reader import RedditReader
        
        settings = get_settings()
        
        # Validate read credentials
        reader = RedditReader(
            client_id=settings.reddit_client_id,
            client_secret=settings.reddit_client_secret.get_secret_value(),
            user_agent=settings.reddit_user_agent,
        )
        
        await reader.connect()
        
        # Try a simple read operation
        try:
            posts = await reader.get_posts("AskReddit", limit=1)
            await reader.close()
            
            logger.info("config.validation.reddit_ok", read_only=True)
            return {"status": "ok", "read_only": True, "posts_fetched": len(posts)}
            
        except Exception as e:
            await reader.close()
            logger.warning("config.validation.reddit_read_failed", error=str(e))
            raise ConfigurationError(f"Reddit read access failed: {e}") from e
            
    except Exception as e:
        logger.error("config.validation.reddit_failed", error=str(e))
        raise ConfigurationError(f"Reddit credentials validation failed: {e}") from e


async def validate_ai_credentials() -> dict[str, Any]:
    """
    Validate AI API credentials.
    
    Returns:
        Validation result dict
        
    Raises:
        ConfigurationError: If AI credentials are invalid
    """
    try:
        import anthropic
        
        settings = get_settings()
        client = anthropic.Anthropic(
            api_key=settings.anthropic_api_key.get_secret_value()
        )
        
        # Simple test call
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=10,
            messages=[{"role": "user", "content": "Hello"}]
        )
        
        logger.info("config.validation.ai_ok", model=response.model)
        return {"status": "ok", "model": response.model}
        
    except Exception as e:
        logger.error("config.validation.ai_failed", error=str(e))
        raise ConfigurationError(f"AI credentials validation failed: {e}") from e


async def validate_configuration(
    check_database: bool = True,
    check_reddit: bool = True,
    check_ai: bool = True,
) -> dict[str, Any]:
    """
    Validate all configuration on startup.
    
    Args:
        check_database: Whether to validate database connection
        check_reddit: Whether to validate Reddit credentials
        check_ai: Whether to validate AI credentials
        
    Returns:
        Validation results for all checks
        
    Raises:
        ConfigurationError: If any validation fails
        
    Example:
        >>> results = await validate_configuration()
        >>> print(results["database"]["status"])  # "ok"
    """
    logger.info("config.validation.starting")
    
    results = {}
    errors = []
    
    # Run validations
    if check_database:
        try:
            results["database"] = await validate_database_connection()
        except ConfigurationError as e:
            errors.append(f"Database: {e}")
            results["database"] = {"status": "error", "error": str(e)}
    
    if check_reddit:
        try:
            results["reddit"] = await validate_reddit_credentials()
        except ConfigurationError as e:
            errors.append(f"Reddit: {e}")
            results["reddit"] = {"status": "error", "error": str(e)}
    
    if check_ai:
        try:
            results["ai"] = await validate_ai_credentials()
        except ConfigurationError as e:
            errors.append(f"AI: {e}")
            results["ai"] = {"status": "error", "error": str(e)}
    
    # Summary
    if errors:
        logger.error("config.validation.failed", errors=errors)
        raise ConfigurationError(
            f"Configuration validation failed:\n" + "\n".join(f"  - {e}" for e in errors)
        )
    
    logger.info("config.validation.success", checks_passed=len(results))
    return results


def validate_configuration_sync(
    check_database: bool = True,
    check_reddit: bool = True,
    check_ai: bool = True,
) -> dict[str, Any]:
    """
    Synchronous wrapper for validate_configuration.
    
    Useful for CLI commands that need to validate config before starting.
    
    Args:
        check_database: Whether to validate database connection
        check_reddit: Whether to validate Reddit credentials
        check_ai: Whether to validate AI credentials
        
    Returns:
        Validation results
        
    Raises:
        ConfigurationError: If validation fails
        
    Example:
        >>> # In CLI command
        >>> validate_configuration_sync()
        >>> # Proceed with command if no exception raised
    """
    return asyncio.run(
        validate_configuration(
            check_database=check_database,
            check_reddit=check_reddit,
            check_ai=check_ai,
        )
    )

