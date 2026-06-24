from pydantic import BaseModel, Field


class HistoryMessage(BaseModel):
    role: str
    content: str


class SessionCreateRequest(BaseModel):
    public_key: str
    domain: str


class SessionCreateResponse(BaseModel):
    session_token: str
    session_id: str


class ChatRequest(BaseModel):
    session_token: str
    message: str = Field(..., min_length=1, max_length=4000)
    history: list[HistoryMessage] = Field(default_factory=list)


class LeadCreateRequest(BaseModel):
    session_token: str
    name: str = Field(..., min_length=1)
    email: str | None = None
    phone: str | None = None
    message: str | None = None
    page_url: str | None = None


class WidgetConfigResponse(BaseModel):
    bot_id: str
    name: str
    brand_color: str
    welcome_message: str
    position: str
    theme: str
    show_branding: bool = True  # True = show "Powered by" badge (free plan); False = hidden (paid)
