"""Tests for domain value objects."""

import pytest

from src.domain.value_objects import CommentText, PostTitle, Score


class TestCommentText:
    """Tests for CommentText value object."""

    def test_valid_comment_text(self):
        """Test creating valid comment text."""
        text = CommentText("This is a valid comment")

        assert str(text) == "This is a valid comment"

    def test_empty_comment_text_raises(self):
        """Test that empty comment text raises error."""
        with pytest.raises(ValueError, match="cannot be empty"):
            CommentText("")

    def test_whitespace_only_raises(self):
        """Test that whitespace-only text raises error."""
        with pytest.raises(ValueError, match="cannot be empty"):
            CommentText("   ")

    def test_too_long_comment_text_raises(self):
        """Test that very long text raises error."""
        long_text = "x" * 10001
        with pytest.raises(ValueError, match="exceeds maximum length"):
            CommentText(long_text)


class TestPostTitle:
    """Tests for PostTitle value object."""

    def test_valid_post_title(self):
        """Test creating valid post title."""
        title = PostTitle("What is the best programming language?")

        assert str(title) == "What is the best programming language?"

    def test_empty_post_title_raises(self):
        """Test that empty title raises error."""
        with pytest.raises(ValueError, match="cannot be empty"):
            PostTitle("")


class TestScore:
    """Tests for Score value object."""

    def test_valid_score(self):
        """Test creating valid score."""
        score = Score(100)

        assert int(score) == 100
        assert score.value == 100

    def test_negative_score_raises(self):
        """Test that negative score raises error."""
        with pytest.raises(ValueError, match="cannot be negative"):
            Score(-1)

    def test_score_addition(self):
        """Test adding scores."""
        score1 = Score(100)
        score2 = Score(50)

        result = score1 + score2

        assert result.value == 150

    def test_score_comparison(self):
        """Test comparing scores."""
        score1 = Score(100)
        score2 = Score(50)
        score3 = Score(100)

        assert score1 > score2
        assert score2 < score1
        assert not (score1 > score3)

