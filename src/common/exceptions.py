"""Custom exception hierarchy for the application."""


class RedditEnhancerException(Exception):
    """Base exception for all application-specific errors."""

    def __init__(self, message: str, *args, **kwargs):
        self.message = message
        super().__init__(message, *args, **kwargs)


class ConfigurationError(RedditEnhancerException):
    """Raised when configuration is invalid or missing."""

    pass


class RedditAPIError(RedditEnhancerException):
    """Raised when Reddit API calls fail."""

    def __init__(self, message: str, status_code: int | None = None, *args, **kwargs):
        super().__init__(message, *args, **kwargs)
        self.status_code = status_code


class AIGenerationError(RedditEnhancerException):
    """Raised when AI comment generation fails."""

    def __init__(self, message: str, provider: str = "anthropic", *args, **kwargs):
        super().__init__(message, *args, **kwargs)
        self.provider = provider


class DatabaseError(RedditEnhancerException):
    """Raised when database operations fail."""

    pass


class TelegramError(RedditEnhancerException):
    """Raised when Telegram operations fail."""

    pass


class ValidationError(RedditEnhancerException):
    """Raised when data validation fails."""

    pass


class RateLimitError(RedditEnhancerException):
    """Raised when rate limits are exceeded."""

    def __init__(self, message: str, retry_after: int | None = None, *args, **kwargs):
        super().__init__(message, *args, **kwargs)
        self.retry_after = retry_after

