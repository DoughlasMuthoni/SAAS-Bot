from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, generate_uuid


class DocumentChunk(Base, TimestampMixin):
    __tablename__ = "document_chunks"
    __table_args__ = (
        Index("ix_chunk_retrieval", "workspace_id", "bot_id", "is_active"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("source_documents.id"), nullable=False, index=True)
    source_id: Mapped[str] = mapped_column(String(36), ForeignKey("knowledge_sources.id"), nullable=False, index=True)
    workspace_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    bot_id: Mapped[str] = mapped_column(String(36), ForeignKey("bots.id"), nullable=False, index=True)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    token_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    char_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    embedding_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)

    document: Mapped["SourceDocument"] = relationship(back_populates="chunks")  # noqa: F821
    embedding_metadata: Mapped["EmbeddingMetadata | None"] = relationship(back_populates="chunk", uselist=False)  # noqa: F821
