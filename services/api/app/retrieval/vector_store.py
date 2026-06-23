from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class VectorDocument:
    id: str
    embedding: list[float]
    content: str
    metadata: dict = field(default_factory=dict)


@dataclass
class VectorResult:
    id: str
    content: str
    metadata: dict
    score: float


class VectorStoreProvider(ABC):
    @abstractmethod
    async def upsert(self, collection: str, docs: list[VectorDocument]) -> None:
        ...

    @abstractmethod
    async def query(
        self,
        collection: str,
        embedding: list[float],
        top_k: int,
        filter_metadata: dict | None = None,
    ) -> list[VectorResult]:
        ...

    @abstractmethod
    async def delete(self, collection: str, doc_ids: list[str]) -> None:
        ...

    @abstractmethod
    async def delete_by_filter(self, collection: str, filter_metadata: dict) -> None:
        ...
