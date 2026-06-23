from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, generate_uuid


class Domain(Base, TimestampMixin):
    __tablename__ = "domains"
    __table_args__ = (UniqueConstraint("bot_id", "domain", name="uq_bot_domain"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    bot_id: Mapped[str] = mapped_column(String(36), ForeignKey("bots.id"), nullable=False, index=True)
    workspace_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    domain: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    bot: Mapped["Bot"] = relationship(back_populates="domains")  # noqa: F821
