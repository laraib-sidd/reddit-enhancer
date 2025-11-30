"""Application settings using Pydantic Settings."""

from pydantic import Field, PostgresDsn, field_validator, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

from src.config.constants import (
    REDDIT_USER_AGENT_FORMAT,
    APP_NAME,
    APP_VERSION,
)


class Settings(BaseSettings):
    """Main application settings."""

    # Reddit settings
    reddit_client_id: str = Field(default="dummy_client_id")
    reddit_client_secret: SecretStr = Field(default="dummy_client_secret")
    reddit_username: str | None = None
    reddit_password: SecretStr | None = None
    reddit_user_agent: str | None = None

    # AI settings (at least one required - Gemini is primary, Claude is fallback)
    google_api_key: SecretStr | None = None  # Primary: Google Gemini
    anthropic_api_key: SecretStr | None = None  # Fallback: Anthropic Claude

    # Database settings
    db_connection_string: PostgresDsn

    # Telegram settings (optional)
    telegram_bot_token: SecretStr | None = None
    telegram_chat_id: str | None = None

    # Bot behavior
    target_subreddits: str = Field(default="AskReddit")
    mode_delay_min: int = Field(default=300)
    mode_delay_max: int = Field(default=1800)

    # Proxy settings (optional - helps avoid account flagging)
    # Supports: http://host:port, socks5://user:pass@host:port
    proxy_url: SecretStr | None = None

    # Logging
    log_level: str = Field(default="INFO")
    json_logs: bool = Field(default=False)

    # Environment
    environment: str = Field(default="development")

    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.environment.lower() == "production"

    @property
    def telegram_is_configured(self) -> bool:
        """Check if Telegram is configured."""
        return self.telegram_bot_token is not None and self.telegram_chat_id is not None

    @property
    def gemini_is_configured(self) -> bool:
        """Check if Google Gemini is configured."""
        return self.google_api_key is not None

    @property
    def claude_is_configured(self) -> bool:
        """Check if Anthropic Claude is configured."""
        return self.anthropic_api_key is not None

    @property
    def ai_is_configured(self) -> bool:
        """Check if at least one AI provider is configured."""
        return self.gemini_is_configured or self.claude_is_configured

    @property
    def proxy_is_configured(self) -> bool:
        """Check if proxy is configured."""
        return self.proxy_url is not None

    @property
    def db_async_url(self) -> str:
        """Get async PostgreSQL URL."""
        url_str = str(self.db_connection_string)
        if url_str.startswith("postgresql://"):
            return url_str.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url_str

    @property
    def subreddits_list(self) -> list[str]:
        """Get target subreddits as a list."""
        return [s.strip() for s in self.target_subreddits.split(",") if s.strip()]

    @field_validator("mode_delay_min", "mode_delay_max", mode="before")
    @classmethod
    def convert_minutes_to_seconds(cls, v: int | str) -> int:
        """Convert minutes to seconds if needed."""
        val = int(v)
        if val < 60:
            return val * 60
        return val

    @field_validator("reddit_user_agent", mode="before")
    @classmethod
    def generate_user_agent(cls, v: str | None, info) -> str:
        """Generate user agent if not provided."""
        if v:
            return v
        username = info.data.get("reddit_username", "unknown_user")
        return REDDIT_USER_AGENT_FORMAT.format(app=APP_NAME, version=APP_VERSION, username=username)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
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
