from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DocumentChunk, IngestionJob, KnowledgeSource, SourceDocument
from app.utils.ids import generate_uuid


class SourceRepository:
    @staticmethod
    async def list_by_workspace(db: AsyncSession, workspace_id: str, bot_id: str | None = None) -> list[KnowledgeSource]:
        q = select(KnowledgeSource).where(
            KnowledgeSource.workspace_id == workspace_id,
            KnowledgeSource.deleted_at.is_(None),
        )
        if bot_id:
            q = q.where(KnowledgeSource.bot_id == bot_id)
        result = await db.execute(q)
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(db: AsyncSession, source_id: str, workspace_id: str) -> KnowledgeSource | None:
        result = await db.execute(
            select(KnowledgeSource).where(
                KnowledgeSource.id == source_id,
                KnowledgeSource.workspace_id == workspace_id,
                KnowledgeSource.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, **kwargs) -> KnowledgeSource:
        source = KnowledgeSource(id=generate_uuid(), **kwargs)
        db.add(source)
        await db.flush()
        await db.refresh(source)
        return source

    @staticmethod
    async def update_status(
        db: AsyncSession, source_id: str, status: str, **extra
    ) -> None:
        values: dict = {"status": status, **extra}
        if status == "indexed":
            values["indexed_at"] = datetime.now(timezone.utc)
        if status in ("indexing", "pending"):
            values["error_message"] = None
        await db.execute(
            update(KnowledgeSource).where(KnowledgeSource.id == source_id).values(**values)
        )

    @staticmethod
    async def create_job(db: AsyncSession, workspace_id: str, source_id: str, job_type: str) -> IngestionJob:
        job = IngestionJob(
            id=generate_uuid(),
            workspace_id=workspace_id,
            source_id=source_id,
            job_type=job_type,
        )
        db.add(job)
        await db.flush()
        return job

    @staticmethod
    async def get_job(db: AsyncSession, job_id: str) -> IngestionJob | None:
        result = await db.execute(select(IngestionJob).where(IngestionJob.id == job_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def upsert_document(
        db: AsyncSession, *, source_id: str, workspace_id: str, title: str, raw_content: str,
        normalized_content: str, content_hash: str, doc_type: str, source_url: str | None,
        page_number: int | None,
    ) -> SourceDocument:
        result = await db.execute(
            select(SourceDocument).where(
                SourceDocument.source_id == source_id,
                SourceDocument.content_hash == content_hash,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            return existing
        doc = SourceDocument(
            id=generate_uuid(),
            source_id=source_id,
            workspace_id=workspace_id,
            title=title,
            raw_content=raw_content,
            normalized_content=normalized_content,
            content_hash=content_hash,
            doc_type=doc_type,
            source_url=source_url,
            page_number=page_number,
            processing_status="processed",
        )
        db.add(doc)
        await db.flush()
        return doc

    @staticmethod
    async def save_chunk(db: AsyncSession, chunk_data: dict) -> DocumentChunk:
        chunk = DocumentChunk(**chunk_data)
        db.add(chunk)
        await db.flush()
        return chunk

    @staticmethod
    async def deactivate_old_chunks(db: AsyncSession, source_id: str, active_chunk_ids: set[str]) -> None:
        result = await db.execute(
            select(DocumentChunk).where(
                DocumentChunk.source_id == source_id,
                DocumentChunk.is_active.is_(True),
            )
        )
        for chunk in result.scalars().all():
            if chunk.id not in active_chunk_ids:
                chunk.is_active = False
        await db.flush()

    @staticmethod
    async def deactivate_all_chunks(db: AsyncSession, source_id: str, workspace_id: str) -> list[str]:
        result = await db.execute(
            select(DocumentChunk).where(
                DocumentChunk.source_id == source_id,
                DocumentChunk.workspace_id == workspace_id,
                DocumentChunk.is_active.is_(True),
            )
        )
        ids = []
        for chunk in result.scalars().all():
            chunk.is_active = False
            ids.append(chunk.embedding_id or chunk.id)
        await db.flush()
        return ids
