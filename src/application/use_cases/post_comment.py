"""Use case for posting comments."""

from src.domain.entities import Comment
from src.domain.value_objects import CommentId
from src.domain.repositories import CommentRepository
from src.application.interfaces import IRedditWriter
from src.common.logging import get_logger

logger = get_logger(__name__)


class PostCommentUseCase:
    """
    Use case for posting comments to Reddit.

    Handles posting and updating comment status.
    """

    def __init__(
        self,
        reddit_writer: IRedditWriter,
        comment_repository: CommentRepository,
    ):
        self.reddit_writer = reddit_writer
        self.comment_repository = comment_repository

    async def execute(self, comment: Comment) -> Comment:
        """
        Post a comment to Reddit.

        Args:
            comment: Comment entity to post

        Returns:
            Updated Comment entity with posted status

        Raises:
            RedditAPIError: If posting fails
        """
        logger.info(
            "use_case.post_comment.start",
            comment_id=comment.id,
            post_id=comment.post_id,
        )

        # Post to Reddit
        reddit_comment_id = await self.reddit_writer.post_comment(
            str(comment.post_id),
            str(comment.content),
        )

        # Update comment status
        if reddit_comment_id:
            comment.mark_posted(CommentId(reddit_comment_id))
            logger.info(
                "use_case.post_comment.success",
                comment_id=comment.id,
                reddit_id=reddit_comment_id,
            )
        else:
            comment.mark_failed()
            logger.error(
                "use_case.post_comment.failed",
                comment_id=comment.id,
            )

        # Save updated comment
        await self.comment_repository.save(comment)

        logger.info("use_case.post_comment.complete", comment_id=comment.id)

        return comment

