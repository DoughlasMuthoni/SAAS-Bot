from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, SoftDeleteMixin, TimestampMixin, generate_uuid


class Conversation(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    bot_id: Mapped[str] = mapped_column(String(36), ForeignKey("bots.id"), nullable=False, index=True)
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id"), nullable=False, index=True)
    session_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    visitor_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    visitor_domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("active", "resolved", "lead", "unresolved", name="conversation_status"),
        nullable=False,
        default="active",
    )
    message_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    bot: Mapped["Bot"] = relationship(back_populates="conversations")  # noqa: F821
    workspace: Mapped["Workspace"] = relationship(back_populates="conversations")  # noqa: F821
    messages: Mapped[list["ConversationMessage"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")  # noqa: F821
