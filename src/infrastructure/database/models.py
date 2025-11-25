"""SQLAlchemy database models with schema and indexes."""

from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import declarative_base, relationship

from src.config.constants import DB_SCHEMA_NAME

Base = declarative_base()


class PostModel(Base):
    """Post database model."""

    __tablename__ = "posts"
    __table_args__ = (
        # Composite index for finding unprocessed posts by subreddit and date
        Index("ix_posts_subreddit_created", "subreddit", "created_at"),
        Index("ix_posts_processed_created", "processed_at", "created_at"),
        # Single column indexes
        Index("ix_posts_created_at", "created_at"),
        {"schema": DB_SCHEMA_NAME},
    )

    id = Column(String, primary_key=True)  # Reddit post ID
    title = Column(String, nullable=False)
    subreddit = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    url = Column(String, nullable=True)
    permalink = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    processed_at = Column(DateTime, nullable=True)

    # Relationships
    comments = relationship("CommentModel", back_populates="post", cascade="all, delete-orphan")


class CommentModel(Base):
    """Comment database model with full-text search support."""

    __tablename__ = "comments"
    __table_args__ = (
        # Composite indexes for common queries
        Index("ix_comments_post_status", "post_id", "status"),
        Index("ix_comments_status_karma", "status", "karma_score"),
        Index("ix_comments_golden_karma", "is_golden_example", "karma_score"),
        # Single column indexes
        Index("ix_comments_posted_at", "posted_at"),
        Index("ix_comments_karma_score", "karma_score"),
        {"schema": DB_SCHEMA_NAME},
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(String, ForeignKey(f"{DB_SCHEMA_NAME}.posts.id"), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String, default="pending", nullable=False)
    karma_score = Column(Integer, default=0, nullable=False)
    reddit_comment_id = Column(String, nullable=True, unique=True)
    posted_at = Column(DateTime(timezone=True), nullable=True)
    is_golden_example = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    post = relationship("PostModel", back_populates="comments")
    
    # Note: Full-text search vector will be added via migration
    # search_vector = Column(TSVECTOR, Computed("to_tsvector('english', content)", persisted=True))
    # Index("ix_comments_search_vector", "search_vector", postgresql_using="gin")


class SuccessfulPatternModel(Base):
    """Successful pattern database model."""

    __tablename__ = "successful_patterns"
    __table_args__ = (
        # Composite index for finding patterns by subreddit and score
        Index("ix_patterns_subreddit_score", "subreddit", "score"),
        # Single column indexes
        Index("ix_patterns_score", "score"),
        Index("ix_patterns_extracted_at", "extracted_at"),
        {"schema": DB_SCHEMA_NAME},
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    pattern_text = Column(Text, nullable=False, unique=True)
    subreddit = Column(String, nullable=True)
    score = Column(Integer, default=0, nullable=False)
    extracted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

