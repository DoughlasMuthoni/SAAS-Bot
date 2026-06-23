from functools import lru_cache

from app.core.config import get_settings
from app.core.logging import get_logger
from app.providers.embedding_provider import EmbeddingProvider

logger = get_logger(__name__)


@lru_cache
def get_embedding_provider() -> EmbeddingProvider:
    settings = get_settings()
    logger.info("Initialising embedding provider", provider=settings.EMBEDDING_PROVIDER)
    if settings.EMBEDDING_PROVIDER == "local":
        from app.providers.sentence_transformer_provider import SentenceTransformerProvider
        logger.info("Loading sentence-transformers model — may download on first run")
        return SentenceTransformerProvider()
    from app.providers.anthropic_embedding_provider import AnthropicEmbeddingProvider
    logger.info("Using Voyage AI embedding provider")
    return AnthropicEmbeddingProvider()
