"""Concrete repository implementations."""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities import Post, Comment, SuccessfulPattern, CommentStatus
from src.domain.value_objects import PostId, CommentId, SubredditName, CommentText, PostTitle, Score
from src.infrastructure.database.models import PostModel, CommentModel, SuccessfulPatternModel
from src.common.logging import get_logger
from src.common.exceptions import DatabaseError

logger = get_logger(__name__)


class SQLAlchemyPostRepository:
    """SQLAlchemy implementation of PostRepository."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def save(self, post: Post) -> Post:
        """Save a post."""
        try:
            model = PostModel(
                id=post.id,
                title=str(post.title),
                subreddit=post.subreddit,
                content=post.content,
                url=post.url,
                permalink=post.permalink,
                created_at=post.created_at,
                processed_at=post.processed_at,
            )

            self.session.add(model)
            await self.session.flush()

            logger.debug("post.saved", post_id=post.id)
            return post
        except Exception as e:
            logger.error("post.save_failed", post_id=post.id, error=str(e))
            raise DatabaseError(f"Failed to save post: {e}") from e

    async def get_by_id(self, post_id: PostId) -> Post | None:
        """Get post by ID."""
        try:
            stmt = select(PostModel).where(PostModel.id == post_id)
            result = await self.session.execute(stmt)
            model = result.scalar_one_or_none()

            if model is None:
                return None

            return self._to_entity(model)
        except Exception as e:
            logger.error("post.get_failed", post_id=post_id, error=str(e))
            raise DatabaseError(f"Failed to get post: {e}") from e

    async def exists(self, post_id: PostId) -> bool:
        """Check if post exists."""
        try:
            stmt = select(func.count()).select_from(PostModel).where(PostModel.id == post_id)
            result = await self.session.execute(stmt)
            count = result.scalar()
            return count > 0
        except Exception as e:
            logger.error("post.exists_check_failed", post_id=post_id, error=str(e))
            raise DatabaseError(f"Failed to check post existence: {e}") from e

    async def get_unprocessed(self, limit: int = 10) -> list[Post]:
        """Get unprocessed posts."""
        try:
            stmt = select(PostModel).where(PostModel.processed_at.is_(None)).limit(limit)
            result = await self.session.execute(stmt)
            models = result.scalars().all()

            return [self._to_entity(model) for model in models]
        except Exception as e:
            logger.error("post.get_unprocessed_failed", error=str(e))
            raise DatabaseError(f"Failed to get unprocessed posts: {e}") from e

    @staticmethod
    def _to_entity(model: PostModel) -> Post:
        """Convert model to entity."""
        return Post(
            id=PostId(model.id),
            title=PostTitle(model.title),
            subreddit=SubredditName(model.subreddit),
            content=model.content or "",
            url=model.url or "",
            permalink=model.permalink or "",
            created_at=model.created_at,
            processed_at=model.processed_at,
        )


class SQLAlchemyCommentRepository:
    """SQLAlchemy implementation of CommentRepository."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def save(self, comment: Comment) -> Comment:
        """Save a comment."""
        try:
            if comment.id is None:
                # New comment
                model = CommentModel(
                    post_id=comment.post_id,
                    content=str(comment.content),
                    status=comment.status.value,
                    karma_score=comment.karma_score.value,
                    reddit_comment_id=comment.reddit_comment_id,
                    posted_at=comment.posted_at,
                    is_golden_example=comment.is_golden_example,
                )
                self.session.add(model)
                await self.session.flush()
                comment.id = model.id
            else:
                # Update existing
                stmt = select(CommentModel).where(CommentModel.id == comment.id)
                result = await self.session.execute(stmt)
                model = result.scalar_one()

                model.content = str(comment.content)
                model.status = comment.status.value
                model.karma_score = comment.karma_score.value
                model.reddit_comment_id = comment.reddit_comment_id
                model.posted_at = comment.posted_at
                model.is_golden_example = comment.is_golden_example

                await self.session.flush()

            logger.info("comment.saved", comment_id=comment.id, post_id=comment.post_id)
            return comment
        except Exception as e:
            logger.error("comment.save_failed", error=str(e))
            raise DatabaseError(f"Failed to save comment: {e}") from e

    async def get_by_id(self, comment_id: int) -> Comment | None:
        """Get comment by ID."""
        try:
            stmt = select(CommentModel).where(CommentModel.id == comment_id)
            result = await self.session.execute(stmt)
            model = result.scalar_one_or_none()

            if model is None:
                return None

            return self._to_entity(model)
        except Exception as e:
            logger.error("comment.get_failed", comment_id=comment_id, error=str(e))
            raise DatabaseError(f"Failed to get comment: {e}") from e

    async def get_by_post_id(self, post_id: PostId) -> list[Comment]:
        """Get all comments for a post."""
        try:
            stmt = select(CommentModel).where(CommentModel.post_id == post_id)
            result = await self.session.execute(stmt)
            models = result.scalars().all()

            return [self._to_entity(model) for model in models]
        except Exception as e:
            logger.error("comment.get_by_post_failed", post_id=post_id, error=str(e))
            raise DatabaseError(f"Failed to get comments by post: {e}") from e

    async def get_by_status(self, status: CommentStatus, limit: int = 10) -> list[Comment]:
        """Get comments by status."""
        try:
            stmt = select(CommentModel).where(CommentModel.status == status.value).limit(limit)
            result = await self.session.execute(stmt)
            models = result.scalars().all()

            return [self._to_entity(model) for model in models]
        except Exception as e:
            logger.error("comment.get_by_status_failed", status=status.value, error=str(e))
            raise DatabaseError(f"Failed to get comments by status: {e}") from e

    async def get_golden_examples(self, limit: int = 10) -> list[Comment]:
        """Get high-performing comments."""
        try:
            stmt = (
                select(CommentModel)
                .where(CommentModel.is_golden_example.is_(True))
                .order_by(CommentModel.karma_score.desc())
                .limit(limit)
            )
            result = await self.session.execute(stmt)
            models = result.scalars().all()

            return [self._to_entity(model) for model in models]
        except Exception as e:
            logger.error("comment.get_golden_failed", error=str(e))
            raise DatabaseError(f"Failed to get golden examples: {e}") from e

    @staticmethod
    def _to_entity(model: CommentModel) -> Comment:
        """Convert model to entity."""
        return Comment(
            id=model.id,
            post_id=PostId(model.post_id),
            content=CommentText(model.content),
            status=CommentStatus(model.status),
            karma_score=Score(model.karma_score),
            reddit_comment_id=CommentId(model.reddit_comment_id)
            if model.reddit_comment_id
            else None,
            posted_at=model.posted_at,
            is_golden_example=model.is_golden_example,
        )


