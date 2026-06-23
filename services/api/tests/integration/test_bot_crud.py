import pytest
from httpx import AsyncClient


async def _get_token(client, org, make_user):
    user = await make_user(org.id, email="bottest@example.com")
    resp = await client.post("/api/v1/auth/login", json={"email": "bottest@example.com", "password": "password123"})
    return resp.json()["access_token"], user


@pytest.mark.anyio
async def test_create_and_get_bot(client: AsyncClient, make_org, make_workspace, make_user):
    org = await make_org()
    ws = await make_workspace(org.id)
    token, _ = await _get_token(client, org, make_user)
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post("/api/v1/bots", json={
        "name": "My Bot",
        "workspace_id": ws.id,
    }, headers=headers)
    assert resp.status_code == 201
    bot_id = resp.json()["id"]
    assert resp.json()["name"] == "My Bot"
    assert "public_key" in resp.json()

    get_resp = await client.get(f"/api/v1/bots/{bot_id}?workspace_id={ws.id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == bot_id


@pytest.mark.anyio
async def test_bot_not_found_in_other_workspace(client: AsyncClient, make_org, make_workspace, make_user, make_bot):
    org = await make_org()
    ws1 = await make_workspace(org.id)
    ws2 = await make_workspace(org.id)
    bot = await make_bot(ws1.id, org.id)
    token, _ = await _get_token(client, org, make_user)
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.get(f"/api/v1/bots/{bot.id}?workspace_id={ws2.id}", headers=headers)
    assert resp.status_code == 404
