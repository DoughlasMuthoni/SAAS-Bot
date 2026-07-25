"""Remove redundant limit items from plan features arrays

Revision ID: 0008
Revises: 0007
Create Date: 2026-07-24

The features column for each plan contained items like "1 chatbot",
"5 knowledge sources", "500 conversations/month" which duplicate the
already-present max_bots / max_sources / max_conversations_per_month columns.
The demo-site pricing card builds those rows automatically from the numeric
columns, so they appeared twice. This migration strips the redundant entries
so only the capability features remain.
"""
from typing import Sequence, Union
import json
from alembic import op

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PLAN_FEATURES = {
    "free": [
        "PDF & DOCX ingestion",
        "FAQ ingestion",
        "Lead capture",
        "Basic analytics",
    ],
    "pro": [
        "Web crawler ingestion",
        "Source citations",
        "Custom branding",
        "5 team members",
        "Email support",
    ],
    "enterprise": [
        "Web crawler",
        "White-label widget",
        "Unlimited team members",
        "Dedicated support & SLA",
    ],
}


def upgrade() -> None:
    for slug, features in PLAN_FEATURES.items():
        op.execute(
            f"UPDATE plans SET features = '{json.dumps(features)}' WHERE slug = '{slug}'"
        )


def downgrade() -> None:
    # Restore original (redundant) features
    original = {
        "free": [
            "1 chatbot", "5 knowledge sources", "500 conversations/month",
            "PDF & DOCX ingestion", "FAQ ingestion", "Lead capture", "Basic analytics",
        ],
        "pro": [
            "10 chatbots", "100 knowledge sources", "5,000 conversations/month",
            "Web crawler ingestion", "Source citations", "Custom branding",
            "5 team members", "Email support",
        ],
        "enterprise": [
            "Unlimited chatbots", "Unlimited sources", "Unlimited conversations",
            "Web crawler", "White-label widget", "Unlimited team members",
            "Dedicated support & SLA",
        ],
    }
    for slug, features in original.items():
        op.execute(
            f"UPDATE plans SET features = '{json.dumps(features)}' WHERE slug = '{slug}'"
        )
