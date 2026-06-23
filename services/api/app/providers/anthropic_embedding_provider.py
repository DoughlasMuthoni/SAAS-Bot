import asyncio
from functools import lru_cache

import voyageai

from app.core.config import get_settings
from app.providers.embedding_provider import EmbeddingProvider

_BATCH_SIZE = 96
_MODEL = "voyage-3"
_DIMENSIONS = 1024


class AnthropicEmbeddingProvider(EmbeddingProvider):
    """Embedding provider using Voyage AI (voyage-3 model).

    Voyage AI was acquired by Anthropic and provides the recommended
    embedding model for use with the Anthropic ecosystem.
    API key: set VOYAGE_API_KEY env var (falls back to ANTHROPIC_API_KEY).
    """

    def __init__(self):
        settings = get_settings()
        api_key = getattr(settings, "VOYAGE_API_KEY", None) or settings.ANTHROPIC_API_KEY
        self._client = voyageai.AsyncClient(api_key=api_key)

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        results: list[list[float]] = []
        for i in range(0, len(texts), _BATCH_SIZE):
            batch = texts[i : i + _BATCH_SIZE]
            response = await self._client.embed(batch, model=_MODEL, input_type="document")
            results.extend(response.embeddings)
        return results

    def get_model_name(self) -> str:
        return _MODEL

    def get_dimensions(self) -> int:
        return _DIMENSIONS
