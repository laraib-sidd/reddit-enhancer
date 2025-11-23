"""Tests for application use cases."""

import pytest
from unittest.mock import AsyncMock, MagicMock

from src.domain.entities import Post, Comment, CommentStatus
from src.domain.value_objects import PostId, SubredditName, PostTitle, CommentText, Score
from src.application.use_cases.generate_comment import GenerateCommentUseCase
from src.application.use_cases.scan_posts import ScanPostsUseCase


class TestGenerateCommentUseCase:
    """Tests for GenerateCommentUseCase."""

    @pytest.mark.asyncio
    async def test_execute_with_patterns(self, sample_post, sample_patterns):
        """Test generating comment with patterns."""
        # Mock dependencies
        ai_client = AsyncMock()
        ai_client.generate_comment.return_value = "This is a great question!"

        pattern_repo = AsyncMock()
        pattern_repo.get_by_subreddit.return_value = sample_patterns

        # Create use case
        use_case = GenerateCommentUseCase(ai_client, pattern_repo)

        # Execute
        comment = await use_case.execute(sample_post, use_patterns=True)

        # Assertions
        assert isinstance(comment, Comment)
        assert comment.post_id == sample_post.id
        assert str(comment.content) == "This is a great question!"
        assert comment.status == CommentStatus.PENDING

        # Verify calls
        pattern_repo.get_by_subreddit.assert_called_once()
        ai_client.generate_comment.assert_called_once_with(sample_post, sample_patterns)

    @pytest.mark.asyncio
    async def test_execute_without_patterns(self, sample_post):
        """Test generating comment without patterns."""
        # Mock dependencies
        ai_client = AsyncMock()
        ai_client.generate_comment.return_value = "Python is a great choice!"

        pattern_repo = AsyncMock()

        # Create use case
        use_case = GenerateCommentUseCase(ai_client, pattern_repo)

        # Execute
        comment = await use_case.execute(sample_post, use_patterns=False)

        # Assertions
        assert isinstance(comment, Comment)
        assert str(comment.content) == "Python is a great choice!"

        # Verify patterns not fetched
        pattern_repo.get_by_subreddit.assert_not_called()
        ai_client.generate_comment.assert_called_once_with(sample_post, [])


class TestScanPostsUseCase:
    """Tests for ScanPostsUseCase."""

    @pytest.mark.asyncio
    async def test_execute_with_new_posts(self, sample_post):
        """Test scanning with new posts."""
        # Mock dependencies
        reddit_reader = AsyncMock()
        reddit_reader.get_rising_posts.return_value = [sample_post]

        post_repo = AsyncMock()
        post_repo.exists.return_value = False

        # Create use case
        use_case = ScanPostsUseCase(reddit_reader, post_repo)

        # Execute
        all_posts, new_posts = await use_case.execute(["AskReddit"], limit=5)

        # Assertions
        assert len(all_posts) == 1
        assert len(new_posts) == 1
        assert new_posts[0] == sample_post

        # Verify calls
        reddit_reader.get_rising_posts.assert_called_once_with(["AskReddit"], 5)
        post_repo.exists.assert_called_once()
        post_repo.save.assert_called_once()

    @pytest.mark.asyncio
    async def test_execute_with_existing_posts(self, sample_post):
        """Test scanning with already existing posts."""
        # Mock dependencies
        reddit_reader = AsyncMock()
        reddit_reader.get_rising_posts.return_value = [sample_post]

        post_repo = AsyncMock()
        post_repo.exists.return_value = True  # Post already exists

        # Create use case
        use_case = ScanPostsUseCase(reddit_reader, post_repo)

        # Execute
        all_posts, new_posts = await use_case.execute(["AskReddit"], limit=5)

        # Assertions
        assert len(all_posts) == 1
        assert len(new_posts) == 0  # No new posts

        # Verify save not called for existing post
        post_repo.save.assert_not_called()

