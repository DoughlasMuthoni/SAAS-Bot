"""add cache token and cost_usd tracking to conversation_messages and usage_events

Revision ID: 0015
Revises: 0014
Create Date: 2026-07-28
"""
from alembic import op
import sqlalchemy as sa

revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "conversation_messages",
        sa.Column("cache_creation_input_tokens", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "conversation_messages",
        sa.Column("cache_read_input_tokens", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "conversation_messages",
        sa.Column("cost_usd", sa.Numeric(12, 8), nullable=False, server_default="0"),
    )
    op.add_column(
        "usage_events",
        sa.Column("cache_creation_input_tokens", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "usage_events",
        sa.Column("cache_read_input_tokens", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "usage_events",
        sa.Column("cost_usd", sa.Numeric(12, 8), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("usage_events", "cost_usd")
    op.drop_column("usage_events", "cache_read_input_tokens")
    op.drop_column("usage_events", "cache_creation_input_tokens")
    op.drop_column("conversation_messages", "cost_usd")
    op.drop_column("conversation_messages", "cache_read_input_tokens")
    op.drop_column("conversation_messages", "cache_creation_input_tokens")
