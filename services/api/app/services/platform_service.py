from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    Bot,
    Conversation,
    ConversationMessage,
    Lead,
    Organization,
    User,
    Workspace,
)
from app.models.invoice import Invoice, InvoiceItem
from app.schemas.platform import (
    AssignPlanRequest,
    InvoiceCreate,
    InvoiceLineResponse,
    InvoiceResponse,
    InvoiceUpdate,
    OrgDetail,
    OrgListItem,
    RecordPaymentRequest,
)
from app.models.base import generate_uuid


class PlatformService:

    # ── Organisations ──────────────────────────────────────────────────

    @staticmethod
    async def list_orgs(db: AsyncSession) -> list[OrgListItem]:
        result = await db.execute(
            select(Organization)
            .where(Organization.deleted_at.is_(None))
            .order_by(Organization.created_at.desc())
        )
        orgs = result.scalars().all()

        items = []
        for org in orgs:
            users_count = (await db.execute(
                select(func.count()).select_from(User)
                .where(User.org_id == org.id, User.deleted_at.is_(None))
            )).scalar_one()
            bots_count = (await db.execute(
                select(func.count()).select_from(Bot)
                .where(Bot.org_id == org.id, Bot.deleted_at.is_(None))
            )).scalar_one()
            ws_count = (await db.execute(
                select(func.count()).select_from(Workspace)
                .where(Workspace.org_id == org.id, Workspace.deleted_at.is_(None))
            )).scalar_one()

            items.append(OrgListItem(
                id=org.id,
                name=org.name,
                slug=org.slug,
                plan=org.plan,
                is_suspended=org.suspended_at is not None,
                suspension_reason=org.suspension_reason,
                user_count=users_count,
                bot_count=bots_count,
                workspace_count=ws_count,
                created_at=org.created_at.isoformat(),
            ))
        return items

    @staticmethod
    async def get_org_detail(db: AsyncSession, org_id: str) -> OrgDetail | None:
        result = await db.execute(
            select(Organization).where(Organization.id == org_id, Organization.deleted_at.is_(None))
        )
        org = result.scalar_one_or_none()
        if org is None:
            return None

        users_count = (await db.execute(
            select(func.count()).select_from(User)
            .where(User.org_id == org.id, User.deleted_at.is_(None))
        )).scalar_one()
        bots_count = (await db.execute(
            select(func.count()).select_from(Bot)
            .where(Bot.org_id == org.id, Bot.deleted_at.is_(None))
        )).scalar_one()
        ws_count = (await db.execute(
            select(func.count()).select_from(Workspace)
            .where(Workspace.org_id == org.id, Workspace.deleted_at.is_(None))
        )).scalar_one()

        # Workspace ids for this org
        ws_ids_result = await db.execute(
            select(Workspace.id).where(Workspace.org_id == org.id, Workspace.deleted_at.is_(None))
        )
        ws_ids = [r[0] for r in ws_ids_result.all()]

        conv_count = 0
        msg_count = 0
        lead_count = 0
        if ws_ids:
            conv_count = (await db.execute(
                select(func.count()).select_from(Conversation)
                .where(Conversation.workspace_id.in_(ws_ids))
            )).scalar_one()
            msg_count = (await db.execute(
                select(func.count()).select_from(ConversationMessage)
                .join(Conversation, ConversationMessage.conversation_id == Conversation.id)
                .where(Conversation.workspace_id.in_(ws_ids))
            )).scalar_one()
            lead_count = (await db.execute(
                select(func.count()).select_from(Lead)
                .where(Lead.workspace_id.in_(ws_ids))
            )).scalar_one()

        # Owner email
        owner_result = await db.execute(
            select(User.email).where(User.org_id == org.id, User.role == "owner", User.deleted_at.is_(None))
            .limit(1)
        )
        owner_email = owner_result.scalar_one_or_none()

        return OrgDetail(
            id=org.id,
            name=org.name,
            slug=org.slug,
            plan=org.plan,
            plan_expires_at=org.plan_expires_at.isoformat() if org.plan_expires_at else None,
            is_suspended=org.suspended_at is not None,
            suspension_reason=org.suspension_reason,
            user_count=users_count,
            bot_count=bots_count,
            workspace_count=ws_count,
            conversation_count=conv_count,
            message_count=msg_count,
            lead_count=lead_count,
            owner_email=owner_email,
            created_at=org.created_at.isoformat(),
        )

    @staticmethod
    async def assign_plan(db: AsyncSession, org_id: str, body: AssignPlanRequest) -> None:
        result = await db.execute(
            select(Organization).where(Organization.id == org_id, Organization.deleted_at.is_(None))
        )
        org = result.scalar_one_or_none()
        if org is None:
            raise ValueError("Organisation not found")
        org.plan = body.plan
        if body.plan_expires_at:
            org.plan_expires_at = datetime.combine(body.plan_expires_at, datetime.min.time())
        else:
            org.plan_expires_at = None
        await db.commit()

    @staticmethod
    async def suspend_org(db: AsyncSession, org_id: str, reason: str) -> None:
        result = await db.execute(
            select(Organization).where(Organization.id == org_id, Organization.deleted_at.is_(None))
        )
        org = result.scalar_one_or_none()
        if org is None:
            raise ValueError("Organisation not found")
        org.suspended_at = datetime.now(timezone.utc)
        org.suspension_reason = reason or None
        await db.commit()

    @staticmethod
    async def activate_org(db: AsyncSession, org_id: str) -> None:
        result = await db.execute(
            select(Organization).where(Organization.id == org_id, Organization.deleted_at.is_(None))
        )
        org = result.scalar_one_or_none()
        if org is None:
            raise ValueError("Organisation not found")
        org.suspended_at = None
        org.suspension_reason = None
        await db.commit()

    # ── Invoices ───────────────────────────────────────────────────────

    @staticmethod
    async def _next_invoice_number(db: AsyncSession) -> str:
        year = datetime.now().year
        count = (await db.execute(
            select(func.count()).select_from(Invoice)
            .where(func.year(Invoice.created_at) == year)
        )).scalar_one()
        return f"INV-{year}-{(count + 1):04d}"

    @staticmethod
    def _invoice_to_response(inv: Invoice) -> InvoiceResponse:
        amount_paid = inv.amount_paid or Decimal("0")
        balance_due = max(inv.total - amount_paid, Decimal("0"))
        return InvoiceResponse(
            id=inv.id,
            org_id=inv.org_id,
            org_name=inv.organization.name if inv.organization else "",
            invoice_number=inv.invoice_number,
            status=inv.status,
            issue_date=inv.issue_date.isoformat(),
            due_date=inv.due_date.isoformat() if inv.due_date else None,
            currency=inv.currency,
            notes=inv.notes,
            subtotal=inv.subtotal,
            tax_rate=inv.tax_rate,
            tax_amount=inv.tax_amount,
            total=inv.total,
            amount_paid=amount_paid,
            balance_due=balance_due,
            paid_at=inv.paid_at.isoformat() if inv.paid_at else None,
            sent_at=inv.sent_at.isoformat() if inv.sent_at else None,
            created_at=inv.created_at.isoformat(),
            items=[
                InvoiceLineResponse(
                    id=item.id,
                    description=item.description,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    subtotal=item.subtotal,
                    sort_order=item.sort_order,
                )
                for item in inv.items
            ],
        )

    @staticmethod
    async def _fetch_invoice(db: AsyncSession, invoice_id: str) -> Invoice | None:
        result = await db.execute(
            select(Invoice)
            .options(selectinload(Invoice.organization), selectinload(Invoice.items))
            .where(Invoice.id == invoice_id, Invoice.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    @staticmethod
    def _compute_totals(items_data: list, tax_rate: Decimal) -> tuple[Decimal, Decimal, Decimal]:
        subtotal = sum(
            (item.quantity * item.unit_price) for item in items_data
        )
        subtotal = subtotal.quantize(Decimal("0.01"))
        tax_amount = (subtotal * tax_rate / 100).quantize(Decimal("0.01"))
        total = (subtotal + tax_amount).quantize(Decimal("0.01"))
        return subtotal, tax_amount, total

    @staticmethod
    async def list_invoices(db: AsyncSession, org_id: str | None = None) -> list[InvoiceResponse]:
        q = (
            select(Invoice)
            .options(selectinload(Invoice.organization), selectinload(Invoice.items))
            .where(Invoice.deleted_at.is_(None))
            .order_by(Invoice.created_at.desc())
        )
        if org_id:
            q = q.where(Invoice.org_id == org_id)
        result = await db.execute(q)
        invoices = result.scalars().all()
        return [PlatformService._invoice_to_response(inv) for inv in invoices]

    @staticmethod
    async def get_invoice(db: AsyncSession, invoice_id: str) -> InvoiceResponse | None:
        inv = await PlatformService._fetch_invoice(db, invoice_id)
        if inv is None:
            return None
        return PlatformService._invoice_to_response(inv)

    @staticmethod
    async def create_invoice(db: AsyncSession, body: InvoiceCreate) -> InvoiceResponse:
        subtotal, tax_amount, total = PlatformService._compute_totals(body.items, body.tax_rate)
        number = await PlatformService._next_invoice_number(db)

        inv = Invoice(
            id=generate_uuid(),
            org_id=body.org_id,
            invoice_number=number,
            status="draft",
            issue_date=body.issue_date,
            due_date=body.due_date,
            currency=body.currency,
            notes=body.notes,
            tax_rate=body.tax_rate,
            subtotal=subtotal,
            tax_amount=tax_amount,
            total=total,
        )
        db.add(inv)
        await db.flush()

        for i, line in enumerate(body.items):
            item = InvoiceItem(
                id=generate_uuid(),
                invoice_id=inv.id,
                description=line.description,
                quantity=line.quantity,
                unit_price=line.unit_price,
                subtotal=(line.quantity * line.unit_price).quantize(Decimal("0.01")),
                sort_order=line.sort_order if line.sort_order else i,
            )
            db.add(item)

        await db.commit()
        inv = await PlatformService._fetch_invoice(db, inv.id)
        return PlatformService._invoice_to_response(inv)

    @staticmethod
    async def update_invoice(db: AsyncSession, invoice_id: str, body: InvoiceUpdate) -> InvoiceResponse | None:
        result = await db.execute(
            select(Invoice).where(Invoice.id == invoice_id, Invoice.deleted_at.is_(None))
        )
        inv = result.scalar_one_or_none()
        if inv is None:
            return None
        if inv.status not in ("draft",):
            raise ValueError("Only draft invoices can be edited")

        if body.issue_date is not None:
            inv.issue_date = body.issue_date
        if body.due_date is not None:
            inv.due_date = body.due_date
        if body.currency is not None:
            inv.currency = body.currency
        if body.notes is not None:
            inv.notes = body.notes

        if body.items is not None:
            # Replace line items
            for existing in list(inv.items):
                await db.delete(existing)
            await db.flush()

            tax_rate = body.tax_rate if body.tax_rate is not None else inv.tax_rate
            subtotal, tax_amount, total = PlatformService._compute_totals(body.items, tax_rate)
            inv.tax_rate = tax_rate
            inv.subtotal = subtotal
            inv.tax_amount = tax_amount
            inv.total = total

            for i, line in enumerate(body.items):
                item = InvoiceItem(
                    id=generate_uuid(),
                    invoice_id=inv.id,
                    description=line.description,
                    quantity=line.quantity,
                    unit_price=line.unit_price,
                    subtotal=(line.quantity * line.unit_price).quantize(Decimal("0.01")),
                    sort_order=line.sort_order if line.sort_order else i,
                )
                db.add(item)
        elif body.tax_rate is not None:
            items_result = await db.execute(
                select(InvoiceItem).where(InvoiceItem.invoice_id == inv.id)
            )
            loaded_items = items_result.scalars().all()
            subtotal, tax_amount, total = PlatformService._compute_totals(loaded_items, body.tax_rate)
            inv.tax_rate = body.tax_rate
            inv.subtotal = subtotal
            inv.tax_amount = tax_amount
            inv.total = total

        await db.commit()
        inv = await PlatformService._fetch_invoice(db, inv.id)
        return PlatformService._invoice_to_response(inv)

    @staticmethod
    async def send_invoice(db: AsyncSession, invoice_id: str) -> InvoiceResponse | None:
        inv = await PlatformService._fetch_invoice(db, invoice_id)
        if inv is None:
            return None

        # Gather recipient emails (all owners + admins of the org)
        users_result = await db.execute(
            select(User).where(
                User.org_id == inv.org_id,
                User.role.in_(["owner", "admin"]),
                User.is_active.is_(True),
                User.deleted_at.is_(None),
            )
        )
        recipients = [u.email for u in users_result.scalars().all()]

        if recipients:
            from app.services.email_service import send_invoice_email
            await send_invoice_email(
                to_emails=recipients,
                invoice=PlatformService._invoice_to_response(inv),
                org_name=inv.organization.name if inv.organization else "",
            )

        inv.sent_at = datetime.now(timezone.utc)
        if inv.status == "draft":
            inv.status = "sent"
        await db.commit()
        inv = await PlatformService._fetch_invoice(db, invoice_id)
        return PlatformService._invoice_to_response(inv)

    @staticmethod
    async def mark_paid(db: AsyncSession, invoice_id: str) -> InvoiceResponse | None:
        result = await db.execute(
            select(Invoice).where(Invoice.id == invoice_id, Invoice.deleted_at.is_(None))
        )
        inv = result.scalar_one_or_none()
        if inv is None:
            return None
        inv.status = "paid"
        inv.paid_at = datetime.now(timezone.utc)
        await db.commit()
        inv = await PlatformService._fetch_invoice(db, invoice_id)
        return PlatformService._invoice_to_response(inv)

    @staticmethod
    async def record_payment(
        db: AsyncSession, invoice_id: str, body: RecordPaymentRequest
    ) -> InvoiceResponse | None:
        inv = await PlatformService._fetch_invoice(db, invoice_id)
        if inv is None:
            return None
        if inv.status == "paid":
            raise ValueError("Invoice is already fully paid")
        if body.amount <= Decimal("0"):
            raise ValueError("Payment amount must be greater than zero")

        amount_paid = (inv.amount_paid or Decimal("0")) + body.amount.quantize(Decimal("0.01"))
        inv.amount_paid = amount_paid

        if amount_paid >= inv.total:
            inv.amount_paid = inv.total  # cap at total; no overpayment
            inv.status = "paid"
            inv.paid_at = datetime.now(timezone.utc)
        else:
            inv.status = "partial"

        if body.note:
            existing = inv.notes or ""
            timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            inv.notes = f"{existing}\n[{timestamp}] Payment of {inv.currency} {body.amount:,.2f} received. {body.note}".strip()

        await db.commit()
        inv = await PlatformService._fetch_invoice(db, invoice_id)
        return PlatformService._invoice_to_response(inv)

    @staticmethod
    async def delete_invoice(db: AsyncSession, invoice_id: str) -> bool:
        result = await db.execute(
            select(Invoice).where(Invoice.id == invoice_id, Invoice.deleted_at.is_(None))
        )
        inv = result.scalar_one_or_none()
        if inv is None:
            return False
        if inv.status == "paid":
            raise ValueError("Paid invoices cannot be deleted")
        inv.deleted_at = datetime.now(timezone.utc)
        await db.commit()
        return True
