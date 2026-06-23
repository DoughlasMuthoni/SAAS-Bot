from pydantic import BaseModel, Field


class PlatformFaqCreate(BaseModel):
    question: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=1)
    is_active: bool = True


class PlatformFaqUpdate(BaseModel):
    question: str | None = Field(default=None, min_length=1)
    answer: str | None = Field(default=None, min_length=1)
    is_active: bool | None = None


class PlatformFaqResponse(BaseModel):
    id: str
    question: str
    answer: str
    sort_order: int
    is_active: bool
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class ReorderRequest(BaseModel):
    ids: list[str] = Field(..., min_length=1)
