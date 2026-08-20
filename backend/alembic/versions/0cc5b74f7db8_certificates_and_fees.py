"""certificates and fees

Revision ID: 0cc5b74f7db8
Revises: 1a4d198a2725
Create Date: 2026-08-15 13:02:29.099060

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0cc5b74f7db8'
down_revision: Union[str, Sequence[str], None] = '1a4d198a2725'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
