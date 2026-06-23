import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_login_success(client: AsyncClient, make_org, make_user):
    org = await make_org()
    await make_user(org.id, email="admin@example.com")

    resp = await client.post("/api/v1/auth/login", json={"email": "admin@example.com", "password": "password123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.anyio
async def test_login_wrong_password(client: AsyncClient, make_org, make_user):
    org = await make_org()
    await make_user(org.id, email="admin2@example.com")

    resp = await client.post("/api/v1/auth/login", json={"email": "admin2@example.com", "password": "wrongpass"})
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_me_requires_auth(client: AsyncClient):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_me_returns_user(client: AsyncClient, make_org, make_user):
    org = await make_org()
    await make_user(org.id, email="me@example.com")

    login = await client.post("/api/v1/auth/login", json={"email": "me@example.com", "password": "password123"})
    token = login.json()["access_token"]

    resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@example.com"
