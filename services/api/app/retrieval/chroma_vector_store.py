from functools import lru_cache

import chromadb

from app.core.config import get_settings
from app.retrieval.vector_store import VectorDocument, VectorResult, VectorStoreProvider


class ChromaVectorStore(VectorStoreProvider):
    def __init__(self, persist_dir: str):
        self._client = chromadb.PersistentClient(path=persist_dir)

    def _get_collection(self, name: str):
        return self._client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"},
        )

    async def upsert(self, collection: str, docs: list[VectorDocument]) -> None:
        col = self._get_collection(collection)
        col.upsert(
            ids=[d.id for d in docs],
            embeddings=[d.embedding for d in docs],
            documents=[d.content for d in docs],
            metadatas=[d.metadata for d in docs],
        )

    async def query(
        self,
        collection: str,
        embedding: list[float],
        top_k: int,
        filter_metadata: dict | None = None,
    ) -> list[VectorResult]:
        col = self._get_collection(collection)
        kwargs: dict = {"query_embeddings": [embedding], "n_results": top_k, "include": ["documents", "metadatas", "distances"]}
        if filter_metadata:
            # ChromaDB uses $eq / $and operators for filtering
            where_clauses = [{"$eq": v} if not isinstance(v, dict) else v for k, v in filter_metadata.items()]
            if len(filter_metadata) == 1:
                k, v = next(iter(filter_metadata.items()))
                kwargs["where"] = {k: {"$eq": v}}
            else:
                kwargs["where"] = {"$and": [{k: {"$eq": v}} for k, v in filter_metadata.items()]}
        results = col.query(**kwargs)
        out = []
        for i, doc_id in enumerate(results["ids"][0]):
            out.append(VectorResult(
                id=doc_id,
                content=results["documents"][0][i],
                metadata=results["metadatas"][0][i],
                score=1.0 - results["distances"][0][i],  # cosine: distance→similarity
            ))
        return out

    async def delete(self, collection: str, doc_ids: list[str]) -> None:
        col = self._get_collection(collection)
        col.delete(ids=doc_ids)

    async def delete_by_filter(self, collection: str, filter_metadata: dict) -> None:
        col = self._get_collection(collection)
        where = {k: {"$eq": v} for k, v in filter_metadata.items()}
        if len(where) > 1:
            where = {"$and": [{k: {"$eq": v}} for k, v in filter_metadata.items()]}
        elif where:
            k, v = next(iter(filter_metadata.items()))
            where = {k: {"$eq": v}}
        col.delete(where=where)


@lru_cache
def get_vector_store() -> VectorStoreProvider:
    settings = get_settings()
    return ChromaVectorStore(settings.CHROMA_PERSIST_DIR)
