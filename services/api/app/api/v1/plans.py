from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models import User
from app.models.plan import Plan
from app.schemas.plan import PlanResponse

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("", response_model=list[PlanResponse])
async def list_active_plans(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_active_user),
):
    """Return all active plans. Available to any authenticated user."""
    result = await db.execute(
        select(Plan)
        .where(Plan.is_active.is_(True))
        .order_by(Plan.price_kes)
    )
    plans = result.scalars().all()
    return [_plan_resp(p) for p in plans]


def _plan_resp(p: Plan) -> PlanResponse:
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
