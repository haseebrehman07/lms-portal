"""Add password security columns to users

Revision ID: 4167d469882f
Revises: 562fdfa06bdf
Create Date: 2026-07-22 13:32:53.329312

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4167d469882f'
down_revision: Union[str, Sequence[str], None] = '562fdfa06bdf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
