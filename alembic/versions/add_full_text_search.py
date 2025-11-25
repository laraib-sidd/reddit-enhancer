"""Add full-text search to comments

Revision ID: add_fts
Revises: 7655f09c4dad
Create Date: 2025-11-24

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TSVECTOR

# revision identifiers, used by Alembic.
revision = 'add_fts'
down_revision = '7655f09c4dad'
branch_labels = None
depends_on = None


def upgrade():
    """Add full-text search support to comments table."""
    # Add tsvector column for full-text search
    op.execute("""
        ALTER TABLE reddit_bot.comments 
        ADD COLUMN search_vector tsvector 
        GENERATED ALWAYS AS (to_tsvector('english', content)) STORED
    """)
    
    # Create GIN index for full-text search (10-100x faster searches)
    op.execute("""
        CREATE INDEX ix_comments_search_vector 
        ON reddit_bot.comments 
        USING gin(search_vector)
    """)


def downgrade():
    """Remove full-text search support."""
    op.execute("DROP INDEX IF EXISTS reddit_bot.ix_comments_search_vector")
    op.execute("ALTER TABLE reddit_bot.comments DROP COLUMN IF EXISTS search_vector")

