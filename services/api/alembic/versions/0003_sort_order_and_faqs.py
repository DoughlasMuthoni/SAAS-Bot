"""Add sort_order to plans, create platform_faqs

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-22
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Add sort_order to plans ────────────────────────────────
    op.add_column("plans", sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"))
    op.create_index("ix_plans_sort_order", "plans", ["sort_order"])

    # Set initial ordering: free=0, pro=1, enterprise=2
    op.execute("UPDATE plans SET sort_order = 0 WHERE slug = 'free'")
    op.execute("UPDATE plans SET sort_order = 1 WHERE slug = 'pro'")
    op.execute("UPDATE plans SET sort_order = 2 WHERE slug = 'enterprise'")

    # ── 2. Create platform_faqs table ────────────────────────────
    op.create_table(
        "platform_faqs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("question", sa.Text, nullable=False),
        sa.Column("answer", sa.Text, nullable=False),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_platform_faqs_sort_order", "platform_faqs", ["sort_order"])

    # ── 3. Seed initial FAQs ──────────────────────────────────────
    import uuid
    from datetime import datetime

    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    faq_table = sa.table(
        "platform_faqs",
        sa.column("id", sa.String),
        sa.column("question", sa.String),
        sa.column("answer", sa.String),
        sa.column("sort_order", sa.Integer),
        sa.column("is_active", sa.Boolean),
        sa.column("created_at", sa.String),
        sa.column("updated_at", sa.String),
    )

    op.bulk_insert(faq_table, [
        {
            "id": str(uuid.uuid4()),
            "question": "Will the bot ever make up answers?",
            "answer": "No. The bot only answers from the content you upload. If the answer is not in your knowledge base, it will say so clearly and offer to take the visitor's contact details.",
            "sort_order": 0,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()),
            "question": "Which file types can I upload?",
            "answer": "Currently PDF, plain text (.txt), and FAQ pairs through the admin dashboard. Web crawler and DOCX support are coming in the next release.",
            "sort_order": 1,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()),
            "question": "Can I embed the bot on WordPress or Shopify?",
            "answer": "Yes. Paste the one-line script tag into your theme's footer template. It works on any platform that lets you add custom HTML — WordPress, Shopify, Webflow, plain HTML, and more.",
            "sort_order": 2,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()),
            "question": "How is tenant data isolated?",
            "answer": "Every knowledge source, conversation, and retrieval query is strictly filtered by workspace ID. There is no shared index — one bot can never see another's content.",
            "sort_order": 3,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()),
            "question": "Can I change the bot's appearance?",
            "answer": "Yes. The admin panel lets you set a brand color, choose light or dark theme, and pick the widget position. Changes take effect immediately.",
            "sort_order": 4,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()),
            "question": "Are payments processed in KES?",
            "answer": "Yes. All plans are billed in Kenyan Shillings (KES). We support M-Pesa and card payments.",
            "sort_order": 5,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
    ])


def downgrade() -> None:
    op.drop_index("ix_platform_faqs_sort_order", table_name="platform_faqs")
    op.drop_table("platform_faqs")
    op.drop_index("ix_plans_sort_order", table_name="plans")
    op.drop_column("plans", "sort_order")
