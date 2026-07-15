from alembic import op
import sqlalchemy as sa

revision = '409f72bbe43a'
down_revision = '45778984d7f8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # create the enum type first in postgres
    lessontypeenum = sa.Enum(
        'video', 'pdf', 'quiz', 'assignment', 'text',
        name='lessontypeenum'
    )
    lessontypeenum.create(op.get_bind(), checkfirst=True)

    # now add the column using the enum
    op.add_column(
        'lessons',
        sa.Column(
            'lesson_type',
            sa.Enum(
                'video', 'pdf', 'quiz', 'assignment', 'text',
                name='lessontypeenum'
            ),
            nullable=False,
            server_default='video'
        )
    )

    op.add_column(
        'lessons',
        sa.Column('pdf_url', sa.String(500), nullable=True)
    )

    op.add_column(
        'lessons',
        sa.Column(
            'is_free_preview',
            sa.Boolean(),
            nullable=False,
            server_default='false'
        )
    )


def downgrade() -> None:
    op.drop_column('lessons', 'is_free_preview')
    op.drop_column('lessons', 'pdf_url')
    op.drop_column('lessons', 'lesson_type')

    sa.Enum(name='lessontypeenum').drop(
        op.get_bind(), checkfirst=True
    )