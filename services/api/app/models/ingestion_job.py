from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, generate_uuid


class IngestionJob(Base, TimestampMixin):
    __tablename__ = "ingestion_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    workspace_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    source_id: Mapped[str] = mapped_column(String(36), ForeignKey("knowledge_sources.id"), nullable=False, index=True)
    job_type: Mapped[str] = mapped_column(
        Enum("ingest", "reindex", "delete", name="job_type"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        Enum("queued", "running", "done", "failed", name="job_status"),
        nullable=False,
        default="queued",
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    documents_processed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    chunks_created: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    source: Mapped["KnowledgeSource"] = relationship(back_populates="ingestion_jobs")  # noqa: F821
