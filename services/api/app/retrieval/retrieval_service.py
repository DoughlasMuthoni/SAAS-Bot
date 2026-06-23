from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models import Bot, DocumentChunk
from app.providers.provider_factory import get_embedding_provider
from app.retrieval.chroma_vector_store import get_vector_store

logger = get_logger(__name__)


@dataclass
class RetrievedChunk:
    chunk_id: str
    content: str
    source_name: str
    source_url: str | None
    source_id: str
    score: float


@dataclass
class RetrievalResult:
    chunks: list[RetrievedChunk]
    was_empty: bool


class RetrievalService:
    @staticmethod
    async def retrieve(
        query: str,
        bot: Bot,
        db: AsyncSession,
        top_k: int = 5,
    ) -> RetrievalResult:
        query = query.strip()[:512]
        if not query:
            return RetrievalResult(chunks=[], was_empty=True)

        try:
            provider = get_embedding_provider()
            embeddings = await provider.embed_texts([query])
            query_embedding = embeddings[0]
        except Exception as e:
            logger.error("Embedding failed", error=str(e))
            return RetrievalResult(chunks=[], was_empty=True)

        vector_store = get_vector_store()
        collection = f"ws_{bot.workspace_id}"

        try:
            results = await vector_store.query(
                collection=collection,
                embedding=query_embedding,
                top_k=top_k * 2,
                filter_metadata={"bot_id": str(bot.id)},
            )
        except Exception as e:
            logger.error("Vector store query failed", error=str(e))
            return RetrievalResult(chunks=[], was_empty=True)

        if not results:
            return RetrievalResult(chunks=[], was_empty=True)

        # Fetch canonical content from MySQL (source of truth)
        chunk_ids = [r.id for r in results]
        db_result = await db.execute(
            select(DocumentChunk).where(
                DocumentChunk.id.in_(chunk_ids),
                DocumentChunk.workspace_id == str(bot.workspace_id),
                DocumentChunk.bot_id == str(bot.id),
                DocumentChunk.is_active.is_(True),
            )
        )
        db_chunks = {c.id: c for c in db_result.scalars().all()}

        # Load source names
        from sqlalchemy import select as sel
        from app.models import KnowledgeSource
        source_ids = {c.source_id for c in db_chunks.values()}
        sources_result = await db.execute(
            sel(KnowledgeSource).where(KnowledgeSource.id.in_(source_ids))
        )
        sources = {s.id: s for s in sources_result.scalars().all()}

        retrieved: list[RetrievedChunk] = []
        for vr in results:
            if vr.id not in db_chunks:
                continue
            chunk = db_chunks[vr.id]
            source = sources.get(chunk.source_id)
            retrieved.append(RetrievedChunk(
                chunk_id=chunk.id,
                content=chunk.content,
                source_name=source.name if source else "Unknown",
                source_url=source.content_url if source else None,
                source_id=chunk.source_id,
                score=vr.score,
            ))

        # Re-rank by score and take top_k
        retrieved.sort(key=lambda x: x.score, reverse=True)
        retrieved = retrieved[:top_k]

        return RetrievalResult(chunks=retrieved, was_empty=len(retrieved) == 0)
