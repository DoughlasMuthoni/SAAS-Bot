from typing import Any

from pydantic import BaseModel, Field, field_validator


class PlanCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9_-]+$")
    description: str | None = None
    price_kes: int = Field(default=0, ge=0)
    price_usd: int = Field(default=0, ge=0)
    max_bots: int = Field(default=1)
    max_sources: int = Field(default=5)
    max_conversations_per_month: int = Field(default=500)
    max_team_members: int = Field(default=1)
    max_pages_per_crawl: int = Field(default=0)
    allow_crawl: bool = False
    allow_file_upload: bool = True
    is_active: bool = True
    is_default: bool = False
    features: list[str] | None = None

    @field_validator("max_bots", "max_sources", "max_conversations_per_month", "max_team_members", "max_pages_per_crawl")
    @classmethod
    def validate_limit(cls, v: int) -> int:
        if v != -1 and v < 0:
            raise ValueError("Limit must be -1 (unlimited) or a positive integer")
        return v


class PlanUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    price_kes: int | None = Field(default=None, ge=0)
    price_usd: int | None = Field(default=None, ge=0)
    max_bots: int | None = None
    max_sources: int | None = None
    max_conversations_per_month: int | None = None
    max_team_members: int | None = None
    max_pages_per_crawl: int | None = None
    allow_crawl: bool | None = None
    allow_file_upload: bool | None = None
    is_active: bool | None = None
    is_default: bool | None = None
    features: list[str] | None = None

    @field_validator("max_bots", "max_sources", "max_conversations_per_month", "max_team_members", "max_pages_per_crawl", mode="before")
    @classmethod
    def validate_limit(cls, v: Any) -> Any:
        if v is None:
            return v
        if v != -1 and v < 0:
            raise ValueError("Limit must be -1 (unlimited) or a positive integer")
        return v


class PlanResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None
    price_kes: int
    price_usd: int
    max_bots: int
    max_sources: int
    max_conversations_per_month: int
    max_team_members: int
    max_pages_per_crawl: int
    allow_crawl: bool
    allow_file_upload: bool
    is_active: bool
    is_default: bool
    features: list[str] | None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class OrgPlanUpdate(BaseModel):
    plan_slug: str = Field(..., min_length=1, max_length=100)


class OrgResponse(BaseModel):
    id: str
    name: str
    slug: str
    plan: str
    created_at: str

    model_config = {"from_attributes": True}
