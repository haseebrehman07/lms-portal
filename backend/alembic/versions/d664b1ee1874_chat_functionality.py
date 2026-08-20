"""chat functionality

Revision ID: d664b1ee1874
Revises: e0233d907964
Create Date: 2026-08-04 14:13:31.966264

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd664b1ee1874'
down_revision: Union[str, Sequence[str], None] = 'e0233d907964'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
