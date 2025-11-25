"""
Use case for generating AI comments.

This module implements the GenerateCommentUseCase which orchestrates
the comment generation process by:
1. Fetching relevant successful patterns from history
2. Calling the AI service to generate a comment
3. Creating a Comment entity with the result

This is an application layer component that coordinates domain logic
and infrastructure services.
"""

from src.domain.entities import Post, Comment, CommentStatus
from src.domain.value_objects import CommentText
from src.domain.repositories import PatternRepository
from src.application.interfaces import IAIClient
from src.common.logging import get_logger

logger = get_logger(__name__)


class GenerateCommentUseCase:
    """
    Use case for generating AI comments for Reddit posts.

    This orchestrates the comment generation workflow:
    - Fetches successful patterns from the same subreddit
    - Falls back to top patterns if none found
    - Calls AI service with post + patterns as context
    - Returns a Comment entity ready to be posted

    Attributes:
        ai_client: Client for AI service (Claude)
        pattern_repository: Repository for successful comment patterns

    Example:
        >>> use_case = GenerateCommentUseCase(ai_client, pattern_repo)
        >>> post = await post_repo.get_by_id("abc123")
        >>> comment = await use_case.execute(post, use_patterns=True)
        >>> print(comment.content)  # Generated comment text
        >>> await comment_repo.save(comment)
    """

    def __init__(
        self,
        ai_client: IAIClient,
        pattern_repository: PatternRepository,
    ):
        """
        Initialize the use case.

        Args:
            ai_client: Client for calling AI service
            pattern_repository: Repository for fetching successful patterns
        """
        self.ai_client = ai_client
        self.pattern_repository = pattern_repository

    async def execute(self, post: Post, use_patterns: bool = True) -> Comment:
        """
        Generate a comment for a post.

        Args:
            post: Post to generate comment for
            use_patterns: Whether to use historical patterns

        Returns:
            Generated Comment entity

        Raises:
            AIGenerationError: If generation fails
        """
        logger.info(
            "use_case.generate_comment.start",
            post_id=post.id,
            subreddit=post.subreddit,
            use_patterns=use_patterns,
        )

        # Fetch relevant patterns if requested
        patterns = []
        if use_patterns:
            patterns = await self.pattern_repository.get_by_subreddit(post.subreddit, limit=5)

            # Fallback to top patterns if none found for subreddit
            if not patterns:
                patterns = await self.pattern_repository.get_top_patterns(limit=5)

            logger.info(
                "use_case.generate_comment.patterns_fetched",
                count=len(patterns),
            )

        # Generate comment using AI
        comment_text = await self.ai_client.generate_comment(post, patterns)

        # Create Comment entity
        comment = Comment(
            id=None,
            post_id=post.id,
            content=CommentText(comment_text),
            status=CommentStatus.PENDING,
        )

        logger.info(
            "use_case.generate_comment.complete",
            post_id=post.id,
            comment_length=len(comment_text),
        )

        return comment
