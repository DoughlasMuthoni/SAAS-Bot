from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models import User
from app.models.lead import Lead
from app.models.review import Review

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/counts")
async def get_counts(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    pending_reviews = (await db.execute(
        select(func.count()).select_from(Review).where(Review.status == "pending")
    )).scalar() or 0

    new_leads = (await db.execute(
        select(func.count()).select_from(Lead).where(Lead.status == "new")
    )).scalar() or 0

    return {
        "pending_reviews": pending_reviews,
        "new_leads": new_leads,
        "total": pending_reviews + new_leads,
    }
