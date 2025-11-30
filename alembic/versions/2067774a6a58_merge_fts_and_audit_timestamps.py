"""Merge FTS and audit timestamps

Revision ID: 2067774a6a58
Revises: add_audit_timestamps, add_fts
Create Date: 2025-11-30 11:50:20.590263

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2067774a6a58'
down_revision: Union[str, Sequence[str], None] = ('add_audit_timestamps', 'add_fts')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
