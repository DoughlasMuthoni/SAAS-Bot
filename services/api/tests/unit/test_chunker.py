import pytest

from app.ingestion.chunker import ChunkingService, ChunkSettings


def test_chunks_long_text():
    text = "A" * 10000
    chunks = ChunkingService.chunk_text(
        text, document_id="d1", source_id="s1", workspace_id="w1", bot_id="b1"
    )
    assert len(chunks) > 1
    assert all(len(c.content) > 0 for c in chunks)


def test_chunk_indexes_are_sequential():
    text = "word " * 2000
    chunks = ChunkingService.chunk_text(
        text, document_id="d1", source_id="s1", workspace_id="w1", bot_id="b1"
    )
    for i, c in enumerate(chunks):
        assert c.chunk_index == i


def test_short_text_produces_one_chunk():
    text = "Hello world"
    chunks = ChunkingService.chunk_text(
        text, document_id="d1", source_id="s1", workspace_id="w1", bot_id="b1"
    )
    assert len(chunks) == 1
    assert chunks[0].content == "Hello world"


def test_empty_text_produces_no_chunks():
    chunks = ChunkingService.chunk_text(
        "", document_id="d1", source_id="s1", workspace_id="w1", bot_id="b1"
    )
    assert chunks == []


def test_faq_chunk_format():
    chunk = ChunkingService.chunk_faq(
        question="What is your return policy?",
        answer="30 days no questions asked.",
        document_id="d1",
        source_id="s1",
        workspace_id="w1",
        bot_id="b1",
        chunk_index=0,
    )
    assert "Q: What is your return policy?" in chunk.content
    assert "A: 30 days no questions asked." in chunk.content


def test_chunk_hashes_are_deterministic():
    text = "Same text always"
    c1 = ChunkingService.chunk_text(
        text, document_id="d1", source_id="s1", workspace_id="w1", bot_id="b1"
    )
    c2 = ChunkingService.chunk_text(
        text, document_id="d1", source_id="s1", workspace_id="w1", bot_id="b1"
    )
    assert c1[0].content_hash == c2[0].content_hash


def test_min_chunk_size_respected():
    settings = ChunkSettings(chunk_size_chars=100, overlap_chars=10, min_chunk_chars=50)
    text = "x" * 200
    chunks = ChunkingService.chunk_text(
        text,
        document_id="d1",
        source_id="s1",
        workspace_id="w1",
        bot_id="b1",
        settings=settings,
    )
    assert all(c.char_count >= 50 for c in chunks)
