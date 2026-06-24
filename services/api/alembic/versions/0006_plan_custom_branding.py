"""Add allow_custom_branding to plans

Revision ID: 0006
Revises: 0005
Create Date: 2026-06-24
"""
from alembic import op
import sqlalchemy as sa

revision = '0006'
down_revision = '0005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('plans', sa.Column('allow_custom_branding', sa.Boolean(), nullable=False, server_default='0'))

    # Free plan — no custom branding (widget shows "Powered by DG ChatBot")
    op.execute("UPDATE plans SET allow_custom_branding = 0 WHERE slug = 'free'")
    # Pro — custom branding enabled (badge hidden)
    op.execute("UPDATE plans SET allow_custom_branding = 1 WHERE slug = 'pro'")
    # Enterprise — custom branding enabled
    op.execute("UPDATE plans SET allow_custom_branding = 1 WHERE slug = 'enterprise'")


def downgrade() -> None:
    op.drop_column('plans', 'allow_custom_branding')
