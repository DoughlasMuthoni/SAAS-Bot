"""Integration tests for the widget chat endpoint: session, chat streaming, lead capture."""
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, AsyncIterator
from httpx import AsyncClient

from app.models import Domain
from app.services.session_service import SessionService
from app.utils.ids import generate_uuid


async def _add_domain(db, bot_id: str, workspace_id: str, domain_str: str):
    """Helper to add an allowed domain entry for a bot."""
    domain = Domain(id=generate_uuid(), bot_id=bot_id, workspace_id=workspace_id, domain=domain_str)
    db.add(domain)
    await db.flush()


async def _stream_lines(response) -> list[str]:
    """Parse SSE data lines from a streaming response."""
    lines = []
    for line in response.text.splitlines():
        if line.startswith("data: "):
            lines.append(line[len("data: "):])
    return lines


@pytest.mark.anyio
async def test_get_widget_config(client: AsyncClient, db, make_org, make_workspace, make_bot):
    org = await make_org()
    ws = await make_workspace(org.id)
    bot = await make_bot(ws.id, org.id)

    resp = await client.get(f"/api/v1/widget/config/{bot.public_key}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["bot_id"] == bot.id
    assert data["name"] == "Test Bot"


@pytest.mark.anyio
async def test_get_widget_config_not_found(client: AsyncClient):
    resp = await client.get("/api/v1/widget/config/nonexistent-key")
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_create_session_valid_domain(client: AsyncClient, db, make_org, make_workspace, make_bot):
    org = await make_org()
    ws = await make_workspace(org.id)
    bot = await make_bot(ws.id, org.id)
    await _add_domain(db, bot.id, ws.id, "example.com")

    resp = await client.post(
        "/api/v1/widget/session",
        json={"public_key": bot.public_key, "domain": "example.com"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "session_token" in data
    assert "session_id" in data


@pytest.mark.anyio
async def test_create_session_unlisted_domain_returns_403(client: AsyncClient, db, make_org, make_workspace, make_bot):
    org = await make_org()
    ws = await make_workspace(org.id)
    bot = await make_bot(ws.id, org.id)
    await _add_domain(db, bot.id, ws.id, "allowed.com")

    resp = await client.post(
        "/api/v1/widget/session",
        json={"public_key": bot.public_key, "domain": "notallowed.com"},
    )
    assert resp.status_code == 403


@pytest.mark.anyio
async def test_chat_streams_token_events(client: AsyncClient, db, make_org, make_workspace, make_bot):
    org = await make_org()
    ws = await make_workspace(org.id)
    bot = await make_bot(ws.id, org.id)
    await _add_domain(db, bot.id, ws.id, "example.com")

    token, session_id = SessionService.create_session(bot.id, ws.id)

    async def fake_stream(*args, **kwargs):
        for word in ["Hello", " there", "!"]:
            yield word

    with (
        patch("app.services.chat_service.RetrievalService.retrieve") as mock_retrieve,
        patch("app.services.chat_service.get_anthropic_provider") as mock_get_provider,
        patch("app.repositories.bot_repository.DomainRepository.validate_domain", return_value=True),
    ):
        mock_provider = MagicMock()
        mock_provider.stream_chat = fake_stream
        mock_provider.get_last_usage = MagicMock(return_value=None)
        mock_get_provider.return_value = mock_provider

        from app.retrieval.retrieval_service import RetrievalResult
        mock_retrieve.return_value = RetrievalResult(chunks=[], was_empty=True)

        resp = await client.post(
            "/api/v1/widget/chat",
            json={"session_token": token, "message": "Hello?", "history": []},
            headers={"referer": "https://example.com"},
        )

    assert resp.status_code == 200
    lines = await _stream_lines(resp)
    assert len(lines) > 0

    events = [json.loads(line) for line in lines]
    event_types = [e["type"] for e in events]
    assert "token" in event_types
    assert "done" in event_types
    assert events[-1]["type"] == "done"


@pytest.mark.anyio
async def test_chat_invalid_session_token_returns_401(client: AsyncClient):
    resp = await client.post(
        "/api/v1/widget/chat",
        json={"session_token": "bad.token.here", "message": "Hi", "history": []},
    )
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_lead_capture_stores_lead(client: AsyncClient, db, make_org, make_workspace, make_bot):
    org = await make_org()
    ws = await make_workspace(org.id)
    bot = await make_bot(ws.id, org.id)

    token, _ = SessionService.create_session(bot.id, ws.id)

    resp = await client.post(
        "/api/v1/widget/lead",
        json={
            "session_token": token,
            "name": "Jane Doe",
            "email": "jane@example.com",
            "phone": "+1555000000",
            "message": "I need help with my order",
            "page_url": "https://example.com/contact",
        },
    )
    assert resp.status_code == 201
    assert "id" in resp.json()
