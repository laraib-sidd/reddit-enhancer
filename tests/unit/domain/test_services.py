"""Tests for domain services."""

from src.domain.entities import Comment, CommentStatus
from src.domain.value_objects import PostId, CommentText, Score, CommentId
from src.domain.services import CommentScoringService, PatternMatchingService


class TestCommentScoringService:
    """Tests for CommentScoringService."""

    def test_calculate_quality_score_high_karma(self):
        """Test quality score with high karma."""
        comment = Comment(
            id=1,
            post_id=PostId("test"),
            content=CommentText("Great comment"),
            status=CommentStatus.POSTED,
            karma_score=Score(100),
            reddit_comment_id=CommentId("abc123"),
            is_golden_example=True,
        )

        score = CommentScoringService.calculate_quality_score(comment)

        assert score == 1.0

    def test_calculate_quality_score_low_karma(self):
        """Test quality score with low karma."""
        comment = Comment(
            id=1,
            post_id=PostId("test"),
            content=CommentText("Comment"),
            status=CommentStatus.PENDING,
            karma_score=Score(0),
        )

        score = CommentScoringService.calculate_quality_score(comment)

        assert 0.0 <= score < 0.5

    def test_should_promote_to_pattern(self):
        """Test promotion to pattern decision."""
        comment = Comment(
            id=1,
            post_id=PostId("test"),
            content=CommentText("Great comment"),
            status=CommentStatus.POSTED,
            karma_score=Score(75),
            reddit_comment_id=CommentId("abc123"),
        )

        should_promote = CommentScoringService.should_promote_to_pattern(comment, threshold=50)

        assert should_promote is True

    def test_should_not_promote_low_score(self):
        """Test that low score comments are not promoted."""
        comment = Comment(
            id=1,
            post_id=PostId("test"),
            content=CommentText("Comment"),
            status=CommentStatus.POSTED,
            karma_score=Score(10),
            reddit_comment_id=CommentId("abc123"),
        )

        should_promote = CommentScoringService.should_promote_to_pattern(comment, threshold=50)

        assert should_promote is False


class TestPatternMatchingService:
    """Tests for PatternMatchingService."""

    def test_rank_patterns(self, sample_patterns):
        """Test ranking patterns by score."""
        ranked = PatternMatchingService.rank_patterns(sample_patterns)

        assert len(ranked) == 3
        assert ranked[0].score.value == 200  # Highest first
        assert ranked[1].score.value == 100
        assert ranked[2].score.value == 75

    def test_rank_patterns_empty(self):
        """Test ranking empty patterns list."""
        ranked = PatternMatchingService.rank_patterns([])

        assert ranked == []

    def test_filter_low_quality(self, sample_patterns):
        """Test filtering low quality patterns."""
        filtered = PatternMatchingService.filter_low_quality(sample_patterns, min_score=80)

        assert len(filtered) == 2  # Only 200 and 100 remain
        assert all(p.score.value >= 80 for p in filtered)
