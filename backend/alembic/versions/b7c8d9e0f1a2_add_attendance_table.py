"""add attendance_enabled to courses

Revision ID: c3d4e5f6a7b8
Revises: b7c8d9e0f1a2
Create Date: 2026-07-30 00:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'courses',
        sa.Column(
            'attendance_enabled',
            sa.Boolean(),
            server_default='false',
            nullable=False
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('courses', 'attendance_enabled')