from fastapi import APIRouter, Depends, HTTPException  # noqa: F401
from sqlalchemy import select
from sqlalchemy import update as sql_update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, require_role
from app.core.database import get_db
from app.models import Conversation, User
from app.repositories.conversation_repository import ConversationRepository
from app.schemas.conversation import ConversationDetail, ConversationListItem, MessageDetail, UpdateConversationStatusRequest

router = APIRouter(prefix="/conversations", tags=["conversations"])

_viewer = Depends(get_current_active_user)
_editor = Depends(require_role("owner", "admin", "editor"))


@router.get("", response_model=list[ConversationListItem])
async def list_conversations(
    workspace_id: str,
    bot_id: str | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    user: User = _viewer,
):
    convs = await ConversationRepository.list_by_workspace(
        db, workspace_id, bot_id=bot_id, status=status, skip=skip, limit=limit
    )
    return [_to_list_item(c) for c in convs]


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: str,
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = _viewer,
):
    conv = await ConversationRepository.get_with_messages(db, conversation_id, workspace_id)
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationDetail(
        **_to_list_item(conv).model_dump(),
        messages=[
            MessageDetail(
                id=m.id,
                role=m.role,
                content=m.content,
                retrieved_chunk_ids=m.retrieved_chunk_ids,
                was_grounded=m.was_grounded,
                model_used=m.model_used,
                latency_ms=m.latency_ms,
                created_at=m.created_at.isoformat(),
            )
            for m in (conv.messages or [])
        ],
    )


@router.patch("/{conversation_id}/status", response_model=ConversationListItem)
async def update_conversation_status(
    conversation_id: str,
    workspace_id: str,
    body: UpdateConversationStatusRequest,
    db: AsyncSession = Depends(get_db),
    user: User = _editor,
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.workspace_id == workspace_id,
            Conversation.deleted_at.is_(None),
        )
    )
    conv = result.scalar_one_or_none()
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await db.execute(
        sql_update(Conversation)
        .where(Conversation.id == conversation_id)
        .values(status=body.status)
    )
    await db.flush()
    await db.refresh(conv)
    return _to_list_item(conv)


def _to_list_item(c) -> ConversationListItem:
    return ConversationListItem(
        id=c.id,
        bot_id=c.bot_id,
        session_id=c.session_id,
        status=c.status,
        message_count=c.message_count,
        visitor_domain=c.visitor_domain,
        started_at=c.started_at.isoformat(),
        last_message_at=c.last_message_at.isoformat() if c.last_message_at else None,
    )
