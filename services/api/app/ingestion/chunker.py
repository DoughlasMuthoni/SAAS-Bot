import re
from dataclasses import dataclass

from app.utils.hashing import sha256_hash
from app.utils.ids import generate_uuid


@dataclass
class ChunkSettings:
    chunk_size_chars: int = 3200
    overlap_chars: int = 600
    min_chunk_chars: int = 100


@dataclass
class ChunkData:
    id: str
    document_id: str
    source_id: str
    workspace_id: str
    bot_id: str
    chunk_index: int
    content: str
    content_hash: str
    char_count: int
    token_count: int  # approximated as char_count // 4


class ChunkingService:
    @staticmethod
    def chunk_text(
        text: str,
        *,
        document_id: str,
        source_id: str,
        workspace_id: str,
        bot_id: str,
        settings: ChunkSettings | None = None,
    ) -> list[ChunkData]:
        cfg = settings or ChunkSettings()
        text = _normalize(text)
        if not text:
            return []

        chunks: list[str] = []
        start = 0
        while start < len(text):
            end = min(start + cfg.chunk_size_chars, len(text))
            chunk = text[start:end]
            if len(chunk) >= cfg.min_chunk_chars:
                chunks.append(chunk)
            start += cfg.chunk_size_chars - cfg.overlap_chars
            if start >= len(text):
                break

        return [
            ChunkData(
                id=generate_uuid(),
                document_id=document_id,
                source_id=source_id,
                workspace_id=workspace_id,
                bot_id=bot_id,
                chunk_index=i,
                content=c,
                content_hash=sha256_hash(c),
                char_count=len(c),
                token_count=max(1, len(c) // 4),
            )
            for i, c in enumerate(chunks)
        ]

    @staticmethod
    def chunk_faq(
        question: str,
        answer: str,
        *,
        document_id: str,
        source_id: str,
        workspace_id: str,
        bot_id: str,
        chunk_index: int,
    ) -> ChunkData:
        content = f"Q: {question.strip()}\nA: {answer.strip()}"
        return ChunkData(
            id=generate_uuid(),
            document_id=document_id,
            source_id=source_id,
            workspace_id=workspace_id,
            bot_id=bot_id,
            chunk_index=chunk_index,
            content=content,
            content_hash=sha256_hash(content),
            char_count=len(content),
            token_count=max(1, len(content) // 4),
        )


def _normalize(text: str) -> str:
    text = re.sub(r"\r\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()
