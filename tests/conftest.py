"""Pytest configuration and fixtures."""

import pytest
from datetime import datetime

from src.domain.entities import Post, Comment, SuccessfulPattern, CommentStatus
from src.domain.value_objects import PostId, SubredditName, PostTitle, CommentText, Score


@pytest.fixture
def sample_post() -> Post:
    """Sample post for testing."""
    return Post(
        id=PostId("test_post_123"),
        title=PostTitle("What is the best programming language?"),
        subreddit=SubredditName("AskReddit"),
        content="I want to learn programming but don't know where to start.",
        url="https://reddit.com/r/AskReddit/test",
        created_at=datetime.now(),
        permalink="/r/AskReddit/comments/test/",
    )


@pytest.fixture
def sample_comment(sample_post: Post) -> Comment:
    """Sample comment for testing."""
    return Comment(
        id=1,
        post_id=sample_post.id,
        content=CommentText("Python is a great choice for beginners!"),
        status=CommentStatus.PENDING,
        karma_score=Score(0),
    )


@pytest.fixture
def sample_pattern() -> SuccessfulPattern:
    """Sample successful pattern for testing."""
    return SuccessfulPattern(
        id=1,
        pattern_text="This is a great question!",
        subreddit=SubredditName("AskReddit"),
        score=Score(150),
    )


@pytest.fixture
def sample_patterns() -> list[SuccessfulPattern]:
    """Multiple sample patterns for testing."""
    return [
        SuccessfulPattern(
            id=1,
            pattern_text="Great question!",
            subreddit=SubredditName("AskReddit"),
            score=Score(100),
        ),
        SuccessfulPattern(
            id=2,
            pattern_text="As someone who works in this field...",
            subreddit=SubredditName("AskReddit"),
            score=Score(200),
        ),
        SuccessfulPattern(
            id=3,
            pattern_text="Fun fact about this...",
            subreddit=SubredditName("AskReddit"),
            score=Score(75),
        ),
    ]
