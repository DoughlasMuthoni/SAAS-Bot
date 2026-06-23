from sqlalchemy import JSON, Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, SoftDeleteMixin, TimestampMixin, generate_uuid


class Organization(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    plan: Mapped[str] = mapped_column(String(100), nullable=False, default="free")
    settings: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    workspaces: Mapped[list["Workspace"]] = relationship(back_populates="organization")  # noqa: F821
    users: Mapped[list["User"]] = relationship(back_populates="organization")  # noqa: F821
    api_keys: Mapped[list["ApiKey"]] = relationship(back_populates="organization")  # noqa: F821
