"""Data Transfer Objects for application layer."""

from dataclasses import dataclass
from datetime import datetime


@dataclass
class PostDTO:
    """Post data transfer object."""

    id: str
    title: str
    subreddit: str
    content: str
    url: str
    permalink: str
    created_at: datetime


@dataclass
class CommentDTO:
    """Comment data transfer object."""

    id: int | None
    post_id: str
    content: str
    status: str
    karma_score: int
    posted_at: datetime | None = None


@dataclass
class GenerateCommentRequest:
    """Request for generating a comment."""

    post_id: str
    use_patterns: bool = True


@dataclass
class GenerateCommentResponse:
    """Response from comment generation."""

    comment_text: str
    patterns_used: int


@dataclass
class ScanPostsRequest:
    """Request for scanning posts."""

    subreddits: list[str]
    limit: int = 5


@dataclass
class ScanPostsResponse:
    """Response from scanning posts."""

    posts_found: int
    new_posts: int

