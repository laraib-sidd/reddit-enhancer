"""Use case for generating comments."""

from src.domain.entities import Post, Comment, CommentStatus
from src.domain.value_objects import PostId, CommentText
from src.domain.repositories import PatternRepository
from src.application.interfaces import IAIClient
from src.common.logging import get_logger

logger = get_logger(__name__)


class GenerateCommentUseCase:
    """
    Use case for generating AI comments for Reddit posts.

    This orchestrates fetching patterns and calling the AI service.
    """

    def __init__(
        self,
        ai_client: IAIClient,
        pattern_repository: PatternRepository,
    ):
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
            patterns = await self.pattern_repository.get_by_subreddit(
                post.subreddit, limit=5
            )

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

