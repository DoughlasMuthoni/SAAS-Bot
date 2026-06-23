from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, generate_uuid


class ApiKey(Base, TimestampMixin):
    __tablename__ = "api_keys"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    org_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    key_prefix: Mapped[str] = mapped_column(String(8), nullable=False)
    hashed_key: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    user: Mapped["User"] = relationship(back_populates="api_keys")  # noqa: F821
    organization: Mapped["Organization"] = relationship(back_populates="api_keys")  # noqa: F821
