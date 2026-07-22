"""add_enrollment_requests

Revision ID: 562fdfa06bdf
Revises: 3beab0933613
Create Date: 2026-07-22 11:59:43.978244

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '562fdfa06bdf'
down_revision: Union[str, Sequence[str], None] = '3beab0933613'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
