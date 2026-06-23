from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models import User
from app.schemas.analytics import AnalyticsOverview
from app.services.analytics_service import AnalyticsService
from app.services.plan_service import PlanService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
async def get_analytics_overview(
    workspace_id: str,
    bot_id: str | None = None,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    return await AnalyticsService.get_overview(db, workspace_id, bot_id, days)


@router.get("/usage")
async def get_usage(
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    return await PlanService.get_usage(db, user.org_id, workspace_id)
