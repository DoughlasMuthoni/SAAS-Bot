from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, SoftDeleteMixin, TimestampMixin, generate_uuid


class KnowledgeSource(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "knowledge_sources"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id"), nullable=False, index=True)
    bot_id: Mapped[str] = mapped_column(String(36), ForeignKey("bots.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[str] = mapped_column(
        Enum("text", "faq", "upload", "crawl", name="source_type"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        Enum("pending", "indexing", "indexed", "failed", "disabled", name="source_status"),
        nullable=False,
        default="pending",
    )
    content_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    file_mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    indexed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    chunk_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    workspace: Mapped["Workspace"] = relationship(back_populates="knowledge_sources")  # noqa: F821
    bot: Mapped["Bot"] = relationship(back_populates="knowledge_sources")  # noqa: F821
    documents: Mapped[list["SourceDocument"]] = relationship(back_populates="source", cascade="all, delete-orphan")  # noqa: F821
    ingestion_jobs: Mapped[list["IngestionJob"]] = relationship(back_populates="source")  # noqa: F821
