from sqlalchemy import Boolean, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, generate_uuid


class ConversationMessage(Base, TimestampMixin):
    __tablename__ = "conversation_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    conversation_id: Mapped[str] = mapped_column(String(36), ForeignKey("conversations.id"), nullable=False, index=True)
    workspace_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    role: Mapped[str] = mapped_column(
        Enum("user", "assistant", name="message_role"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text(length=4294967295), nullable=False)
    retrieved_chunk_ids: Mapped[list | None] = mapped_column(JSON, nullable=True)
    retrieval_score_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    model_used: Mapped[str | None] = mapped_column(String(100), nullable=True)
    input_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    output_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    was_grounded: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")  # noqa: F821
