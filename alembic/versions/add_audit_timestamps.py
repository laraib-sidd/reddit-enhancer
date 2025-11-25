"""Add audit timestamps (created_at, updated_at) to all tables

Revision ID: add_audit_timestamps
Revises: 7655f09c4dad
Create Date: 2025-11-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_audit_timestamps'
down_revision: Union[str, Sequence[str], None] = '7655f09c4dad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add audit timestamp columns to all tables."""
    # Add updated_at to posts table
    op.add_column(
        'posts',
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        schema='reddit_bot'
    )
    
    # Update existing rows to have updated_at = created_at
    op.execute("""
        UPDATE reddit_bot.posts 
        SET updated_at = created_at 
        WHERE updated_at IS NULL
    """)
    
    # Make updated_at non-nullable
    op.alter_column(
        'posts',
        'updated_at',
        nullable=False,
        schema='reddit_bot'
    )
    
    # Add created_at and updated_at to comments table
    op.add_column(
        'comments',
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        schema='reddit_bot'
    )
    op.add_column(
        'comments',
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        schema='reddit_bot'
    )
    
    # Update existing rows
    op.execute("""
        UPDATE reddit_bot.comments 
        SET created_at = COALESCE(posted_at, NOW()),
            updated_at = COALESCE(posted_at, NOW())
        WHERE created_at IS NULL
    """)
    
    # Make non-nullable
    op.alter_column(
        'comments',
        'created_at',
        nullable=False,
        schema='reddit_bot'
    )
    op.alter_column(
        'comments',
        'updated_at',
        nullable=False,
        schema='reddit_bot'
    )
    
    # Add created_at and updated_at to successful_patterns table
    op.add_column(
        'successful_patterns',
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        schema='reddit_bot'
    )
    op.add_column(
        'successful_patterns',
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        schema='reddit_bot'
    )
    
    # Update existing rows
    op.execute("""
        UPDATE reddit_bot.successful_patterns 
        SET created_at = extracted_at,
            updated_at = extracted_at
        WHERE created_at IS NULL
    """)
    
    # Make non-nullable
    op.alter_column(
        'successful_patterns',
        'created_at',
        nullable=False,
        schema='reddit_bot'
    )
    op.alter_column(
        'successful_patterns',
        'updated_at',
        nullable=False,
        schema='reddit_bot'
    )
    
    # Update posts.created_at to be timezone-aware
    op.alter_column(
        'posts',
        'created_at',
        type_=sa.DateTime(timezone=True),
        schema='reddit_bot'
    )
    
    # Update comments.posted_at to be timezone-aware
    op.alter_column(
        'comments',
        'posted_at',
        type_=sa.DateTime(timezone=True),
        schema='reddit_bot'
    )
    
    # Update successful_patterns.extracted_at to be timezone-aware
    op.alter_column(
        'successful_patterns',
        'extracted_at',
        type_=sa.DateTime(timezone=True),
        schema='reddit_bot'
    )


def downgrade() -> None:
    """Remove audit timestamp columns."""
    # Remove from posts
    op.drop_column('posts', 'updated_at', schema='reddit_bot')
    
    # Remove from comments
    op.drop_column('comments', 'created_at', schema='reddit_bot')
    op.drop_column('comments', 'updated_at', schema='reddit_bot')
    
    # Remove from successful_patterns
    op.drop_column('successful_patterns', 'created_at', schema='reddit_bot')
    op.drop_column('successful_patterns', 'updated_at', schema='reddit_bot')
    
    # Revert timezone-aware columns
    op.alter_column(
        'posts',
        'created_at',
        type_=sa.DateTime(timezone=False),
        schema='reddit_bot'
    )
    op.alter_column(
        'comments',
        'posted_at',
        type_=sa.DateTime(timezone=False),
        schema='reddit_bot'
    )
    op.alter_column(
        'successful_patterns',
        'extracted_at',
        type_=sa.DateTime(timezone=False),
        schema='reddit_bot'
    )

