from sqlalchemy import Boolean, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, SoftDeleteMixin, TimestampMixin, generate_uuid


class Bot(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "bots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id"), nullable=False, index=True)
    org_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    public_key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    brand_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#6366f1")
    welcome_message: Mapped[str] = mapped_column(Text, nullable=False, default="Hi! How can I help you?")
    fallback_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fallback_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    fallback_whatsapp: Mapped[str | None] = mapped_column(String(50), nullable=True)
    model_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    system_prompt_override: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    position: Mapped[str] = mapped_column(
        Enum("bottom-right", "bottom-left", name="bot_position"),
        nullable=False,
        default="bottom-right",
    )
    theme: Mapped[str] = mapped_column(
        Enum("light", "dark", name="bot_theme"),
        nullable=False,
        default="light",
    )

    workspace: Mapped["Workspace"] = relationship(back_populates="bots")  # noqa: F821
    domains: Mapped[list["Domain"]] = relationship(back_populates="bot", cascade="all, delete-orphan")  # noqa: F821
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="bot")  # noqa: F821
    knowledge_sources: Mapped[list["KnowledgeSource"]] = relationship(back_populates="bot")  # noqa: F821
