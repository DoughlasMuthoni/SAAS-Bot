from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin, generate_uuid


class Lead(Base, TimestampMixin):
    __tablename__ = "leads"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    workspace_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    bot_id: Mapped[str] = mapped_column(String(36), ForeignKey("bots.id"), nullable=False, index=True)
    conversation_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("conversations.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    page_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("new", "contacted", "closed", name="lead_status"),
        nullable=False,
        default="new",
    )
