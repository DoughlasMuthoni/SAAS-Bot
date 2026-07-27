"""add partial payment support to invoices

Revision ID: 0013
Revises: 0012
Create Date: 2026-07-27
"""

from alembic import op
import sqlalchemy as sa

revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add amount_paid column
    op.add_column(
        "invoices",
        sa.Column("amount_paid", sa.Numeric(12, 2), nullable=False, server_default="0"),
    )

    # Extend the status enum to include 'partial'
    op.execute("ALTER TABLE invoices MODIFY COLUMN status ENUM('draft','sent','partial','paid','overdue') NOT NULL DEFAULT 'draft'")


def downgrade() -> None:
    op.execute("ALTER TABLE invoices MODIFY COLUMN status ENUM('draft','sent','paid','overdue') NOT NULL DEFAULT 'draft'")
    op.drop_column("invoices", "amount_paid")
