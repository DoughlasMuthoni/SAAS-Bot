from sqlalchemy import Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin, generate_uuid


class UsageEvent(Base, TimestampMixin):
    __tablename__ = "usage_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    workspace_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    bot_id: Mapped[str] = mapped_column(String(36), ForeignKey("bots.id"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(
        Enum("chat_message", "ingestion", "retrieval", "lead_captured", name="usage_event_type"),
        nullable=False,
    )
    tokens_input: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    tokens_output: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    model_used: Mapped[str] = mapped_column(String(100), nullable=False, default="")