class SQLAlchemyPatternRepository:
    """SQLAlchemy implementation of PatternRepository."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def save(self, pattern: SuccessfulPattern) -> SuccessfulPattern:
        """Save a pattern."""
        try:
            model = SuccessfulPatternModel(
                pattern_text=pattern.pattern_text,
                subreddit=pattern.subreddit,
                score=pattern.score.value,
                extracted_at=pattern.extracted_at,
            )

            self.session.add(model)
            await self.session.flush()
            pattern.id = model.id

            # Only log at debug level to avoid flooding logs during seeding
            logger.debug("pattern.saved", pattern_id=pattern.id, subreddit=pattern.subreddit)
            return pattern
        except Exception as e:
            logger.error("pattern.save_failed", error=str(e))
            raise DatabaseError(f"Failed to save pattern: {e}") from e

    async def bulk_save(self, patterns: list[SuccessfulPattern]) -> int:
        """
        Bulk save patterns efficiently (10x faster than individual saves).

        Args:
            patterns: List of patterns to save

        Returns:
            Number of patterns saved

        Example:
            >>> patterns = await reddit_reader.get_top_comments("AskReddit", limit=60)
            >>> saved_count = await pattern_repo.bulk_save(patterns)
            >>> print(f"Saved {saved_count} patterns")
        """
        try:
            if not patterns:
                return 0

            # Convert entities to dicts for bulk insert
            pattern_dicts = [
                {
                    "pattern_text": p.pattern_text,
                    "subreddit": p.subreddit,
                    "score": p.score.value,
                    "extracted_at": p.extracted_at,
                }
                for p in patterns
            ]

            # Use bulk_insert_mappings for efficiency (10x faster)
            self.session.bulk_insert_mappings(
                SuccessfulPatternModel,
                pattern_dicts,
            )

            await self.session.flush()

            logger.info("patterns.bulk_saved", count=len(patterns))
            return len(patterns)

        except Exception as e:
            logger.error("patterns.bulk_save_failed", count=len(patterns), error=str(e))
            raise DatabaseError(f"Failed to bulk save patterns: {e}") from e

    async def get_by_subreddit(
        self, subreddit: SubredditName, limit: int = 10
    ) -> list[SuccessfulPattern]:
        """Get patterns for a specific subreddit."""
        try:
            stmt = (
                select(SuccessfulPatternModel)
                .where(SuccessfulPatternModel.subreddit == subreddit)
                .order_by(func.random())
                .limit(limit)
            )
            result = await self.session.execute(stmt)
            models = result.scalars().all()

            return [self._to_entity(model) for model in models]
        except Exception as e:
            logger.error("pattern.get_by_subreddit_failed", subreddit=subreddit, error=str(e))
            raise DatabaseError(f"Failed to get patterns by subreddit: {e}") from e

    async def get_top_patterns(self, limit: int = 10) -> list[SuccessfulPattern]:
        """Get highest scoring patterns."""
        try:
            stmt = (
                select(SuccessfulPatternModel)
                .order_by(SuccessfulPatternModel.score.desc())
                .limit(limit)
            )
            result = await self.session.execute(stmt)
            models = result.scalars().all()

            return [self._to_entity(model) for model in models]
        except Exception as e:
            logger.error("pattern.get_top_failed", error=str(e))
            raise DatabaseError(f"Failed to get top patterns: {e}") from e

    async def exists(self, pattern_text: str) -> bool:
        """Check if pattern already exists."""
        try:
            stmt = (
                select(func.count())
                .select_from(SuccessfulPatternModel)
                .where(SuccessfulPatternModel.pattern_text == pattern_text)
            )
            result = await self.session.execute(stmt)
            count = result.scalar()
            return count > 0
        except Exception as e:
            logger.error("pattern.exists_check_failed", error=str(e))
            raise DatabaseError(f"Failed to check pattern existence: {e}") from e

    async def search_similar(
        self, text: str, subreddit: SubredditName | None = None, limit: int = 5
    ) -> list[SuccessfulPattern]:
        """
        Search for similar patterns using PostgreSQL full-text search.

        Uses ts_rank to order results by relevance to the search text.
        Falls back to top-scoring patterns if no matches found.

        Args:
            text: Search text to find similar patterns
            subreddit: Optional subreddit to filter by
            limit: Maximum number of results

        Returns:
            List of matching patterns ordered by relevance
        """
        from sqlalchemy import text as sql_text

        try:
            # Build search query using PostgreSQL full-text search
            # plainto_tsquery converts text to a search query
            search_query = sql_text("""
                SELECT id, pattern_text, subreddit, score, extracted_at
                FROM reddit_bot.successful_patterns
                WHERE (:subreddit IS NULL OR subreddit = :subreddit)
                  AND to_tsvector('english', pattern_text) @@ plainto_tsquery('english', :search_text)
                ORDER BY ts_rank(to_tsvector('english', pattern_text), plainto_tsquery('english', :search_text)) DESC,
                         score DESC
                LIMIT :limit
            """)

            result = await self.session.execute(
                search_query,
                {
                    "search_text": text,
                    "subreddit": subreddit if subreddit else None,
                    "limit": limit,
                },
            )
            rows = result.fetchall()

            # If no results from full-text search, fall back to top patterns
            if not rows:
                logger.debug("pattern.search_no_fts_results", search_text=text[:50])
                return (
                    await self.get_by_subreddit(subreddit, limit)
                    if subreddit
                    else await self.get_top_patterns(limit)
                )

            patterns = [
                SuccessfulPattern(
                    id=row[0],
                    pattern_text=row[1],
                    subreddit=SubredditName(row[2]) if row[2] else SubredditName(""),
                    score=Score(row[3]),
                    extracted_at=row[4],
                )
                for row in rows
            ]

            logger.debug("pattern.search_results", count=len(patterns), search_text=text[:50])
            return patterns

        except Exception as e:
            logger.warning("pattern.search_similar_failed", error=str(e))
            # Fall back to simple query on error (e.g., if FTS not available)
            return (
                await self.get_by_subreddit(subreddit, limit)
                if subreddit
                else await self.get_top_patterns(limit)
            )

    @staticmethod
    def _to_entity(model: SuccessfulPatternModel) -> SuccessfulPattern:
        """Convert model to entity."""
        return SuccessfulPattern(
            id=model.id,
            pattern_text=model.pattern_text,
            subreddit=SubredditName(model.subreddit) if model.subreddit else SubredditName(""),
            score=Score(model.score),
            extracted_at=model.extracted_at,
        )
