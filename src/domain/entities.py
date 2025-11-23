"""Domain entities - core business objects."""

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
        """Mark this post as processed."""
        self.processed_at = datetime.utcnow()

    def is_processed(self) -> bool:
        """Check if post has been processed."""
        return self.processed_at is not None


@dataclass
class Comment:
    """
    Generated comment entity.

    Represents a comment we generated or are planning to post.
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
        """Approve this comment for posting."""
        self.status = CommentStatus.APPROVED

    def reject(self) -> None:
        """Reject this comment."""
        self.status = CommentStatus.REJECTED

    def mark_posted(self, reddit_id: CommentId) -> None:
        """Mark comment as successfully posted."""
        self.status = CommentStatus.POSTED
        self.reddit_comment_id = reddit_id
        self.posted_at = datetime.utcnow()

    def mark_failed(self) -> None:
        """Mark comment posting as failed."""
        self.status = CommentStatus.FAILED

    def update_score(self, new_score: int) -> None:
        """Update karma score."""
        self.karma_score = Score(new_score)
        # Mark as golden example if score is high
        if new_score >= 100:
            self.is_golden_example = True

    def is_postable(self) -> bool:
        """Check if comment is ready to be posted."""
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

