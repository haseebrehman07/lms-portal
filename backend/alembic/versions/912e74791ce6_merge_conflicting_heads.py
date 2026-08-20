"""merge conflicting heads

Revision ID: 912e74791ce6
Revises: 9b66c11349c5
Create Date: 2026-08-03 14:35:56.581420

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '912e74791ce6'
down_revision: Union[str, Sequence[str], None] = '9b66c11349c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
