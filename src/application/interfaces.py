"""Port interfaces for external services (Hexagonal Architecture)."""

from typing import Protocol

from src.domain.entities import Post, SuccessfulPattern


class IRedditReader(Protocol):
    """Interface for Reddit read operations."""

    async def get_rising_posts(self, subreddits: list[str], limit: int = 5) -> list[Post]:
        """Get rising posts from subreddits."""
        ...

    async def get_top_comments(self, subreddit: str, limit: int = 10) -> list[SuccessfulPattern]:
        """Get top comments for pattern learning."""
        ...


class IRedditWriter(Protocol):
    """Interface for Reddit write operations."""

    async def post_comment(self, post_id: str, text: str) -> str | None:
        """Post a comment to Reddit."""
        ...


class IAIClient(Protocol):
    """Interface for AI comment generation."""

    async def generate_comment(
        self,
        post: Post,
        patterns: list[SuccessfulPattern] | None = None,
    ) -> str:
        """Generate a comment for a post."""
        ...


class ITelegramBot(Protocol):
    """Interface for Telegram bot operations."""

    async def send_approval_request(
        self,
        post: Post,
        proposed_comment: str,
    ) -> bool:
        """Send approval request to Telegram."""
        ...

    async def wait_for_approval(self, post_id: str, timeout: int = 300) -> any:
        """Wait for user approval."""
        ...
