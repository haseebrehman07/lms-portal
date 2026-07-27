"""add enrollment_requests table

Revision ID: 9c5ff84f22e2
Revises: 562fdfa06bdf
Create Date: 2026-07-24 15:32:38.769883

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9c5ff84f22e2'
down_revision: Union[str, Sequence[str], None] = '562fdfa06bdf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
