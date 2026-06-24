"""Add suspended_at and suspension_reason to organizations

Revision ID: 0007
Revises: 0006
Create Date: 2026-06-24
"""
from alembic import op
import sqlalchemy as sa

revision = '0007'
down_revision = '0006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('organizations', sa.Column('suspended_at', sa.DateTime(), nullable=True))
    op.add_column('organizations', sa.Column('suspension_reason', sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column('organizations', 'suspension_reason')
    op.drop_column('organizations', 'suspended_at')
