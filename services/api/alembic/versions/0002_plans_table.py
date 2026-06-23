"""Add plans table and widen organizations.plan to VARCHAR

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-22
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Create plans table ────────────────────────────────────
    op.create_table(
        "plans",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("price_kes", sa.Integer, nullable=False, server_default="0"),
        sa.Column("price_usd", sa.Integer, nullable=False, server_default="0"),
        sa.Column("max_bots", sa.Integer, nullable=False, server_default="1"),
        sa.Column("max_sources", sa.Integer, nullable=False, server_default="5"),
        sa.Column("max_conversations_per_month", sa.Integer, nullable=False, server_default="500"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="1"),
        sa.Column("is_default", sa.Boolean, nullable=False, server_default="0"),
        sa.Column("features", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_plans_slug", "plans", ["slug"])

    # ── 2. Seed the three built-in plans ─────────────────────────
    import uuid
    from datetime import datetime
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    op.bulk_insert(
        sa.table(
            "plans",
            sa.column("id", sa.String),
            sa.column("name", sa.String),
            sa.column("slug", sa.String),
            sa.column("description", sa.String),
            sa.column("price_kes", sa.Integer),
            sa.column("price_usd", sa.Integer),
            sa.column("max_bots", sa.Integer),
            sa.column("max_sources", sa.Integer),
            sa.column("max_conversations_per_month", sa.Integer),
            sa.column("is_active", sa.Boolean),
            sa.column("is_default", sa.Boolean),
            sa.column("features", sa.JSON),
            sa.column("created_at", sa.String),
            sa.column("updated_at", sa.String),
        ),
        [
            {
                "id": str(uuid.uuid4()),
                "name": "Free",
                "slug": "free",
                "description": "Get started at no cost. Perfect for trying out DG ChatBot.",
                "price_kes": 0,
                "price_usd": 0,
                "max_bots": 1,
                "max_sources": 5,
                "max_conversations_per_month": 500,
                "is_active": True,
                "is_default": True,
                "features": ["1 chatbot", "5 knowledge sources", "500 conversations/month",
                             "PDF & DOCX ingestion", "FAQ ingestion", "Lead capture", "Basic analytics"],
                "created_at": now,
                "updated_at": now,
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Pro",
                "slug": "pro",
                "description": "For growing businesses that need more bots, sources, and conversations.",
                "price_kes": 3500,
                "price_usd": 27,
                "max_bots": 10,
                "max_sources": 100,
                "max_conversations_per_month": 5000,
                "is_active": True,
                "is_default": False,
                "features": ["10 chatbots", "100 knowledge sources", "5,000 conversations/month",
                             "Web crawler ingestion", "Source citations", "Custom branding",
                             "5 team members", "Email support"],
                "created_at": now,
                "updated_at": now,
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Enterprise",
                "slug": "enterprise",
                "description": "Unlimited scale with dedicated support and SLA.",
                "price_kes": 0,
                "price_usd": 0,
                "max_bots": -1,
                "max_sources": -1,
                "max_conversations_per_month": -1,
                "is_active": True,
                "is_default": False,
                "features": ["Unlimited chatbots", "Unlimited sources", "Unlimited conversations",
                             "Web crawler", "White-label widget", "Unlimited team members",
                             "Dedicated support & SLA"],
                "created_at": now,
                "updated_at": now,
            },
        ],
    )

    # ── 3. Widen organizations.plan from ENUM to VARCHAR(100) ────
    op.alter_column(
        "organizations",
        "plan",
        existing_type=sa.Enum("free", "pro", "enterprise", name="org_plan"),
        type_=sa.String(100),
        existing_nullable=False,
        existing_server_default="free",
    )


def downgrade() -> None:
    op.alter_column(
        "organizations",
        "plan",
        existing_type=sa.String(100),
        type_=sa.Enum("free", "pro", "enterprise", name="org_plan"),
        existing_nullable=False,
        existing_server_default="free",
    )
    op.drop_index("ix_plans_slug", table_name="plans")
    op.drop_table("plans")
