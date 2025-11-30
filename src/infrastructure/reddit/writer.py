"""Async Reddit writer for write operations."""

import aiohttp
import asyncpraw
from asyncpraw.reddit import Reddit

from src.domain.value_objects import CommentId
from src.common.logging import get_logger
from src.common.exceptions import RedditAPIError
from src.common.retry import retry_on_api_error, retry_on_rate_limit
from src.infrastructure.reddit.proxy_utils import create_proxy_session

logger = get_logger(__name__)


class RedditWriter:
    """
    Async Reddit writer for write operations (posting comments).

    Requires full authentication (username + password).
    Supports proxy configuration for avoiding IP-based flagging.
    """

    def __init__(
        self,
        client_id: str,
        client_secret: str,
        username: str | None,
        password: str | None,
        user_agent: str | None = None,
        proxy_url: str | None = None,
    ):
        self.client_id = client_id
        self.client_secret = client_secret
        self.username = username
        self.password = password
        self.user_agent = user_agent or "reddit-enhancer:v0.2.0"
        self.proxy_url = proxy_url
        self.reddit: Reddit | None = None
        self.is_authenticated = False
        self._session: aiohttp.ClientSession | None = None

    async def __aenter__(self) -> "RedditWriter":
        """Async context manager entry."""
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit."""
        await self.close()

    async def connect(self) -> None:
        """Initialize and authenticate the Reddit client with optional proxy."""
        try:
            if not self.username or not self.password:
                raise RedditAPIError("Reddit username and password required for write operations")

            logger.info(
                "reddit_writer.connecting",
                username=self.username,
                proxy_configured=bool(self.proxy_url),
            )

            # Build requestor kwargs for proxy
            requestor_kwargs = {}

            if self.proxy_url:
                self._session = create_proxy_session(self.proxy_url)
                if self._session:
                    requestor_kwargs["session"] = self._session
                    logger.info("reddit_writer.proxy_enabled", proxy_type="socks")
                elif self.proxy_url.startswith("http"):
                    import os

                    os.environ["HTTP_PROXY"] = self.proxy_url
                    os.environ["HTTPS_PROXY"] = self.proxy_url
                    logger.info("reddit_writer.proxy_enabled", proxy_type="http")

            self.reddit = asyncpraw.Reddit(
                client_id=self.client_id,
                client_secret=self.client_secret,
                user_agent=self.user_agent,
                username=self.username,
                password=self.password,
                requestor_kwargs=requestor_kwargs if requestor_kwargs else None,
            )

            # Verify authentication
            user = await self.reddit.user.me()
            self.is_authenticated = True

            logger.info("reddit_writer.connected", username=user.name)

        except Exception as e:
            logger.error("reddit_writer.connection_failed", error=str(e))
            self.is_authenticated = False
            raise RedditAPIError(f"Failed to authenticate with Reddit: {e}") from e

    async def close(self) -> None:
        """Close the Reddit client and proxy session."""
        if self.reddit:
            await self.reddit.close()
        if self._session:
            await self._session.close()
        logger.info("reddit_writer.closed")

    @retry_on_api_error(max_attempts=3)
    @retry_on_rate_limit(max_attempts=5)
    async def post_comment(self, post_id: str, text: str) -> CommentId | None:
        """
        Post a comment to a Reddit post.

        Args:
            post_id: Reddit post ID
            text: Comment text

        Returns:
            Comment ID if successful, None otherwise

        Raises:
            RedditAPIError: If posting fails
        """
        if not self.reddit or not self.is_authenticated:
            raise RedditAPIError("Reddit writer not authenticated")

        try:
            logger.info(
                "reddit_writer.posting_comment",
                post_id=post_id,
                comment_length=len(text),
            )

            submission = await self.reddit.submission(id=post_id)
            comment = await submission.reply(text)

            logger.info("reddit_writer.comment_posted", comment_id=comment.id, post_id=post_id)
            return CommentId(comment.id)

        except Exception as e:
            logger.error("reddit_writer.post_failed", post_id=post_id, error=str(e))
            raise RedditAPIError(f"Failed to post comment: {e}") from e
