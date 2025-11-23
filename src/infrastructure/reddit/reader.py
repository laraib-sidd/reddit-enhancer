"""Async Reddit reader for read-only operations."""

import asyncpraw
from asyncpraw.reddit import Reddit, Subreddit

from src.domain.entities import Post, SuccessfulPattern
from src.domain.value_objects import PostId, SubredditName, PostTitle, Score
from src.common.logging import get_logger
from src.common.exceptions import RedditAPIError
from src.common.retry import retry_on_api_error, retry_on_rate_limit
from src.config.settings import RedditSettings

logger = get_logger(__name__)


class RedditReader:
    """
    Async Reddit reader for read-only operations.

    Does not require username/password - only client_id and client_secret.
    """

    def __init__(self, settings: RedditSettings):
        self.settings = settings
        self.reddit: Reddit | None = None

    async def __aenter__(self) -> "RedditReader":
        """Async context manager entry."""
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit."""
        await self.close()

    async def connect(self) -> None:
        """Initialize the Reddit client."""
        try:
            logger.info("reddit_reader.connecting")

            self.reddit = asyncpraw.Reddit(
                client_id=self.settings.client_id,
                client_secret=self.settings.client_secret.get_secret_value(),
                user_agent=self.settings.user_agent or "reddit-enhancer:v0.2.0",
            )

            # Verify read-only mode
            self.reddit.read_only = True

            logger.info("reddit_reader.connected", read_only=True)
        except Exception as e:
            logger.error("reddit_reader.connection_failed", error=str(e))
            raise RedditAPIError(f"Failed to connect to Reddit: {e}") from e

    async def close(self) -> None:
        """Close the Reddit client."""
        if self.reddit:
            await self.reddit.close()
            logger.info("reddit_reader.closed")

    @retry_on_api_error(max_attempts=3)
    @retry_on_rate_limit(max_attempts=5)
    async def get_rising_posts(self, subreddits: list[str], limit: int = 5) -> list[Post]:
        """
        Get rising posts from subreddits.

        Args:
            subreddits: List of subreddit names
            limit: Maximum number of posts to fetch

        Returns:
            List of Post entities

        Raises:
            RedditAPIError: If API call fails
        """
        if not self.reddit:
            raise RedditAPIError("Reddit client not connected")

        try:
            logger.info("reddit_reader.fetching_rising", subreddits=subreddits, limit=limit)

            posts = []
            subreddit_str = "+".join(subreddits)
            subreddit: Subreddit = await self.reddit.subreddit(subreddit_str)

            async for submission in subreddit.rising(limit=limit):
                post = Post(
                    id=PostId(submission.id),
                    title=PostTitle(submission.title),
                    subreddit=SubredditName(submission.subreddit.display_name),
                    content=submission.selftext or "",
                    url=submission.url,
                    created_at=submission.created_utc,
                    permalink=submission.permalink,
                )
                posts.append(post)

            logger.info("reddit_reader.fetched_posts", count=len(posts))
            return posts

        except Exception as e:
            logger.error("reddit_reader.fetch_failed", error=str(e))
            raise RedditAPIError(f"Failed to fetch rising posts: {e}") from e

    @retry_on_api_error(max_attempts=3)
    async def get_top_comments(self, subreddit: str, limit: int = 10) -> list[SuccessfulPattern]:
        """
        Get top comments from a subreddit for pattern learning.

        Args:
            subreddit: Subreddit name
            limit: Maximum number of posts to scan

        Returns:
            List of SuccessfulPattern entities

        Raises:
            RedditAPIError: If API call fails
        """
        if not self.reddit:
            raise RedditAPIError("Reddit client not connected")

        try:
            logger.info("reddit_reader.fetching_top_comments", subreddit=subreddit, limit=limit)

            patterns = []
            sub: Subreddit = await self.reddit.subreddit(subreddit)

            async for submission in sub.top(time_filter="month", limit=limit):
                # Get top comments from each submission
                await submission.comments.replace_more(limit=0)

                for comment in submission.comments[:3]:  # Top 3 comments per post
                    if hasattr(comment, "body") and hasattr(comment, "score"):
                        pattern = SuccessfulPattern(
                            id=None,
                            pattern_text=comment.body,
                            subreddit=SubredditName(subreddit),
                            score=Score(comment.score),
                        )
                        patterns.append(pattern)

            logger.info("reddit_reader.fetched_patterns", count=len(patterns))
            return patterns

        except Exception as e:
            logger.error("reddit_reader.fetch_comments_failed", error=str(e))
            raise RedditAPIError(f"Failed to fetch top comments: {e}") from e

