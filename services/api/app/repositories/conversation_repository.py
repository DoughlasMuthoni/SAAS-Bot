from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Conversation, ConversationMessage
from app.utils.ids import generate_uuid


class ConversationRepository:
    @staticmethod
    async def get_or_create_by_session(
        db: AsyncSession, *, bot_id: str, workspace_id: str, session_id: str,
        visitor_ip: str | None = None, visitor_domain: str | None = None,
    ) -> Conversation:
        result = await db.execute(
            select(Conversation).where(
                Conversation.bot_id == bot_id,
                Conversation.session_id == session_id,
                Conversation.deleted_at.is_(None),
            )
        )
        conv = result.scalar_one_or_none()
        if conv:
            return conv
        conv = Conversation(
            id=generate_uuid(),
            bot_id=bot_id,
            workspace_id=workspace_id,
            session_id=session_id,
            visitor_ip=visitor_ip,
            visitor_domain=visitor_domain,
            started_at=datetime.now(timezone.utc),
        )
        db.add(conv)
        await db.flush()
        return conv

    @staticmethod
    async def list_by_workspace(
        db: AsyncSession, workspace_id: str, *, bot_id: str | None = None,
        status: str | None = None, skip: int = 0, limit: int = 20,
    ) -> list[Conversation]:
        q = select(Conversation).where(
            Conversation.workspace_id == workspace_id,
            Conversation.deleted_at.is_(None),
        )
        if bot_id:
            q = q.where(Conversation.bot_id == bot_id)
        if status:
            q = q.where(Conversation.status == status)
        q = q.order_by(Conversation.last_message_at.desc()).offset(skip).limit(limit)
        result = await db.execute(q)
        return list(result.scalars().all())

    @staticmethod
    async def get_with_messages(db: AsyncSession, conversation_id: str, workspace_id: str) -> Conversation | None:
        from sqlalchemy.orm import selectinload
        result = await db.execute(
            select(Conversation)
            .where(
                Conversation.id == conversation_id,
                Conversation.workspace_id == workspace_id,
            )
            .options(selectinload(Conversation.messages))
        )
        conv = result.scalar_one_or_none()
        if conv and conv.messages:
            conv.messages.sort(key=lambda m: m.created_at)
        return conv

    @staticmethod
    async def add_message(
        db: AsyncSession,
        *,
        conversation_id: str,
        workspace_id: str,
        role: str,
        content: str,
        retrieved_chunk_ids: list | None = None,
        retrieval_score_json: dict | None = None,
        model_used: str | None = None,
        input_tokens: int | None = None,
        output_tokens: int | None = None,
        latency_ms: int | None = None,
        was_grounded: bool = False,
    ) -> ConversationMessage:
        msg = ConversationMessage(
            id=generate_uuid(),
            conversation_id=conversation_id,
            workspace_id=workspace_id,
            role=role,
            content=content,
            retrieved_chunk_ids=retrieved_chunk_ids,
            retrieval_score_json=retrieval_score_json,
            model_used=model_used,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            was_grounded=was_grounded,
        )
        db.add(msg)

        from sqlalchemy import update
        await db.execute(
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(
                message_count=Conversation.message_count + 1,
                last_message_at=datetime.now(timezone.utc),
            )
        )
        await db.flush()
        return msg
