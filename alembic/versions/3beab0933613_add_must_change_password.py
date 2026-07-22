from alembic import op
import sqlalchemy as sa

revision = '3beab0933613'
down_revision = '9bf48aa0ba9b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # add with server_default so existing rows get False automatically
    op.add_column(
        'users',
        sa.Column(
            'must_change_password',
            sa.Boolean(),
            nullable=False,
            server_default='false'
        )
    )


def downgrade() -> None:
    op.drop_column('users', 'must_change_password')