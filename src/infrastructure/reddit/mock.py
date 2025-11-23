"""Mock Reddit client for testing without API credentials."""

from datetime import datetime
from typing import List

from src.domain.entities import Post, SuccessfulPattern
from src.domain.value_objects import PostId, SubredditName, PostTitle, Score
from src.common.logging import get_logger

logger = get_logger(__name__)


class MockRedditClient:
    """
    Mock Reddit client for testing purposes.

    Returns fake data without making actual API calls.
    """

    def __init__(self):
        logger.warning("mock_reddit.initialized", message="Using mock Reddit client - no real API calls")
        self.call_count = 0

    async def get_rising_posts(self, subreddits: list[str], limit: int = 5) -> list[Post]:
        """Get mock rising posts."""
        self.call_count += 1

        logger.info("mock_reddit.fetching_posts", subreddits=subreddits, limit=limit)

        # Generate some realistic mock posts
        mock_posts = [
            Post(
                id=PostId(f"mock_post_{self.call_count}_1"),
                title=PostTitle("What's the best programming language to learn in 2025?"),
                subreddit=SubredditName(subreddits[0] if subreddits else "AskReddit"),
                content="I'm a complete beginner and want to start learning to code. "
                       "What language would you recommend and why?",
                url="https://reddit.com/r/AskReddit/mock1",
                created_at=datetime.now(),
                permalink="/r/AskReddit/comments/mock1/whats_the_best_programming_language/",
            ),
            Post(
                id=PostId(f"mock_post_{self.call_count}_2"),
                title=PostTitle("Why do software engineers make so much money?"),
                subreddit=SubredditName(subreddits[0] if subreddits else "AskReddit"),
                content="Seriously, what makes software development so valuable?",
                url="https://reddit.com/r/AskReddit/mock2",
                created_at=datetime.now(),
                permalink="/r/AskReddit/comments/mock2/why_do_software_engineers/",
            ),
            Post(
                id=PostId(f"mock_post_{self.call_count}_3"),
                title=PostTitle("What's something that's obvious to you in your profession but not to others?"),
                subreddit=SubredditName(subreddits[0] if subreddits else "AskReddit"),
                content="",
                url="https://reddit.com/r/AskReddit/mock3",
                created_at=datetime.now(),
                permalink="/r/AskReddit/comments/mock3/whats_something_obvious/",
            ),
        ]

        return mock_posts[:limit]

    async def get_top_comments(self, subreddit: str, limit: int = 10) -> list[SuccessfulPattern]:
        """Get mock successful comment patterns."""
        logger.info("mock_reddit.fetching_patterns", subreddit=subreddit, limit=limit)

        mock_patterns = [
            SuccessfulPattern(
                id=None,
                pattern_text="This is such a great question! I've been wondering the same thing.",
                subreddit=SubredditName(subreddit),
                score=Score(150),
            ),
            SuccessfulPattern(
                id=None,
                pattern_text="As someone who works in this field, let me share my perspective...",
                subreddit=SubredditName(subreddit),
                score=Score(200),
            ),
            SuccessfulPattern(
                id=None,
                pattern_text="Fun fact: This actually has a really interesting history behind it.",
                subreddit=SubredditName(subreddit),
                score=Score(120),
            ),
        ]

        return mock_patterns[:limit]

    async def post_comment(self, post_id: str, text: str) -> str | None:
        """Mock posting a comment."""
        logger.info(
            "mock_reddit.posting_comment",
            post_id=post_id,
            comment_preview=text[:50] + "..." if len(text) > 50 else text,
        )

        # Return a fake comment ID
        return f"mock_comment_{post_id}_{self.call_count}"

    async def close(self) -> None:
        """Close the mock client (no-op)."""
        logger.info("mock_reddit.closed")

