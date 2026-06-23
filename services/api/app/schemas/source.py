from pydantic import BaseModel, Field, field_validator


class FaqPair(BaseModel):
    question: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=1)


class TextSourceCreate(BaseModel):
    bot_id: str
    workspace_id: str
    name: str = Field(..., min_length=1)
    content: str = Field(..., min_length=10)


class FaqSourceCreate(BaseModel):
    bot_id: str
    workspace_id: str
    name: str = Field(..., min_length=1)
    faqs: list[FaqPair] = Field(..., min_length=1)


class CrawlSourceCreate(BaseModel):
    bot_id: str
    workspace_id: str
    name: str = Field(..., min_length=1)
    url: str = Field(..., min_length=1)
    max_pages: int = Field(default=20, ge=1, le=100)

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class KnowledgeSourceResponse(BaseModel):
    id: str
    workspace_id: str
    bot_id: str
    name: str
    source_type: str
    status: str
    chunk_count: int
    indexed_at: str | None
    error_message: str | None
    language: str
    created_at: str

    model_config = {"from_attributes": True}
