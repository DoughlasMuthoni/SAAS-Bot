from sqlalchemy import ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin, generate_uuid


class UnresolvedQuery(Base, TimestampMixin):
    __tablename__ = "unresolved_queries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    workspace_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    bot_id: Mapped[str] = mapped_column(String(36), ForeignKey("bots.id"), nullable=False, index=True)
    conversation_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("conversations.id"), nullable=True)
    query_text: Mapped[str] = mapped_column(Text, nullable=False)
    retrieval_attempt_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
