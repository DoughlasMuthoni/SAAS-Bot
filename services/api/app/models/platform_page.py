from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class PlatformPage(Base, TimestampMixin):
    __tablename__ = "platform_pages"

    slug: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text().with_variant(Text(length=4294967295), "mysql"), nullable=False, default="")
    updated_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
