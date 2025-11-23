from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float, create_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

Base = declarative_base()

class Post(Base):
    __tablename__ = 'posts'

    id = Column(String, primary_key=True)  # Reddit ID (e.g., "t3_xyz")
    title = Column(String, nullable=False)
    subreddit = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    
    comments = relationship("Comment", back_populates="post")

class Comment(Base):
    __tablename__ = 'comments'

    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(String, ForeignKey('posts.id'), nullable=False)
    content = Column(Text, nullable=False)
    karma_score = Column(Integer, default=0)
    status = Column(String, default='pending')  # pending, posted, rejected, skipped
    reddit_comment_id = Column(String, nullable=True) # The actual ID on Reddit after posting
    posted_at = Column(DateTime, nullable=True)
    is_golden_example = Column(Boolean, default=False) # If it performed really well

    post = relationship("Post", back_populates="comments")

class SuccessfulPattern(Base):
    __tablename__ = 'successful_patterns'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    pattern_text = Column(Text, nullable=False) # The text of a successful comment (from scraping)
    subreddit = Column(String, nullable=True)
    score = Column(Integer, default=0) # Karma score
    extracted_at = Column(DateTime, default=datetime.utcnow)
    
# Database Connection
# We use sync engine for initial schema creation and simple scripts, async for the bot if needed.
# For simplicity in this MVP, I'll stick to sync for now as traffic is low, but structure it for easy switch.

DB_CONNECTION_STRING = os.getenv("DB_CONNECTION_STRING")

# Fallback to sqlite if no connection string (for local dev without supabase)
if not DB_CONNECTION_STRING:
    DB_CONNECTION_STRING = "sqlite:///karma_data.db"

engine = create_engine(DB_CONNECTION_STRING)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

