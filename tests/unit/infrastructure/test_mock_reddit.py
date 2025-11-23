"""Tests for mock Reddit client."""

import pytest

from src.infrastructure.reddit.mock import MockRedditClient
from src.domain.entities import Post, SuccessfulPattern


class TestMockRedditClient:
    """Tests for MockRedditClient."""

    @pytest.mark.asyncio
    async def test_get_rising_posts(self):
        """Test getting mock rising posts."""
        client = MockRedditClient()

        posts = await client.get_rising_posts(["AskReddit"], limit=3)

        assert len(posts) == 3
        assert all(isinstance(p, Post) for p in posts)
        assert all(p.subreddit == "AskReddit" for p in posts)

    @pytest.mark.asyncio
    async def test_get_rising_posts_respects_limit(self):
        """Test that limit parameter is respected."""
        client = MockRedditClient()

        posts = await client.get_rising_posts(["AskReddit"], limit=2)

        assert len(posts) == 2

    @pytest.mark.asyncio
    async def test_get_top_comments(self):
        """Test getting mock comment patterns."""
        client = MockRedditClient()

        patterns = await client.get_top_comments("AskReddit", limit=3)

        assert len(patterns) == 3
        assert all(isinstance(p, SuccessfulPattern) for p in patterns)
        assert all(p.subreddit == "AskReddit" for p in patterns)

    @pytest.mark.asyncio
    async def test_post_comment(self):
        """Test mock posting a comment."""
        client = MockRedditClient()

        comment_id = await client.post_comment("test_post_123", "Test comment")

        assert comment_id is not None
        assert "mock_comment" in comment_id
        assert "test_post_123" in comment_id

    @pytest.mark.asyncio
    async def test_close(self):
        """Test closing the client."""
        client = MockRedditClient()

        # Should not raise
        await client.close()

