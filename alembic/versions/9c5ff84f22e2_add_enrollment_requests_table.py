"""add enrollment_requests table

Revision ID: 9c5ff84f22e2
Revises: 562fdfa06bdf
Create Date: 2026-07-24 15:32:38.769883

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '9c5ff84f22e2'
down_revision: Union[str, Sequence[str], None] = '562fdfa06bdf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'enrollment_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('course_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            'status',
            sa.Enum(
                'pending', 'approved', 'rejected',
                name='enrollmentrequeststatusenum'
            ),
            nullable=False,
            server_default='pending'
        ),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('admin_note', sa.Text(), nullable=True),
        sa.Column(
            'requested_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False
        ),
        sa.Column('actioned_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('actioned_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['actioned_by'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index(
        op.f('ix_enrollment_requests_id'),
        'enrollment_requests',
        ['id']
    )
    op.create_index(
        op.f('ix_enrollment_requests_user_id'),
        'enrollment_requests',
        ['user_id']
    )
    op.create_index(
        op.f('ix_enrollment_requests_course_id'),
        'enrollment_requests',
        ['course_id']
    )
    op.create_index(
        op.f('ix_enrollment_requests_status'),
        'enrollment_requests',
        ['status']
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_enrollment_requests_status'), table_name='enrollment_requests')
    op.drop_index(op.f('ix_enrollment_requests_course_id'), table_name='enrollment_requests')
    op.drop_index(op.f('ix_enrollment_requests_user_id'), table_name='enrollment_requests')
    op.drop_index(op.f('ix_enrollment_requests_id'), table_name='enrollment_requests')
    op.drop_table('enrollment_requests')
    op.execute('DROP TYPE IF EXISTS enrollmentrequeststatusenum')