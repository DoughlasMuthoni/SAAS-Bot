"""Add plan feature gate columns and fix Pro limits

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-22
"""
from alembic import op
import sqlalchemy as sa

revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add feature gate columns to plans
    op.add_column('plans', sa.Column('allow_crawl', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('plans', sa.Column('allow_file_upload', sa.Boolean(), nullable=False, server_default='1'))
    op.add_column('plans', sa.Column('max_team_members', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('plans', sa.Column('max_pages_per_crawl', sa.Integer(), nullable=False, server_default='0'))

    # Free plan — no crawl, 1 team member
    op.execute("""
        UPDATE plans SET
            allow_crawl = 0,
            allow_file_upload = 1,
            max_team_members = 1,
            max_pages_per_crawl = 0
        WHERE slug = 'free'
    """)

    # Pro plan — crawl allowed, fix conversations, 2 team members
    op.execute("""
        UPDATE plans SET
            allow_crawl = 1,
            allow_file_upload = 1,
            max_team_members = 2,
            max_pages_per_crawl = 50,
            max_conversations_per_month = 5000
        WHERE slug = 'pro'
    """)

    # Enterprise — unlimited everything
    op.execute("""
        UPDATE plans SET
            allow_crawl = 1,
            allow_file_upload = 1,
            max_team_members = -1,
            max_pages_per_crawl = -1,
            max_conversations_per_month = -1
        WHERE slug = 'enterprise'
    """)


def downgrade() -> None:
    op.drop_column('plans', 'max_pages_per_crawl')
    op.drop_column('plans', 'max_team_members')
    op.drop_column('plans', 'allow_file_upload')
    op.drop_column('plans', 'allow_crawl')
