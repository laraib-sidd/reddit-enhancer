"""Application settings using Pydantic Settings."""

from typing import Annotated
from pydantic import Field, PostgresDsn, field_validator, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

from src.config.constants import (
    DEFAULT_AI_MODEL,
    DEFAULT_MIN_DELAY,
    DEFAULT_MAX_DELAY,
    REDDIT_USER_AGENT_FORMAT,
    APP_NAME,
    APP_VERSION,
)


class RedditSettings(BaseSettings):
    """Reddit API configuration."""

    client_id: str = Field(
        ..., description="Reddit API client ID", validation_alias="REDDIT_CLIENT_ID"
    )
    client_secret: SecretStr = Field(
        ..., description="Reddit API client secret", validation_alias="REDDIT_CLIENT_SECRET"
    )
    username: str | None = Field(
        None, description="Reddit username for write operations", validation_alias="REDDIT_USERNAME"
    )
    password: SecretStr | None = Field(
        None, description="Reddit password for write operations", validation_alias="REDDIT_PASSWORD"
    )
    user_agent: str | None = Field(
        None, description="Reddit API user agent", validation_alias="REDDIT_USER_AGENT"
    )

    @field_validator("user_agent", mode="before")
    @classmethod
    def generate_user_agent(cls, v: str | None, info) -> str:
        """Generate user agent if not provided."""
        if v:
            return v
        # Use username from the same settings if available
        username = info.data.get("username", "unknown_user")
        return REDDIT_USER_AGENT_FORMAT.format(
            app=APP_NAME, version=APP_VERSION, username=username
        )

    model_config = SettingsConfigDict(
        env_prefix="REDDIT_",
        case_sensitive=False,
    )


class AISettings(BaseSettings):
    """AI service configuration."""

    anthropic_api_key: SecretStr = Field(
        ..., description="Anthropic API key", validation_alias="ANTHROPIC_API_KEY"
    )
    
    @property
    def model(self) -> str:
        """Get the AI model from constants (not configurable via env)."""
        return DEFAULT_AI_MODEL
    
    @property
    def max_tokens(self) -> int:
        """Get max tokens from constants."""
        from src.config.constants import MAX_COMMENT_TOKENS
        return MAX_COMMENT_TOKENS
    
    @property
    def temperature(self) -> float:
        """Get temperature from constants."""
        from src.config.constants import AI_TEMPERATURE
        return AI_TEMPERATURE

    model_config = SettingsConfigDict(
        case_sensitive=False,
    )


class DatabaseSettings(BaseSettings):
    """Database configuration (Supabase PostgreSQL)."""

    url: PostgresDsn = Field(
        ...,
        description="PostgreSQL connection URL (Supabase)",
        validation_alias="DB_CONNECTION_STRING",
    )

    @property
    def async_url(self) -> str:
        """Get async PostgreSQL URL for SQLAlchemy."""
        url_str = str(self.url)
        # Replace postgresql:// with postgresql+asyncpg://
        if url_str.startswith("postgresql://"):
            return url_str.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url_str

    model_config = SettingsConfigDict(
        case_sensitive=False,
    )


class TelegramSettings(BaseSettings):
    """Telegram bot configuration."""

    token: SecretStr | None = Field(
        None, description="Telegram bot token", validation_alias="TELEGRAM_BOT_TOKEN"
    )
    chat_id: str | None = Field(
        None, description="Telegram chat ID", validation_alias="TELEGRAM_CHAT_ID"
    )

    @property
    def is_configured(self) -> bool:
        """Check if Telegram is properly configured."""
        return self.token is not None and self.chat_id is not None

    model_config = SettingsConfigDict(
        env_prefix="TELEGRAM_",
        case_sensitive=False,
    )


class BotSettings(BaseSettings):
    """Bot behavior configuration."""

    target_subreddits: list[str] = Field(
        default=["AskReddit"],
        description="List of subreddits to monitor",
        validation_alias="TARGET_SUBREDDITS",
    )
    min_delay: int = Field(
        default=DEFAULT_MIN_DELAY,
        gt=0,
        description="Minimum delay between actions (seconds)",
        validation_alias="MODE_DELAY_MIN",
    )
    max_delay: int = Field(
        default=DEFAULT_MAX_DELAY,
        gt=0,
        description="Maximum delay between actions (seconds)",
        validation_alias="MODE_DELAY_MAX",
    )

    @field_validator("target_subreddits", mode="before")
    @classmethod
    def parse_subreddits(cls, v: str | list[str]) -> list[str]:
        """Parse comma-separated subreddit string."""
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return v

    @field_validator("min_delay", mode="before")
    @classmethod
    def convert_minutes_to_seconds(cls, v: int | str) -> int:
        """Convert minutes to seconds if needed."""
        val = int(v)
        # If value is less than 60, assume it's in minutes and convert
        if val < 60:
            return val * 60
        return val

    @field_validator("max_delay", mode="before")
    @classmethod
    def convert_max_delay_minutes_to_seconds(cls, v: int | str) -> int:
        """Convert minutes to seconds if needed."""
        val = int(v)
        # If value is less than 60, assume it's in minutes and convert
        if val < 60:
            return val * 60
        return val

    model_config = SettingsConfigDict(
        case_sensitive=False,
    )


class Settings(BaseSettings):
    """Main application settings."""

    # Sub-settings
    reddit: RedditSettings = Field(default_factory=RedditSettings)
    ai: AISettings = Field(default_factory=AISettings)
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    telegram: TelegramSettings = Field(default_factory=TelegramSettings)
    bot: BotSettings = Field(default_factory=BotSettings)

    # Logging
    log_level: str = Field(default="INFO", validation_alias="LOG_LEVEL")
    json_logs: bool = Field(default=False, validation_alias="JSON_LOGS")

    # Environment
    environment: str = Field(default="development", validation_alias="ENVIRONMENT")

    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.environment.lower() == "production"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Ignore extra fields in .env
    )


# Global settings instance
_settings: Settings | None = None


def get_settings() -> Settings:
    """
    Get or create global settings instance.

    Returns:
        Settings instance

    Raises:
        ConfigurationError: If settings cannot be loaded
    """
    global _settings
    if _settings is None:
        from src.common.exceptions import ConfigurationError

        try:
            _settings = Settings()
        except Exception as e:
            raise ConfigurationError(f"Failed to load settings: {e}") from e
    return _settings


def reset_settings() -> None:
    """Reset global settings instance (useful for testing)."""
    global _settings
    _settings = None

