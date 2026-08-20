"""merge conflicting heads

Revision ID: 9b66c11349c5
Revises: 639741b97a76, d4e5f6a7b8c9
Create Date: 2026-08-03 14:33:05.947690

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9b66c11349c5'
down_revision: Union[str, Sequence[str], None] = ('639741b97a76', 'd4e5f6a7b8c9')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
