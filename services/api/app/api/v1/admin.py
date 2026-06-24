from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_superadmin
from app.core.database import get_db
from app.models import Bot, Organization, User, Workspace
from app.models.base import generate_uuid
from app.models.plan import Plan
from app.models.platform_faq import PlatformFaq
from app.models.platform_page import PlatformPage
from app.schemas.faq import (
    PlatformFaqCreate,
    PlatformFaqResponse,
    PlatformFaqUpdate,
    ReorderRequest,
)
from app.schemas.plan import OrgDetail, OrgPlanUpdate, OrgResponse, OrgSuspendRequest, OrgUserDetail, PlanCreate, PlanResponse, PlanUpdate
from app.schemas.platform_page import PlatformPageResponse, PlatformPageUpdate

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
        allow_custom_branding=body.allow_custom_branding,
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


# ── Organisation management ───────────────────────────────────────

async def _get_org_or_404(db: AsyncSession, org_id: str) -> Organization:
    org = (await db.execute(
        select(Organization).where(Organization.id == org_id, Organization.deleted_at.is_(None))
    )).scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found.")
    return org


async def _org_counts(db: AsyncSession, org_id: str) -> tuple[int, int]:
    user_count = (await db.execute(
        select(func.count()).select_from(User)
        .where(User.org_id == org_id, User.deleted_at.is_(None))
    )).scalar() or 0
    bot_count = (await db.execute(
        select(func.count()).select_from(Bot)
        .where(Bot.org_id == org_id, Bot.deleted_at.is_(None))
    )).scalar() or 0
    return int(user_count), int(bot_count)


def _org_response(o: Organization, user_count: int = 0, bot_count: int = 0) -> OrgResponse:
    return OrgResponse(
        id=o.id,
        name=o.name,
        slug=o.slug,
        plan=o.plan,
        is_suspended=o.suspended_at is not None,
        user_count=user_count,
        bot_count=bot_count,
        created_at=o.created_at.isoformat(),
    )


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
    responses = []
    for o in orgs:
        uc, bc = await _org_counts(db, o.id)
        responses.append(_org_response(o, uc, bc))
    return responses


@router.get("/organizations/{org_id}", response_model=OrgDetail)
async def get_organization(
    org_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = _superadmin,
):
    org = await _get_org_or_404(db, org_id)
    users_result = await db.execute(
        select(User)
        .where(User.org_id == org_id, User.deleted_at.is_(None))
        .order_by(User.created_at)
    )
    users = users_result.scalars().all()
    ws_count = (await db.execute(
        select(func.count()).select_from(Workspace).where(Workspace.org_id == org_id)
    )).scalar() or 0
    bot_count = (await db.execute(
        select(func.count()).select_from(Bot).where(Bot.org_id == org_id, Bot.deleted_at.is_(None))
    )).scalar() or 0
    return OrgDetail(
        id=org.id,
        name=org.name,
        slug=org.slug,
        plan=org.plan,
        is_suspended=org.suspended_at is not None,
        suspension_reason=org.suspension_reason,
        suspended_at=org.suspended_at.isoformat() if org.suspended_at else None,
        user_count=len(users),
        bot_count=int(bot_count),
        workspace_count=int(ws_count),
        users=[OrgUserDetail(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            last_login_at=u.last_login_at.isoformat() if u.last_login_at else None,
            created_at=u.created_at.isoformat(),
        ) for u in users],
        created_at=org.created_at.isoformat(),
    )


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
    org = await _get_org_or_404(db, org_id)
    org.plan = body.plan_slug
    org.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(org)
    uc, bc = await _org_counts(db, org.id)
    return _org_response(org, uc, bc)


@router.put("/organizations/{org_id}/suspend", response_model=OrgResponse)
async def suspend_organization(
    org_id: str,
    body: OrgSuspendRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = _superadmin,
):
    org = await _get_org_or_404(db, org_id)
    if org.suspended_at is not None:
        raise HTTPException(status_code=409, detail="Organisation is already suspended.")
    now = datetime.now(timezone.utc)
    org.suspended_at = now
    org.suspension_reason = body.reason
    org.updated_at = now
    await db.commit()
    await db.refresh(org)
    uc, bc = await _org_counts(db, org.id)
    return _org_response(org, uc, bc)


@router.put("/organizations/{org_id}/unsuspend", response_model=OrgResponse)
async def unsuspend_organization(
    org_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = _superadmin,
):
    org = await _get_org_or_404(db, org_id)
    if org.suspended_at is None:
        raise HTTPException(status_code=409, detail="Organisation is not suspended.")
    org.suspended_at = None
    org.suspension_reason = None
    org.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(org)
    uc, bc = await _org_counts(db, org.id)
    return _org_response(org, uc, bc)


@router.delete("/organizations/{org_id}", status_code=204)
async def delete_organization(
    org_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = _superadmin,
):
    org = await _get_org_or_404(db, org_id)
    org.deleted_at = datetime.now(timezone.utc)
    org.updated_at = datetime.now(timezone.utc)
    await db.commit()


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
        allow_custom_branding=p.allow_custom_branding,
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


# ── Platform Pages CRUD ────────────────────────────────────────────

@router.get("/pages", response_model=list[PlatformPageResponse])
async def list_pages(
    db: AsyncSession = Depends(get_db),
    _: User = _superadmin,
):
    """List all editable platform pages."""
    result = await db.execute(select(PlatformPage).order_by(PlatformPage.slug))
    return result.scalars().all()


@router.get("/pages/{slug}", response_model=PlatformPageResponse)
async def get_page(
    slug: str,
    db: AsyncSession = Depends(get_db),
    _: User = _superadmin,
):
    """Get a single platform page by slug."""
    result = await db.execute(select(PlatformPage).where(PlatformPage.slug == slug))
    page = result.scalar_one_or_none()
    if page is None:
        raise HTTPException(status_code=404, detail="Page not found.")
    return page


@router.put("/pages/{slug}", response_model=PlatformPageResponse)
async def update_page(
    slug: str,
    body: PlatformPageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = _superadmin,
):
    """Update the title and HTML content of a platform page."""
    result = await db.execute(select(PlatformPage).where(PlatformPage.slug == slug))
    page = result.scalar_one_or_none()
    if page is None:
        raise HTTPException(status_code=404, detail="Page not found.")
    page.title = body.title
    page.content = body.content
    page.updated_by = current_user.email
    page.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(page)
    return page
