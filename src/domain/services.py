"""Domain services - business logic that doesn't fit in entities."""

from src.domain.entities import Comment, SuccessfulPattern


class CommentScoringService:
    """Service for scoring and evaluating comments."""

    @staticmethod
    def calculate_quality_score(comment: Comment) -> float:
        """
        Calculate a quality score for a comment based on various factors.

        Args:
            comment: Comment entity

        Returns:
            Quality score (0.0 to 1.0)
        """
        score = 0.0

        # Karma score contribution (max 0.4)
        karma_normalized = min(comment.karma_score.value / 100, 1.0)
        score += karma_normalized * 0.4

        # Status contribution (max 0.3)
        if comment.status.value == "posted":
            score += 0.3
        elif comment.status.value == "approved":
            score += 0.2

        # Golden example bonus (max 0.3)
        if comment.is_golden_example:
            score += 0.3

        return min(score, 1.0)

    @staticmethod
    def should_promote_to_pattern(comment: Comment, threshold: int = 50) -> bool:
        """
        Determine if a comment should be promoted to a successful pattern.

        Args:
            comment: Comment entity
            threshold: Minimum karma score

        Returns:
            True if comment should become a pattern
        """
        return (
            comment.karma_score.value >= threshold
            and comment.status.value == "posted"
            and comment.reddit_comment_id is not None
        )


class PatternMatchingService:
    """Service for matching and ranking patterns."""

    @staticmethod
    def rank_patterns(
        patterns: list[SuccessfulPattern], boost_recent: bool = True
    ) -> list[SuccessfulPattern]:
        """
        Rank patterns by relevance and quality.

        Args:
            patterns: List of patterns
            boost_recent: Whether to boost more recent patterns

        Returns:
            Ranked list of patterns
        """
        if not patterns:
            return []

        # Sort by score primarily
        sorted_patterns = sorted(patterns, key=lambda p: p.score.value, reverse=True)

        # TODO: Add recency boosting if needed
        # TODO: Add diversity to avoid similar patterns

        return sorted_patterns

    @staticmethod
    def filter_low_quality(
        patterns: list[SuccessfulPattern], min_score: int = 10
    ) -> list[SuccessfulPattern]:
        """
        Filter out low-quality patterns.

        Args:
            patterns: List of patterns
            min_score: Minimum score threshold

        Returns:
            Filtered list of patterns
        """
        return [p for p in patterns if p.score.value >= min_score]
