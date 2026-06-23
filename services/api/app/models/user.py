from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, SoftDeleteMixin, TimestampMixin, generate_uuid


class User(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    org_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        Enum("owner", "admin", "editor", "viewer", name="user_role"),
        nullable=False,
        default="editor",
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    organization: Mapped["Organization"] = relationship(back_populates="users")  # noqa: F821
    api_keys: Mapped[list["ApiKey"]] = relationship(back_populates="user")  # noqa: F821
