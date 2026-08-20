"""merge multiple heads

Revision ID: 639741b97a76
Revises: a1b2c3d4e5f6, fbe63089d357
Create Date: 2026-07-29 14:19:57.553263

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '639741b97a76'
down_revision: Union[str, Sequence[str], None] = ('a1b2c3d4e5f6', 'fbe63089d357')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
