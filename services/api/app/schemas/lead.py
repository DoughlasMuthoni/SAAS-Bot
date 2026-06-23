from typing import Literal
from pydantic import BaseModel


class UpdateLeadStatusRequest(BaseModel):
    status: Literal["new", "contacted", "closed"]


class LeadResponse(BaseModel):
    id: str
    workspace_id: str
    bot_id: str
    conversation_id: str | None
    name: str
    email: str | None
    phone: str | None
    message: str | None
    page_url: str | None
    status: str
    created_at: str

    model_config = {"from_attributes": True}
