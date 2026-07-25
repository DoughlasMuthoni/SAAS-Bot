from typing import Literal
from pydantic import BaseModel, Field


class SubmitReviewRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    role: str | None = Field(None, max_length=255)
    quote: str = Field(..., min_length=10, max_length=2000)
    rating: int = Field(5, ge=1, le=5)


class UpdateReviewStatusRequest(BaseModel):
    status: Literal["approved", "rejected", "pending"]


class ReviewResponse(BaseModel):
    id: str
    name: str
    role: str | None
    quote: str
    rating: int
    status: str
    created_at: str

    model_config = {"from_attributes": True}
