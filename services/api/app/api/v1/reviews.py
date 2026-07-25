from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, require_role
from app.core.database import get_db
from app.models import Review, User
from app.schemas.review import ReviewResponse, SubmitReviewRequest, UpdateReviewStatusRequest
from app.models.base import generate_uuid
from datetime import datetime

router = APIRouter(prefix="/reviews", tags=["reviews"])

_superadmin = Depends(require_role("owner"))


def _to_response(r: Review) -> ReviewResponse:
    return ReviewResponse(
        id=r.id,
        name=r.name,
        role=r.role,
        quote=r.quote,
        rating=r.rating,
        status=r.status,
        created_at=r.created_at.isoformat(),
    )


# ── Public: submit a review ───────────────────────────────────────────────────
@router.post("", response_model=ReviewResponse, status_code=201)
async def submit_review(
    body: SubmitReviewRequest,
    db: AsyncSession = Depends(get_db),
):
    review = Review(
        id=generate_uuid(),
        name=body.name,
        role=body.role,
        quote=body.quote,
        rating=body.rating,
        status="pending",
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return _to_response(review)


# ── Public: list approved reviews for the demo site ───────────────────────────
@router.get("/public", response_model=list[ReviewResponse])
async def list_public_reviews(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Review)
        .where(Review.status == "approved")
        .order_by(Review.created_at.desc())
    )
    return [_to_response(r) for r in result.scalars().all()]


# ── Admin: list all reviews ───────────────────────────────────────────────────
@router.get("", response_model=list[ReviewResponse])
async def list_reviews(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = _superadmin,
):
    q = select(Review)
    if status:
        q = q.where(Review.status == status)
    q = q.order_by(Review.created_at.desc())
    result = await db.execute(q)
    return [_to_response(r) for r in result.scalars().all()]


# ── Admin: approve / reject a review ─────────────────────────────────────────
@router.patch("/{review_id}/status", response_model=ReviewResponse)
async def update_review_status(
    review_id: str,
    body: UpdateReviewStatusRequest,
    db: AsyncSession = Depends(get_db),
    user: User = _superadmin,
):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if review is None:
        raise HTTPException(status_code=404, detail="Review not found")
    review.status = body.status
    review.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(review)
    return _to_response(review)
