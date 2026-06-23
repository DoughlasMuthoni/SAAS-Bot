from abc import ABC, abstractmethod


class EmbeddingProvider(ABC):
    @abstractmethod
    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        ...

    @abstractmethod
    def get_model_name(self) -> str:
        ...

    @abstractmethod
    def get_dimensions(self) -> int:
        ...
