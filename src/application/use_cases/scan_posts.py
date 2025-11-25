"""Use case for scanning Reddit posts."""

from src.domain.entities import Post
from src.domain.repositories import PostRepository
from src.application.interfaces import IRedditReader
from src.common.logging import get_logger

logger = get_logger(__name__)


class ScanPostsUseCase:
    """
    Use case for scanning rising Reddit posts.

    Checks for new posts and saves them to the database.
    """

    def __init__(
        self,
        reddit_reader: IRedditReader,
        post_repository: PostRepository,
    ):
        self.reddit_reader = reddit_reader
        self.post_repository = post_repository

    async def execute(
        self,
        subreddits: list[str],
        limit: int = 5,
    ) -> tuple[list[Post], list[Post]]:
        """
        Scan for rising posts.

        Args:
            subreddits: List of subreddit names to scan
            limit: Maximum posts to fetch

        Returns:
            Tuple of (all posts, new posts only)

        Raises:
            RedditAPIError: If fetching fails
        """
        logger.info(
            "use_case.scan_posts.start",
            subreddits=subreddits,
            limit=limit,
        )

        # Fetch rising posts
        posts = await self.reddit_reader.get_rising_posts(subreddits, limit)

        logger.info("use_case.scan_posts.fetched", count=len(posts))

        # Filter out already processed posts
        new_posts = []
        for post in posts:
            exists = await self.post_repository.exists(post.id)
            if not exists:
                # Save new post
                await self.post_repository.save(post)
                new_posts.append(post)
            else:
                logger.debug("use_case.scan_posts.skipping_existing", post_id=post.id)

        logger.info(
            "use_case.scan_posts.complete",
            total=len(posts),
            new=len(new_posts),
        )

        return posts, new_posts
