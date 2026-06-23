from pydantic import BaseModel, Field


class DomainCreate(BaseModel):
    domain: str = Field(..., min_length=3, max_length=255)


class DomainResponse(BaseModel):
    id: str
    domain: str
    is_active: bool

    model_config = {"from_attributes": True}


class BotCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    brand_color: str = Field(default="#6366f1", pattern=r"^#[0-9a-fA-F]{6}$")
    welcome_message: str = Field(default="Hi! How can I help you?", max_length=500)
    fallback_email: str | None = None
    fallback_phone: str | None = None
    fallback_whatsapp: str | None = None
    model_name: str | None = None
    system_prompt_override: str | None = None
    position: str = "bottom-right"
    theme: str = "light"
    workspace_id: str


class BotUpdate(BaseModel):
    name: str | None = None
    brand_color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    welcome_message: str | None = None
    fallback_email: str | None = None
    fallback_phone: str | None = None
    fallback_whatsapp: str | None = None
    model_name: str | None = None
    system_prompt_override: str | None = None
    position: str | None = None
    theme: str | None = None
    is_active: bool | None = None


class BotResponse(BaseModel):
    id: str
    workspace_id: str
    org_id: str
    name: str
    public_key: str
    brand_color: str
    welcome_message: str
    fallback_email: str | None
    fallback_phone: str | None
    fallback_whatsapp: str | None
    model_name: str | None
    is_active: bool
    position: str
    theme: str
    domains: list[DomainResponse] = []
    created_at: str

    model_config = {"from_attributes": True}
