"""Repository interfaces (abstract base classes) for data access."""

from abc import ABC, abstractmethod
from typing import Protocol

from src.domain.entities import Post, Comment, SuccessfulPattern, CommentStatus
from src.domain.value_objects import PostId, CommentId, SubredditName


class PostRepository(Protocol):
    """Interface for post data access."""

    async def save(self, post: Post) -> Post:
        """Save a post."""
        ...

    async def get_by_id(self, post_id: PostId) -> Post | None:
        """Get post by ID."""
        ...

    async def exists(self, post_id: PostId) -> bool:
        """Check if post exists."""
        ...

    async def get_unprocessed(self, limit: int = 10) -> list[Post]:
        """Get unprocessed posts."""
        ...


class CommentRepository(Protocol):
    """Interface for comment data access."""

    async def save(self, comment: Comment) -> Comment:
        """Save a comment."""
        ...

    async def get_by_id(self, comment_id: int) -> Comment | None:
        """Get comment by ID."""
        ...

    async def get_by_post_id(self, post_id: PostId) -> list[Comment]:
        """Get all comments for a post."""
        ...

    async def get_by_status(
        self, status: CommentStatus, limit: int = 10
    ) -> list[Comment]:
        """Get comments by status."""
        ...

    async def get_golden_examples(self, limit: int = 10) -> list[Comment]:
        """Get high-performing comments."""
        ...


class PatternRepository(Protocol):
    """Interface for successful pattern data access."""

    async def save(self, pattern: SuccessfulPattern) -> SuccessfulPattern:
        """Save a pattern."""
        ...

    async def get_by_subreddit(
        self, subreddit: SubredditName, limit: int = 10
    ) -> list[SuccessfulPattern]:
        """Get patterns for a specific subreddit."""
        ...

    async def get_top_patterns(self, limit: int = 10) -> list[SuccessfulPattern]:
        """Get highest scoring patterns."""
        ...

    async def exists(self, pattern_text: str) -> bool:
        """Check if pattern already exists."""
        ...

    async def search_similar(
        self, text: str, subreddit: SubredditName | None = None, limit: int = 5
    ) -> list[SuccessfulPattern]:
        """
        Search for similar patterns.

        In the future, this could use vector embeddings for semantic search.
        For now, it's a simple text-based search.
        """
        ...

