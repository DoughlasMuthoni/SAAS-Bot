from sqlalchemy import Boolean, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin, generate_uuid


class PlatformFaq(Base, TimestampMixin):
    __tablename__ = "platform_faqs"

    id: Mapped[str] = mapped_column(Text, primary_key=True, default=generate_uuid)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
