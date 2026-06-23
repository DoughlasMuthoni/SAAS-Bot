from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, generate_uuid


class EmbeddingMetadata(Base, TimestampMixin):
    __tablename__ = "embeddings_metadata"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    chunk_id: Mapped[str] = mapped_column(String(36), ForeignKey("document_chunks.id"), unique=True, nullable=False)
    workspace_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    embedding_provider: Mapped[str] = mapped_column(String(50), nullable=False)
    embedding_model: Mapped[str] = mapped_column(String(100), nullable=False)
    vector_store_id: Mapped[str] = mapped_column(String(255), nullable=False)
    vector_doc_id: Mapped[str] = mapped_column(String(255), nullable=False)
    dimensions: Mapped[int] = mapped_column(Integer, nullable=False)

    chunk: Mapped["DocumentChunk"] = relationship(back_populates="embedding_metadata")  # noqa: F821
