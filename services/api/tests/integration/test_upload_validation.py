"""Integration tests for file upload validation: MIME type, size, and happy path."""
import io
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient


async def _get_token(client, org_id, make_user, email="upload@example.com"):
    await make_user(org_id, email=email)
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    return resp.json()["access_token"]


def _make_file(content: bytes, filename: str, content_type: str):
    return ("file", (filename, io.BytesIO(content), content_type))


@pytest.mark.anyio
async def test_upload_valid_text_file(
    client: AsyncClient, make_org, make_workspace, make_user, make_bot, tmp_path
):
    org = await make_org()
    ws = await make_workspace(org.id)
    bot = await make_bot(ws.id, org.id)
    token = await _get_token(client, org.id, make_user)
    headers = {"Authorization": f"Bearer {token}"}

    content = b"This is a test document with some content."

    with (
        patch("app.api.v1.sources.save_upload", new_callable=AsyncMock, return_value="ws/test.txt"),
        patch("app.workers.ingestion_worker.ingest_source_task", new_callable=AsyncMock),
    ):
        resp = await client.post(
            "/api/v1/sources/upload",
            params={"workspace_id": ws.id, "bot_id": bot.id, "name": "Test Doc"},
            files=[_make_file(content, "test.txt", "text/plain")],
            headers=headers,
        )

    assert resp.status_code == 201
    data = resp.json()
    assert data["source_type"] == "upload"
    assert data["status"] == "pending"


@pytest.mark.anyio
async def test_upload_disallowed_mime_type_returns_422(
    client: AsyncClient, make_org, make_workspace, make_user, make_bot
):
    org = await make_org()
    ws = await make_workspace(org.id)
    bot = await make_bot(ws.id, org.id)
    token = await _get_token(client, org.id, make_user, "badmime@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post(
        "/api/v1/sources/upload",
        params={"workspace_id": ws.id, "bot_id": bot.id, "name": "Hack"},
        files=[_make_file(b"<script>alert(1)</script>", "hack.html", "text/html")],
        headers=headers,
    )
    assert resp.status_code == 422


@pytest.mark.anyio
async def test_upload_exceeds_size_limit_returns_422(
    client: AsyncClient, make_org, make_workspace, make_user, make_bot
):
    org = await make_org()
    ws = await make_workspace(org.id)
    bot = await make_bot(ws.id, org.id)
    token = await _get_token(client, org.id, make_user, "bigfile@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Create a file larger than 20MB limit
    oversized = b"x" * (21 * 1024 * 1024)

    resp = await client.post(
        "/api/v1/sources/upload",
        params={"workspace_id": ws.id, "bot_id": bot.id, "name": "Big File"},
        files=[_make_file(oversized, "big.txt", "text/plain")],
        headers=headers,
    )
    assert resp.status_code == 422


@pytest.mark.anyio
async def test_upload_requires_authentication(client: AsyncClient, make_org, make_workspace, make_bot):
    org = await make_org()
    ws = await make_workspace(org.id)
    bot = await make_bot(ws.id, org.id)

    resp = await client.post(
        "/api/v1/sources/upload",
        params={"workspace_id": ws.id, "bot_id": bot.id, "name": "Test"},
        files=[_make_file(b"content", "test.txt", "text/plain")],
    )
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_upload_pdf_accepted(
    client: AsyncClient, make_org, make_workspace, make_user, make_bot
):
    org = await make_org()
    ws = await make_workspace(org.id)
    bot = await make_bot(ws.id, org.id)
    token = await _get_token(client, org.id, make_user, "pdftest@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Minimal valid PDF header bytes
    pdf_content = b"%PDF-1.4 test document content"

    with (
        patch("app.api.v1.sources.save_upload", new_callable=AsyncMock, return_value="ws/test.pdf"),
        patch("app.workers.ingestion_worker.ingest_source_task", new_callable=AsyncMock),
    ):
        resp = await client.post(
            "/api/v1/sources/upload",
            params={"workspace_id": ws.id, "bot_id": bot.id, "name": "Manual PDF"},
            files=[_make_file(pdf_content, "doc.pdf", "application/pdf")],
            headers=headers,
        )

    assert resp.status_code == 201
    assert resp.json()["source_type"] == "upload"
