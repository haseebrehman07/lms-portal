"""add certificate_requests table

Revision ID: a1b2c3d4e5f6
Revises: 9c5ff84f22e2
Create Date: 2026-07-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '9c5ff84f22e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'certificate_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('course_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('enrollment_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            'status',
            sa.Enum(
                'pending', 'approved', 'rejected',
                name='certificaterequeststatusenum'
            ),
            nullable=False,
            server_default='pending'
        ),
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
        sa.ForeignKeyConstraint(['enrollment_id'], ['enrollments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['actioned_by'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index(op.f('ix_certificate_requests_id'), 'certificate_requests', ['id'])
    op.create_index(op.f('ix_certificate_requests_user_id'), 'certificate_requests', ['user_id'])
    op.create_index(op.f('ix_certificate_requests_course_id'), 'certificate_requests', ['course_id'])
    op.create_index(op.f('ix_certificate_requests_enrollment_id'), 'certificate_requests', ['enrollment_id'])
    op.create_index(op.f('ix_certificate_requests_status'), 'certificate_requests', ['status'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_certificate_requests_status'), table_name='certificate_requests')
    op.drop_index(op.f('ix_certificate_requests_enrollment_id'), table_name='certificate_requests')
    op.drop_index(op.f('ix_certificate_requests_course_id'), table_name='certificate_requests')
    op.drop_index(op.f('ix_certificate_requests_user_id'), table_name='certificate_requests')
    op.drop_index(op.f('ix_certificate_requests_id'), table_name='certificate_requests')
    op.drop_table('certificate_requests')
    op.execute('DROP TYPE IF EXISTS certificaterequeststatusenum')