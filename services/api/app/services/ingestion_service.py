from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.ingestion.chunker import ChunkingService
from app.ingestion.processors.processor_factory import get_processor
from app.utils.file_storage import get_upload_path
from app.models import EmbeddingMetadata
from app.providers.provider_factory import get_embedding_provider
from app.repositories.source_repository import SourceRepository
from app.retrieval.chroma_vector_store import get_vector_store
from app.retrieval.vector_store import VectorDocument
from app.utils.ids import generate_uuid

logger = get_logger(__name__)


class IngestionService:
    @staticmethod
    async def run_ingestion_job(db: AsyncSession, job_id: str) -> None:
        job = await SourceRepository.get_job(db, job_id)
        if job is None:
            logger.error("Ingestion job not found", job_id=job_id)
            return

        source = await SourceRepository.get_by_id(db, job.source_id, job.workspace_id)
        if source is None:
            logger.error("Source not found for job", job_id=job_id, source_id=job.source_id)
            return

        job.status = "running"
        job.started_at = datetime.now(timezone.utc)
        await SourceRepository.update_status(db, source.id, "indexing")
        await db.flush()

        try:
            processor = get_processor(source.source_type)
            resolved_path = str(get_upload_path(source.file_path)) if source.file_path else None
            documents = await processor.process(
                source.metadata_json or {},
                file_path=resolved_path,
            )

            embedding_provider = get_embedding_provider()
            vector_store = get_vector_store()
            collection = f"ws_{source.workspace_id}"

            total_chunks = 0
            active_chunk_ids: set[str] = set()

            for doc_data in documents:
                doc = await SourceRepository.upsert_document(
                    db,
                    source_id=source.id,
                    workspace_id=source.workspace_id,
                    title=doc_data.title,
                    raw_content=doc_data.raw_content,
                    normalized_content=doc_data.normalized_content,
                    content_hash=_hash(doc_data.normalized_content),
                    doc_type=doc_data.doc_type,
                    source_url=doc_data.source_url,
                    page_number=doc_data.page_number,
                )

                if source.source_type == "faq":
                    from app.ingestion.chunker import ChunkingService as CS
                    # FAQ docs are already one Q+A pair — treat whole doc as one chunk
                    chunks = [CS.chunk_faq(
                        question=doc_data.title,
                        answer=doc_data.normalized_content.replace(f"Q: {doc_data.title}\nA: ", ""),
                        document_id=doc.id,
                        source_id=source.id,
                        workspace_id=source.workspace_id,
                        bot_id=source.bot_id,
                        chunk_index=total_chunks,
                    )]
                else:
                    chunks = ChunkingService.chunk_text(
                        doc_data.normalized_content,
                        document_id=doc.id,
                        source_id=source.id,
                        workspace_id=source.workspace_id,
                        bot_id=source.bot_id,
                    )

                if not chunks:
                    continue

                texts = [c.content for c in chunks]
                embeddings = await embedding_provider.embed_texts(texts)

                vector_docs = []
                for chunk, embedding in zip(chunks, embeddings):
                    db_chunk = await SourceRepository.save_chunk(db, {
                        "id": chunk.id,
                        "document_id": chunk.document_id,
                        "source_id": chunk.source_id,
                        "workspace_id": chunk.workspace_id,
                        "bot_id": chunk.bot_id,
                        "chunk_index": chunk.chunk_index,
                        "content": chunk.content,
                        "content_hash": chunk.content_hash,
                        "token_count": chunk.token_count,
                        "char_count": chunk.char_count,
                        "embedding_id": chunk.id,
                        "is_active": True,
                    })
                    em = EmbeddingMetadata(
                        id=generate_uuid(),
                        chunk_id=chunk.id,
                        workspace_id=source.workspace_id,
                        embedding_provider=embedding_provider.get_model_name(),
                        embedding_model=embedding_provider.get_model_name(),
                        vector_store_id=collection,
                        vector_doc_id=chunk.id,
                        dimensions=embedding_provider.get_dimensions(),
                    )
                    db.add(em)

                    vector_docs.append(VectorDocument(
                        id=chunk.id,
                        embedding=embedding,
                        content=chunk.content,
                        metadata={
                            "workspace_id": source.workspace_id,
                            "bot_id": source.bot_id,
                            "source_id": source.id,
                            "chunk_index": chunk.chunk_index,
                            "is_active": True,
                        },
                    ))
                    active_chunk_ids.add(chunk.id)

                await vector_store.upsert(collection, vector_docs)
                total_chunks += len(chunks)

            await SourceRepository.deactivate_old_chunks(db, source.id, active_chunk_ids)
            await SourceRepository.update_status(db, source.id, "indexed", chunk_count=total_chunks)
            job.status = "done"
            job.completed_at = datetime.now(timezone.utc)
            job.chunks_created = total_chunks
            job.documents_processed = len(documents)
            await db.flush()
            logger.info("Ingestion complete", source_id=source.id, chunks=total_chunks)

        except Exception as e:
            logger.error("Ingestion failed", source_id=source.id, error=str(e))
            job.status = "failed"
            job.completed_at = datetime.now(timezone.utc)
            job.error_message = str(e)
            await SourceRepository.update_status(db, source.id, "failed", error_message=str(e))
            await db.flush()

    @staticmethod
    async def delete_source_embeddings(db: AsyncSession, source_id: str, workspace_id: str) -> None:
        vector_store = get_vector_store()
        collection = f"ws_{workspace_id}"
        embedding_ids = await SourceRepository.deactivate_all_chunks(db, source_id, workspace_id)
        if embedding_ids:
            await vector_store.delete(collection, embedding_ids)


def _hash(text: str) -> str:
    import hashlib
    return hashlib.sha256(text.encode()).hexdigest()
