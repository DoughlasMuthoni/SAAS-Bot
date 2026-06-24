from sqlalchemy import JSON, Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin, generate_uuid


class Plan(Base, TimestampMixin):
    __tablename__ = "plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    price_kes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    price_usd: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # -1 = unlimited
    max_bots: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    max_sources: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    max_conversations_per_month: Mapped[int] = mapped_column(Integer, nullable=False, default=500)
    max_team_members: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    max_pages_per_crawl: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Feature gates
    allow_crawl: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    allow_file_upload: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    allow_custom_branding: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    features: Mapped[list | None] = mapped_column(JSON, nullable=True)
