"""add session_days to courses

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-08-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'courses',
        sa.Column(
            'session_days',
            postgresql.ARRAY(sa.Integer()),
            server_default='{5,6}',
            nullable=False
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('courses', 'session_days')