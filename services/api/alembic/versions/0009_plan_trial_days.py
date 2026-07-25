"""Add trial_days to plans and plan_expires_at to organizations

Revision ID: 0009
Revises: 0008
Create Date: 2026-07-24

Anti-abuse measure: free-plan organisations are valid for a configurable
number of days (trial_days on the plan row). After that window the widget
session endpoint returns 402, blocking new conversations until the org
upgrades. Paid plans have trial_days = 0 (no expiry).

Existing free-plan orgs receive a 30-day grace period from migration time.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── plans: how many days is the plan valid after signup (0 = forever) ──
    op.add_column("plans", sa.Column("trial_days", sa.Integer(), nullable=False, server_default="0"))
    op.execute("UPDATE plans SET trial_days = 2  WHERE slug = 'free'")
    op.execute("UPDATE plans SET trial_days = 0  WHERE slug = 'pro'")
    op.execute("UPDATE plans SET trial_days = 0  WHERE slug = 'enterprise'")

    # ── organizations: when does the current plan expire (NULL = never) ────
    op.add_column("organizations", sa.Column("plan_expires_at", sa.DateTime(), nullable=True))
    # Give existing free-plan orgs a 30-day grace period so they are not
    # immediately locked out by this migration.
    op.execute(
        "UPDATE organizations SET plan_expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY) "
        "WHERE plan = 'free' AND deleted_at IS NULL"
    )


def downgrade() -> None:
    op.drop_column("organizations", "plan_expires_at")
    op.drop_column("plans", "trial_days")
