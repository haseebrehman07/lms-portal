"""chat functionality

Revision ID: e0233d907964
Revises: 9958173ee0f6
Create Date: 2026-08-04 13:14:06.041868

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e0233d907964'
down_revision: Union[str, Sequence[str], None] = '9958173ee0f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
