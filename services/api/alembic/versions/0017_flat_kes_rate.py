"""Recompute paid-tier KES prices using a flat 130 KES/USD rate

Revision ID: 0017
Revises: 0016
Create Date: 2026-07-28
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0017"
down_revision: Union[str, None] = "0016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

RATE = 130
NEW_KES = {
    "starter": 39 * RATE,
    "growth": 129 * RATE,
    "business": 349 * RATE,
}
OLD_KES = {
    "starter": 5000,
    "growth": 16800,
    "business": 45500,
}


def upgrade() -> None:
    for slug, kes in NEW_KES.items():
        op.execute(f"UPDATE plans SET price_kes = {kes} WHERE slug = '{slug}'")


def downgrade() -> None:
    for slug, kes in OLD_KES.items():
        op.execute(f"UPDATE plans SET price_kes = {kes} WHERE slug = '{slug}'")
