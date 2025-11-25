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

    def test_negative_score_allowed(self):
        """Test that negative score is allowed (Reddit karma can be negative)."""
        score = Score(-10)

        assert score.value == -10
        assert int(score) == -10
        assert score.is_negative
        assert not score.is_positive

    def test_zero_score(self):
        """Test zero score."""
        score = Score(0)

        assert score.value == 0
        assert not score.is_positive
        assert not score.is_negative

    def test_positive_score(self):
        """Test positive score properties."""
        score = Score(100)

        assert score.is_positive
        assert not score.is_negative

    def test_score_addition(self):
        """Test adding scores."""
        score1 = Score(100)
        score2 = Score(50)

        result = score1 + score2

        assert result.value == 150

    def test_score_subtraction(self):
        """Test subtracting scores."""
        score1 = Score(100)
        score2 = Score(150)

        result = score1 - score2

        assert result.value == -50

    def test_score_comparison(self):
        """Test comparing scores."""
        score1 = Score(100)
        score2 = Score(50)
        score3 = Score(100)
        score_negative = Score(-10)

        assert score1 > score2
        assert score2 < score1
        assert not (score1 > score3)
        assert score1 >= score3
        assert score1 <= score3
        assert score2 > score_negative

    def test_score_equality(self):
        """Test score equality."""
        score1 = Score(100)
        score2 = Score(100)
        score3 = Score(50)

        assert score1 == score2
        assert score1 != score3
        assert hash(score1) == hash(score2)
