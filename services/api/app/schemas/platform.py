from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


# ── Organisation schemas ──────────────────────────────────────────────────────

class OrgListItem(BaseModel):
    id: str
    name: str
    slug: str
    plan: str
    is_suspended: bool
    suspension_reason: str | None
    user_count: int
    bot_count: int
    workspace_count: int
    created_at: str

    model_config = {"from_attributes": True}


class OrgDetail(OrgListItem):
    plan_expires_at: str | None
    conversation_count: int
    message_count: int
    lead_count: int
    owner_email: str | None


class AssignPlanRequest(BaseModel):
    plan: str
    plan_expires_at: date | None = None


class SuspendRequest(BaseModel):
    reason: str = ""


# ── Invoice line item ─────────────────────────────────────────────────────────

class InvoiceLineCreate(BaseModel):
    description: str
    quantity: Decimal = Decimal("1")
    unit_price: Decimal
    sort_order: int = 0


class InvoiceLineResponse(InvoiceLineCreate):
    id: str
    subtotal: Decimal

    model_config = {"from_attributes": True}


# ── Invoice ───────────────────────────────────────────────────────────────────

class InvoiceCreate(BaseModel):
    org_id: str
    issue_date: date
    due_date: date | None = None
    currency: str = "USD"
    tax_rate: Decimal = Decimal("0")
    notes: str | None = None
    items: list[InvoiceLineCreate]


class InvoiceUpdate(BaseModel):
    issue_date: date | None = None
    due_date: date | None = None
    currency: str | None = None
    tax_rate: Decimal | None = None
    notes: str | None = None
    items: list[InvoiceLineCreate] | None = None


class InvoiceResponse(BaseModel):
    id: str
    org_id: str
    org_name: str
    invoice_number: str
    status: str
    issue_date: str
    due_date: str | None
    currency: str
    notes: str | None
    subtotal: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    total: Decimal
    paid_at: str | None
    sent_at: str | None
    created_at: str
    items: list[InvoiceLineResponse]

    model_config = {"from_attributes": True}
