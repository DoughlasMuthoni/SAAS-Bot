from app.providers.embedding_provider import EmbeddingProvider

_MODEL = "all-MiniLM-L6-v2"
_DIMENSIONS = 384


class SentenceTransformerProvider(EmbeddingProvider):
    def __init__(self):
        from sentence_transformers import SentenceTransformer
        self._model = SentenceTransformer(_MODEL)

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        embeddings = self._model.encode(texts, convert_to_numpy=True)
        return [e.tolist() for e in embeddings]

    def get_model_name(self) -> str:
        return _MODEL

    def get_dimensions(self) -> int:
        return _DIMENSIONS
