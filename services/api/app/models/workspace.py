from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, SoftDeleteMixin, TimestampMixin, generate_uuid


class Workspace(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    org_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    organization: Mapped["Organization"] = relationship(back_populates="workspaces")  # noqa: F821
    bots: Mapped[list["Bot"]] = relationship(back_populates="workspace")  # noqa: F821
    knowledge_sources: Mapped[list["KnowledgeSource"]] = relationship(back_populates="workspace")  # noqa: F821
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="workspace")  # noqa: F821
