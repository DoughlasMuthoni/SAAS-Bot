from typing import Literal
from pydantic import BaseModel


class UpdateConversationStatusRequest(BaseModel):
    status: Literal["active", "resolved", "lead", "unresolved"]


class MessageDetail(BaseModel):
    id: str
    role: str
    content: str
    retrieved_chunk_ids: list | None
    was_grounded: bool
    model_used: str | None
    latency_ms: int | None
    created_at: str

    model_config = {"from_attributes": True}


class ConversationListItem(BaseModel):
    id: str
    bot_id: str
    session_id: str
    status: str
    message_count: int
    visitor_domain: str | None
    started_at: str
    last_message_at: str | None

    model_config = {"from_attributes": True}


class ConversationDetail(ConversationListItem):
    messages: list[MessageDetail] = []
