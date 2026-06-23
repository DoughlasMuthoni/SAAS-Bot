from fastapi import APIRouter, Depends, HTTPException  # noqa: F401
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, require_role
from app.core.database import get_db
from app.models import Lead, User
from app.schemas.lead import LeadResponse, UpdateLeadStatusRequest

router = APIRouter(prefix="/leads", tags=["leads"])

_viewer = Depends(get_current_active_user)
_editor = Depends(require_role("owner", "admin", "editor"))


@router.get("", response_model=list[LeadResponse])
async def list_leads(
    workspace_id: str,
    bot_id: str | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    user: User = _viewer,
):
    q = select(Lead).where(Lead.workspace_id == workspace_id)
    if bot_id:
        q = q.where(Lead.bot_id == bot_id)
    if status:
        q = q.where(Lead.status == status)
    q = q.order_by(Lead.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    leads = result.scalars().all()
    return [_to_response(l) for l in leads]


@router.patch("/{lead_id}/status", response_model=LeadResponse)
async def update_lead_status(
    lead_id: str,
    workspace_id: str,
    body: UpdateLeadStatusRequest,
    db: AsyncSession = Depends(get_db),
    user: User = _editor,
):
    result = await db.execute(
        select(Lead).where(Lead.id == lead_id, Lead.workspace_id == workspace_id)
    )
    lead = result.scalar_one_or_none()
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead.status = body.status
    await db.flush()
    return _to_response(lead)


def _to_response(l) -> LeadResponse:
    return LeadResponse(
        id=l.id,
        workspace_id=l.workspace_id,
        bot_id=l.bot_id,
        conversation_id=l.conversation_id,
        name=l.name,
        email=l.email,
        phone=l.phone,
        message=l.message,
        page_url=l.page_url,
        status=l.status,
        created_at=l.created_at.isoformat(),
    )
