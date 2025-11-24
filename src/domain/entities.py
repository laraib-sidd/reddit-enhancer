"""
Domain entities - core business objects.

This module defines the core business entities for the Reddit Enhancer Bot.
These are rich domain objects that encapsulate business logic and rules.

Entities represent things with identity that persist over time (Post, Comment).
They contain business logic methods and maintain their own invariants.

Example:
    >>> post = Post(
    ...     id="abc123",
    ...     title=PostTitle("What's your favorite Python library?"),
    ...     subreddit=SubredditName("Python"),
    ...     content="I'm looking for recommendations...",
    ...     url="https://reddit.com/...",
    ...     created_at=datetime.utcnow(),
    ...     permalink="/r/Python/comments/...",
    ... )
    >>> post.mark_processed()
    >>> assert post.is_processed()
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

from src.domain.value_objects import (
    PostId,
    CommentId,
    SubredditName,
    CommentText,
    PostTitle,
    Score,
)


class CommentStatus(Enum):
    """Status of a generated comment."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    POSTED = "posted"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class Post:
    """
    Reddit post entity.

    Represents a post from Reddit that we want to comment on.
    This is a domain entity with identity (PostId) and lifecycle.
    
    Attributes:
        id: Unique identifier for the post
        title: Post title (validated value object)
        subreddit: Name of the subreddit (validated value object)
        content: Post body text (can be empty for link posts)
        url: Direct URL to the Reddit post
        created_at: When the post was created on Reddit
        permalink: Reddit permalink (relative URL)
        processed_at: When we processed this post (None if unprocessed)
        
    Example:
        >>> post = Post(
        ...     id="abc123",
        ...     title=PostTitle("Python tips?"),
        ...     subreddit=SubredditName("Python"),
        ...     content="Looking for advice...",
        ...     url="https://reddit.com/r/Python/comments/abc123",
        ...     created_at=datetime.utcnow(),
        ...     permalink="/r/Python/comments/abc123",
        ... )
        >>> post.mark_processed()
        >>> assert post.is_processed() == True
    """

    id: PostId
    title: PostTitle
    subreddit: SubredditName
    content: str
    url: str
    created_at: datetime
    permalink: str
    processed_at: datetime | None = None

    def mark_processed(self) -> None:
        """
        Mark this post as processed.
        
        Sets the processed_at timestamp to current UTC time.
        Used to track which posts we've already generated comments for.
        """
        self.processed_at = datetime.utcnow()

    def is_processed(self) -> bool:
        """
        Check if post has been processed.
        
        Returns:
            True if post has been processed (has processed_at timestamp)
        """
        return self.processed_at is not None


@dataclass
class Comment:
    """
    Generated comment entity.

    Represents a comment we've generated (or plan to generate) for a Reddit post.
    Tracks the full lifecycle from generation → approval → posting → scoring.
    
    Attributes:
        id: Database ID (None if not yet saved)
        post_id: ID of the post this comment is for
        content: Comment text (validated value object)
        status: Current status in the workflow (PENDING, APPROVED, etc.)
        karma_score: Reddit karma score (upvotes - downvotes)
        reddit_comment_id: Reddit's ID after posting (None until posted)
        posted_at: When we posted to Reddit (None until posted)
        is_golden_example: Whether this is a high-performing example (>100 karma)
        
    Example:
        >>> comment = Comment(
        ...     id=None,
        ...     post_id="abc123",
        ...     content=CommentText("Great question! In my experience..."),
        ...     status=CommentStatus.PENDING,
        ... )
        >>> comment.approve()
        >>> assert comment.is_postable() == True
        >>> comment.mark_posted("xyz789")
        >>> comment.update_score(150)
        >>> assert comment.is_golden_example == True
    """

    id: int | None
    post_id: PostId
    content: CommentText
    status: CommentStatus = CommentStatus.PENDING
    karma_score: Score = field(default_factory=lambda: Score(0))
    reddit_comment_id: CommentId | None = None
    posted_at: datetime | None = None
    is_golden_example: bool = False

    def approve(self) -> None:
        """
        Approve this comment for posting.
        
        Changes status to APPROVED. Used in manual mode when user
        approves the comment via Telegram.
        """
        self.status = CommentStatus.APPROVED

    def reject(self) -> None:
        """
        Reject this comment.
        
        Changes status to REJECTED. Used in manual mode when user
        rejects the comment via Telegram.
        """
        self.status = CommentStatus.REJECTED

    def mark_posted(self, reddit_id: CommentId) -> None:
        """
        Mark comment as successfully posted to Reddit.
        
        Args:
            reddit_id: The comment ID returned by Reddit API
            
        Sets status to POSTED and records the Reddit comment ID and timestamp.
        """
        self.status = CommentStatus.POSTED
        self.reddit_comment_id = reddit_id
        self.posted_at = datetime.utcnow()

    def mark_failed(self) -> None:
        """
        Mark comment posting as failed.
        
        Changes status to FAILED. Used when posting to Reddit fails
        (rate limit, API error, etc.).
        """
        self.status = CommentStatus.FAILED

    def update_score(self, new_score: int) -> None:
        """
        Update karma score for this comment.
        
        Args:
            new_score: The new karma score from Reddit
            
        Automatically marks as golden example if score >= 100.
        Golden examples are used as training data for future comments.
        """
        self.karma_score = Score(new_score)
        # Mark as golden example if score is high
        if new_score >= 100:
            self.is_golden_example = True

    def is_postable(self) -> bool:
        """
        Check if comment is ready to be posted to Reddit.
        
        Returns:
            True if status is PENDING or APPROVED
            
        Comments with other statuses (POSTED, REJECTED, FAILED, SKIPPED)
        should not be posted.
        """
        return self.status in (CommentStatus.PENDING, CommentStatus.APPROVED)


@dataclass
class SuccessfulPattern:
    """
    Historical successful comment pattern.

    Used for learning what types of comments work well.
    """

    id: int | None
    pattern_text: str
    subreddit: SubredditName
    score: Score
    extracted_at: datetime = field(default_factory=datetime.utcnow)

    def is_high_quality(self, threshold: int = 50) -> bool:
        """Check if this is a high-quality pattern."""
        return self.score.value >= threshold

