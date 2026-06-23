from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, generate_uuid


class SourceDocument(Base, TimestampMixin):
    __tablename__ = "source_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    source_id: Mapped[str] = mapped_column(String(36), ForeignKey("knowledge_sources.id"), nullable=False, index=True)
    workspace_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    raw_content: Mapped[str] = mapped_column(Text(length=4294967295), nullable=False)
    normalized_content: Mapped[str] = mapped_column(Text(length=4294967295), nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    doc_type: Mapped[str] = mapped_column(String(50), nullable=False, default="text")
    source_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    processing_status: Mapped[str] = mapped_column(
        Enum("pending", "processed", "failed", name="doc_processing_status"),
        nullable=False,
        default="pending",
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    source: Mapped["KnowledgeSource"] = relationship(back_populates="documents")  # noqa: F821
    chunks: Mapped[list["DocumentChunk"]] = relationship(back_populates="document", cascade="all, delete-orphan")  # noqa: F821
