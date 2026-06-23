from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_superadmin
from app.core.database import get_db
from app.models import Organization, User
from app.models.base import generate_uuid
from app.models.plan import Plan
from app.models.platform_faq import PlatformFaq
from app.schemas.faq import (
    PlatformFaqCreate,
    PlatformFaqResponse,
    PlatformFaqUpdate,
    ReorderRequest,
)
from app.schemas.plan import OrgPlanUpdate, OrgResponse, PlanCreate, PlanResponse, PlanUpdate

router = APIRouter(prefix="/admin", tags=["admin"])

_superadmin = Depends(require_superadmin)


# ── Plan CRUD ────────────────────────────────────────────────────

@router.get("/plans", response_model=list[PlanResponse])
async def list_plans(
    db: AsyncSession = Depends(get_db),
    _user: User = _superadmin,
):
    result = await db.execute(select(Plan).order_by(Plan.sort_order, Plan.created_at))
    return [_plan_response(p) for p in result.scalars().all()]


@router.post("/plans", response_model=PlanResponse, status_code=201)
async def create_plan(
    body: PlanCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = _superadmin,
):
    existing = await db.execute(select(Plan).where(Plan.slug == body.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"A plan with slug '{body.slug}' already exists.")

    now = datetime.now(timezone.utc)

    if body.is_default:
        await db.execute(update(Plan).values(is_default=False))

    # Place new plan at the end
    max_order = (await db.execute(select(Plan))).scalars().all()
    next_order = max(p.sort_order for p in max_order) + 1 if max_order else 0

    plan = Plan(
        id=generate_uuid(),
        name=body.name,
        slug=body.slug,
        description=body.description,
        price_kes=body.price_kes,
        price_usd=body.price_usd,
        max_bots=body.max_bots,
        max_sources=body.max_sources,
        max_conversations_per_month=body.max_conversations_per_month,
        max_team_members=body.max_team_members,
        max_pages_per_crawl=body.max_pages_per_crawl,
        allow_crawl=body.allow_crawl,
        allow_file_upload=body.allow_file_upload,
        is_active=body.is_active,
        is_default=body.is_default,
        features=body.features,
        sort_order=next_order,
        created_at=now,
        updated_at=now,
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return _plan_response(plan)


@router.put("/plans/reorder", status_code=200)
async def reorder_plans(
    body: ReorderRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = _superadmin,
):
    """Accept an ordered list of plan IDs and assign sort_order 0, 1, 2, ..."""
    for i, plan_id in enumerate(body.ids):
        await db.execute(
            update(Plan).where(Plan.id == plan_id).values(sort_order=i, updated_at=datetime.now(timezone.utc))
        )
    await db.commit()
    return {"ok": True}


@router.get("/plans/{plan_id}", response_model=PlanResponse)
async def get_plan(
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = _superadmin,
):
    plan = await _get_plan_or_404(db, plan_id)
    return _plan_response(plan)


@router.put("/plans/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: str,
    body: PlanUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = _superadmin,
):
    plan = await _get_plan_or_404(db, plan_id)

    if body.is_default is True:
        await db.execute(update(Plan).where(Plan.id != plan_id).values(is_default=False))

    data = body.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(plan, field, value)
    plan.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(plan)
    return _plan_response(plan)


@router.delete("/plans/{plan_id}", status_code=204)
async def delete_plan(
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = _superadmin,
):
    plan = await _get_plan_or_404(db, plan_id)

    orgs_on_plan = (await db.execute(
        select(Organization).where(
            Organization.plan == plan.slug,
            Organization.deleted_at.is_(None),
        )
    )).scalars().first()

    if orgs_on_plan:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete plan '{plan.name}' — one or more organisations are currently on this plan. Reassign them first.",
        )

    await db.delete(plan)
    await db.commit()


# ── Organisation plan assignment ─────────────────────────────────

@router.get("/organizations", response_model=list[OrgResponse])
async def list_organizations(
    db: AsyncSession = Depends(get_db),
    _user: User = _superadmin,
):
    result = await db.execute(
        select(Organization)
        .where(Organization.deleted_at.is_(None))
        .order_by(Organization.created_at.desc())
    )
    orgs = result.scalars().all()
    return [OrgResponse(
        id=o.id,
        name=o.name,
        slug=o.slug,
        plan=o.plan,
        created_at=o.created_at.isoformat(),
    ) for o in orgs]


@router.put("/organizations/{org_id}/plan", response_model=OrgResponse)
async def set_org_plan(
    org_id: str,
    body: OrgPlanUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = _superadmin,
):
    plan_row = (await db.execute(
        select(Plan).where(Plan.slug == body.plan_slug, Plan.is_active.is_(True))
    )).scalar_one_or_none()
    if not plan_row:
        raise HTTPException(status_code=404, detail=f"Active plan '{body.plan_slug}' not found.")

    org = (await db.execute(
        select(Organization).where(Organization.id == org_id, Organization.deleted_at.is_(None))
    )).scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found.")

    org.plan = body.plan_slug
    org.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(org)
    return OrgResponse(
        id=org.id,
        name=org.name,
        slug=org.slug,
        plan=org.plan,
        created_at=org.created_at.isoformat(),
    )


# ── Platform FAQ CRUD ─────────────────────────────────────────────

@router.get("/faqs", response_model=list[PlatformFaqResponse])
async def list_faqs(
    db: AsyncSession = Depends(get_db),
    _user: User = _superadmin,
):
    result = await db.execute(select(PlatformFaq).order_by(PlatformFaq.sort_order, PlatformFaq.created_at))
    return [_faq_response(f) for f in result.scalars().all()]


@router.post("/faqs", response_model=PlatformFaqResponse, status_code=201)
async def create_faq(
    body: PlatformFaqCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = _superadmin,
):
    now = datetime.now(timezone.utc)
    all_faqs = (await db.execute(select(PlatformFaq))).scalars().all()
    next_order = max(f.sort_order for f in all_faqs) + 1 if all_faqs else 0

    faq = PlatformFaq(
        id=generate_uuid(),
        question=body.question,
        answer=body.answer,
        is_active=body.is_active,
        sort_order=next_order,
        created_at=now,
        updated_at=now,
    )
    db.add(faq)
    await db.commit()
    await db.refresh(faq)
    return _faq_response(faq)


@router.put("/faqs/reorder", status_code=200)
async def reorder_faqs(
    body: ReorderRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = _superadmin,
):
    for i, faq_id in enumerate(body.ids):
        await db.execute(
            update(PlatformFaq).where(PlatformFaq.id == faq_id).values(
                sort_order=i, updated_at=datetime.now(timezone.utc)
            )
        )
    await db.commit()
    return {"ok": True}


@router.put("/faqs/{faq_id}", response_model=PlatformFaqResponse)
async def update_faq(
    faq_id: str,
    body: PlatformFaqUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = _superadmin,
):
    faq = await _get_faq_or_404(db, faq_id)
    data = body.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(faq, field, value)
    faq.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(faq)
    return _faq_response(faq)


@router.delete("/faqs/{faq_id}", status_code=204)
async def delete_faq(
    faq_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = _superadmin,
):
    faq = await _get_faq_or_404(db, faq_id)
    await db.delete(faq)
    await db.commit()


# ── Helpers ───────────────────────────────────────────────────────

async def _get_plan_or_404(db: AsyncSession, plan_id: str) -> Plan:
    plan = (await db.execute(select(Plan).where(Plan.id == plan_id))).scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")
    return plan


async def _get_faq_or_404(db: AsyncSession, faq_id: str) -> PlatformFaq:
    faq = (await db.execute(select(PlatformFaq).where(PlatformFaq.id == faq_id))).scalar_one_or_none()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found.")
    return faq


def _plan_response(p: Plan) -> PlanResponse:
    return PlanResponse(
        id=p.id,
        name=p.name,
        slug=p.slug,
        description=p.description,
        price_kes=p.price_kes,
        price_usd=p.price_usd,
        max_bots=p.max_bots,
        max_sources=p.max_sources,
        max_conversations_per_month=p.max_conversations_per_month,
        max_team_members=p.max_team_members,
        max_pages_per_crawl=p.max_pages_per_crawl,
        allow_crawl=p.allow_crawl,
        allow_file_upload=p.allow_file_upload,
        is_active=p.is_active,
        is_default=p.is_default,
        features=p.features,
        created_at=p.created_at.isoformat(),
        updated_at=p.updated_at.isoformat(),
    )


def _faq_response(f: PlatformFaq) -> PlatformFaqResponse:
    return PlatformFaqResponse(
        id=f.id,
        question=f.question,
        answer=f.answer,
        sort_order=f.sort_order,
        is_active=f.is_active,
        created_at=f.created_at.isoformat(),
        updated_at=f.updated_at.isoformat(),
    )
