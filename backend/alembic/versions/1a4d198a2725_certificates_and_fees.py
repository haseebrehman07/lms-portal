"""certificates and fees

Revision ID: 1a4d198a2725
Revises: b8c9d0e1f2a3, d664b1ee1874
Create Date: 2026-08-15 12:50:28.449934

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1a4d198a2725'
down_revision: Union[str, Sequence[str], None] = ('b8c9d0e1f2a3', 'd664b1ee1874')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
