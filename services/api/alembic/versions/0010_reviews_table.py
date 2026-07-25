"""reviews table

Revision ID: 0010
Revises: 0009
Create Date: 2026-07-24
"""
from alembic import op
import sqlalchemy as sa

revision = '0010'
down_revision = '0009'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'reviews',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('role', sa.String(255), nullable=True),
        sa.Column('quote', sa.Text, nullable=False),
        sa.Column('rating', sa.Integer, nullable=False, server_default='5'),
        sa.Column(
            'status',
            sa.Enum('pending', 'approved', 'rejected', name='review_status'),
            nullable=False,
            server_default='pending',
        ),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_reviews_status', 'reviews', ['status'])


def downgrade() -> None:
    op.drop_index('ix_reviews_status', 'reviews')
    op.drop_table('reviews')
    op.execute("DROP TYPE IF EXISTS review_status")
