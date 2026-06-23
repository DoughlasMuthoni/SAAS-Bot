"""Integration tests for knowledge source creation and ingestion triggering."""
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient


async def _get_token(client, org_id, make_user, email="sources@example.com"):
    await make_user(org_id, email=email)
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    return resp.json()["access_token"]


@pytest.mark.anyio
async def test_create_text_source_returns_201(client: AsyncClient, make_org, make_workspace, make_user, make_bot):
    org = await make_org()
    ws = await make_workspace(org.id)
    bot = await make_bot(ws.id, org.id)
    token = await _get_token(client, org.id, make_user)
    headers = {"Authorization": f"Bearer {token}"}

    with patch("app.workers.ingestion_worker.ingest_source_task", new_callable=AsyncMock):
        resp = await client.post(
            "/api/v1/sources/text",
            json={
                "workspace_id": ws.id,
                "bot_id": bot.id,
                "name": "About Us",
                "content": "We are a company that does things.",
            },
            headers=headers,
        )

    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "About Us"
    assert data["source_type"] == "text"
    assert data["status"] == "pending"
    assert data["workspace_id"] == ws.id
    assert data["bot_id"] == bot.id


@pytest.mark.anyio
async def test_create_faq_source_returns_201(client: AsyncClient, make_org, make_workspace, make_user, make_bot):
    org = await make_org()
    ws = await make_workspace(org.id)
    bot = await make_bot(ws.id, org.id)
    token = await _get_token(client, org.id, make_user, "faqsrc@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    with patch("app.workers.ingestion_worker.ingest_source_task", new_callable=AsyncMock):
        resp = await client.post(
            "/api/v1/sources/faq",
            json={
                "workspace_id": ws.id,
                "bot_id": bot.id,
                "name": "Product FAQs",
                "faqs": [
                    {"question": "What is your return policy?", "answer": "30 days no questions asked."},
                    {"question": "Do you ship internationally?", "answer": "Yes, to 50+ countries."},
                ],
            },
            headers=headers,
        )

    assert resp.status_code == 201
    data = resp.json()
    assert data["source_type"] == "faq"
    assert data["status"] == "pending"


@pytest.mark.anyio
async def test_list_sources_scoped_to_workspace(client: AsyncClient, make_org, make_workspace, make_user, make_bot):
    org = await make_org()
    ws1 = await make_workspace(org.id)
    ws2 = await make_workspace(org.id)
    bot1 = await make_bot(ws1.id, org.id)
    token = await _get_token(client, org.id, make_user, "listsrc@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    with patch("app.workers.ingestion_worker.ingest_source_task", new_callable=AsyncMock):
        await client.post(
            "/api/v1/sources/text",
            json={"workspace_id": ws1.id, "bot_id": bot1.id, "name": "WS1 Source", "content": "content"},
            headers=headers,
        )

    resp = await client.get(f"/api/v1/sources?workspace_id={ws1.id}", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp2 = await client.get(f"/api/v1/sources?workspace_id={ws2.id}", headers=headers)
    assert resp2.status_code == 200
    assert len(resp2.json()) == 0


@pytest.mark.anyio
async def test_toggle_source_disables_and_enables(client: AsyncClient, make_org, make_workspace, make_user, make_bot):
    org = await make_org()
    ws = await make_workspace(org.id)
    bot = await make_bot(ws.id, org.id)
    token = await _get_token(client, org.id, make_user, "togglesrc@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    with patch("app.workers.ingestion_worker.ingest_source_task", new_callable=AsyncMock):
        create_resp = await client.post(
            "/api/v1/sources/text",
            json={"workspace_id": ws.id, "bot_id": bot.id, "name": "Toggle Test", "content": "Some content"},
            headers=headers,
        )
    source_id = create_resp.json()["id"]

    # Disable the source
    with patch("app.services.ingestion_service.IngestionService.delete_source_embeddings", new_callable=AsyncMock):
        disable_resp = await client.post(
            f"/api/v1/sources/{source_id}/toggle?workspace_id={ws.id}", headers=headers
        )
    assert disable_resp.json()["status"] == "disabled"

    # Re-enable
    enable_resp = await client.post(
        f"/api/v1/sources/{source_id}/toggle?workspace_id={ws.id}", headers=headers
    )
    assert enable_resp.json()["status"] == "indexed"


@pytest.mark.anyio
async def test_source_not_found_returns_404(client: AsyncClient, make_org, make_workspace, make_user):
    org = await make_org()
    ws = await make_workspace(org.id)
    token = await _get_token(client, org.id, make_user, "notfoundsrc@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post(
        f"/api/v1/sources/nonexistent-id/reindex?workspace_id={ws.id}", headers=headers
    )
    assert resp.status_code == 404
