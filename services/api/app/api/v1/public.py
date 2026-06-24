"""Public endpoints — no authentication required."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.plan import Plan
from app.models.platform_faq import PlatformFaq
from app.models.platform_page import PlatformPage
from app.schemas.faq import PlatformFaqResponse
from app.schemas.plan import PlanResponse
from app.schemas.platform_page import PlatformPageResponse

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/plans", response_model=list[PlanResponse])
async def public_list_plans(db: AsyncSession = Depends(get_db)):
    """Return active plans ordered by sort_order. No authentication required."""
    result = await db.execute(
        select(Plan)
        .where(Plan.is_active.is_(True))
        .order_by(Plan.sort_order, Plan.price_kes)
    )
    plans = result.scalars().all()
    return [PlanResponse(
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
    ) for p in plans]


@router.get("/faqs", response_model=list[PlatformFaqResponse])
async def public_list_faqs(db: AsyncSession = Depends(get_db)):
    """Return active FAQs ordered by sort_order. No authentication required."""
    result = await db.execute(
        select(PlatformFaq)
        .where(PlatformFaq.is_active.is_(True))
        .order_by(PlatformFaq.sort_order, PlatformFaq.created_at)
    )
    faqs = result.scalars().all()
    return [PlatformFaqResponse(
        id=f.id,
        question=f.question,
        answer=f.answer,
        sort_order=f.sort_order,
        is_active=f.is_active,
        created_at=f.created_at.isoformat(),
        updated_at=f.updated_at.isoformat(),
    ) for f in faqs]


@router.get("/pages/{slug}", response_model=PlatformPageResponse)
async def public_get_page(slug: str, db: AsyncSession = Depends(get_db)):
    """Return a single editable platform page by slug (privacy, terms, security)."""
    result = await db.execute(select(PlatformPage).where(PlatformPage.slug == slug))
    page = result.scalar_one_or_none()
    if page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    return page
