"""Replace Pro/Enterprise plans with recommended Starter/Growth/Business tiers

Revision ID: 0016
Revises: 0015
Create Date: 2026-07-28

Pricing recommendation (see cost-per-message analysis based on Haiku 4.5 /
Sonnet 5 rates): Free stays as the trial tier. "Pro" is deprecated in favour
of three paid tiers - Starter, Growth, Business - plus Enterprise as
custom/contact-sales. Existing orgs on the deprecated "pro" slug are moved
to "growth", the closest equivalent tier.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0016"
down_revision: Union[str, None] = "0015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    import uuid
    from datetime import datetime
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    # ── Deprecate "pro": deactivate, no longer the default tier ──────────
    op.execute("UPDATE plans SET is_active = 0, is_default = 0 WHERE slug = 'pro'")

    # ── Move existing orgs off the deprecated tier onto "growth" ─────────
    op.execute("UPDATE organizations SET plan = 'growth' WHERE plan = 'pro'")

    # ── Seed the new paid tiers ────────────────────────────────────────
    plans_table = sa.table(
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
        sa.column("max_team_members", sa.Integer),
        sa.column("max_pages_per_crawl", sa.Integer),
        sa.column("trial_days", sa.Integer),
        sa.column("allow_crawl", sa.Boolean),
        sa.column("allow_file_upload", sa.Boolean),
        sa.column("allow_custom_branding", sa.Boolean),
        sa.column("is_active", sa.Boolean),
        sa.column("is_default", sa.Boolean),
        sa.column("sort_order", sa.Integer),
        sa.column("features", sa.JSON),
        sa.column("created_at", sa.String),
        sa.column("updated_at", sa.String),
    )

    op.bulk_insert(
        plans_table,
        [
            {
                "id": str(uuid.uuid4()),
                "name": "Starter",
                "slug": "starter",
                "description": "For small sites getting started with an AI support assistant.",
                "price_kes": 5000,
                "price_usd": 39,
                "max_bots": 1,
                "max_sources": 25,
                "max_conversations_per_month": 500,
                "max_team_members": 2,
                "max_pages_per_crawl": 0,
                "trial_days": 0,
                "allow_crawl": False,
                "allow_file_upload": True,
                "allow_custom_branding": False,
                "is_active": True,
                "is_default": False,
                "sort_order": 2,
                "features": ["PDF & DOCX ingestion", "FAQ ingestion", "Lead capture", "Basic analytics"],
                "created_at": now,
                "updated_at": now,
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Growth",
                "slug": "growth",
                "description": "For growing businesses that need crawling, branding, and more headroom.",
                "price_kes": 16800,
                "price_usd": 129,
                "max_bots": 3,
                "max_sources": 100,
                "max_conversations_per_month": 2500,
                "max_team_members": 5,
                "max_pages_per_crawl": 100,
                "trial_days": 0,
                "allow_crawl": True,
                "allow_file_upload": True,
                "allow_custom_branding": True,
                "is_active": True,
                "is_default": True,
                "sort_order": 3,
                "features": ["Web crawler ingestion", "Source citations", "Custom branding",
                             "5 team members", "Email support"],
                "created_at": now,
                "updated_at": now,
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Business",
                "slug": "business",
                "description": "For high-volume sites that need scale and priority support.",
                "price_kes": 45500,
                "price_usd": 349,
                "max_bots": 10,
                "max_sources": 500,
                "max_conversations_per_month": 10000,
                "max_team_members": 15,
                "max_pages_per_crawl": 500,
                "trial_days": 0,
                "allow_crawl": True,
                "allow_file_upload": True,
                "allow_custom_branding": True,
                "is_active": True,
                "is_default": False,
                "sort_order": 4,
                "features": ["Web crawler ingestion", "Source citations", "Custom branding",
                             "15 team members", "Priority support"],
                "created_at": now,
                "updated_at": now,
            },
        ],
    )

    # ── Refresh Free and Enterprise descriptions/ordering to match ───────
    op.execute("UPDATE plans SET sort_order = 1 WHERE slug = 'free'")
    op.execute(
        "UPDATE plans SET description = 'Unlimited scale with dedicated support, SLA, and custom pricing.', "
        "sort_order = 5 WHERE slug = 'enterprise'"
    )


def downgrade() -> None:
    op.execute("UPDATE organizations SET plan = 'pro' WHERE plan = 'growth'")
    op.execute("UPDATE plans SET is_active = 1, is_default = 1 WHERE slug = 'pro'")
    op.execute("DELETE FROM plans WHERE slug IN ('starter', 'growth', 'business')")
    op.execute("UPDATE plans SET sort_order = 0 WHERE slug IN ('free', 'enterprise')")
    op.execute(
        "UPDATE plans SET description = 'Unlimited scale with dedicated support and SLA.' "
        "WHERE slug = 'enterprise'"
    )
