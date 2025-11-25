"""Tests for domain entities."""

from datetime import datetime

from src.domain.entities import Post, Comment, SuccessfulPattern, CommentStatus
from src.domain.value_objects import PostId, SubredditName, PostTitle, CommentText, CommentId, Score


class TestPost:
    """Tests for Post entity."""

    def test_post_creation(self):
        """Test creating a post."""
        post = Post(
            id=PostId("test123"),
            title=PostTitle("Test Title"),
            subreddit=SubredditName("AskReddit"),
            content="Test content",
            url="https://reddit.com/test",
            created_at=datetime.now(),
            permalink="/r/AskReddit/test",
        )

        assert post.id == "test123"
        assert str(post.title) == "Test Title"
        assert not post.is_processed()

    def test_mark_processed(self, sample_post):
        """Test marking a post as processed."""
        assert not sample_post.is_processed()

        sample_post.mark_processed()

        assert sample_post.is_processed()
        assert sample_post.processed_at is not None


class TestComment:
    """Tests for Comment entity."""

    def test_comment_creation(self, sample_post):
        """Test creating a comment."""
        comment = Comment(
            id=None,
            post_id=sample_post.id,
            content=CommentText("Test comment"),
            status=CommentStatus.PENDING,
        )

        assert comment.post_id == sample_post.id
        assert str(comment.content) == "Test comment"
        assert comment.status == CommentStatus.PENDING
        assert comment.is_postable()

    def test_approve_comment(self, sample_comment):
        """Test approving a comment."""
        sample_comment.approve()

        assert sample_comment.status == CommentStatus.APPROVED
        assert sample_comment.is_postable()

    def test_reject_comment(self, sample_comment):
        """Test rejecting a comment."""
        sample_comment.reject()

        assert sample_comment.status == CommentStatus.REJECTED
        assert not sample_comment.is_postable()

    def test_mark_posted(self, sample_comment):
        """Test marking a comment as posted."""
        reddit_id = CommentId("reddit_comment_123")
        sample_comment.mark_posted(reddit_id)

        assert sample_comment.status == CommentStatus.POSTED
        assert sample_comment.reddit_comment_id == reddit_id
        assert sample_comment.posted_at is not None
        assert not sample_comment.is_postable()

    def test_update_score(self, sample_comment):
        """Test updating comment score."""
        sample_comment.update_score(150)

        assert sample_comment.karma_score.value == 150
        assert sample_comment.is_golden_example

    def test_update_score_low(self, sample_comment):
        """Test updating comment score with low value."""
        sample_comment.update_score(50)

        assert sample_comment.karma_score.value == 50
        assert not sample_comment.is_golden_example


class TestSuccessfulPattern:
    """Tests for SuccessfulPattern entity."""

    def test_pattern_creation(self):
        """Test creating a pattern."""
        pattern = SuccessfulPattern(
            id=None,
            pattern_text="Great answer!",
            subreddit=SubredditName("AskReddit"),
            score=Score(100),
        )

        assert pattern.pattern_text == "Great answer!"
        assert pattern.subreddit == "AskReddit"
        assert pattern.score.value == 100

    def test_is_high_quality(self, sample_pattern):
        """Test high quality check."""
        assert sample_pattern.is_high_quality(threshold=50)
        assert sample_pattern.is_high_quality(threshold=150)
        assert not sample_pattern.is_high_quality(threshold=200)
