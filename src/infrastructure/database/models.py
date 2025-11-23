"""SQLAlchemy database models."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class PostModel(Base):
    """Post database model."""

    __tablename__ = "posts"

    id = Column(String, primary_key=True)  # Reddit post ID
    title = Column(String, nullable=False)
    subreddit = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=True)
    url = Column(String, nullable=True)
    permalink = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    processed_at = Column(DateTime, nullable=True)

    # Relationships
    comments = relationship("CommentModel", back_populates="post", cascade="all, delete-orphan")


class CommentModel(Base):
    """Comment database model."""

    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(String, ForeignKey("posts.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    status = Column(String, default="pending", nullable=False, index=True)
    karma_score = Column(Integer, default=0, nullable=False)
    reddit_comment_id = Column(String, nullable=True, unique=True)
    posted_at = Column(DateTime, nullable=True)
    is_golden_example = Column(Boolean, default=False, nullable=False)

    # Relationships
    post = relationship("PostModel", back_populates="comments")


class SuccessfulPatternModel(Base):
    """Successful pattern database model."""

    __tablename__ = "successful_patterns"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pattern_text = Column(Text, nullable=False, unique=True)
    subreddit = Column(String, nullable=True, index=True)
    score = Column(Integer, default=0, nullable=False)
    extracted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

