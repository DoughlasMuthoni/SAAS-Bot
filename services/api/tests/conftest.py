import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import hash_password
from app.main import create_app
from app.models import Base, Bot, Organization, User, Workspace
from app.utils.ids import generate_uuid
from app.core.security import generate_public_key

# Use in-memory SQLite for tests (fast, no MySQL needed)
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="function")
async def db_engine():
    engine = create_async_engine(TEST_DB_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture(scope="function")
async def db(db_engine):
    session_factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest.fixture(scope="function")
async def client(db):
    app = create_app()

    async def override_get_db():
        yield db

    from app.core.database import get_db
    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def make_org(db: AsyncSession):
    async def _make(name: str = "Test Org") -> Organization:
        org = Organization(id=generate_uuid(), name=name, slug=generate_uuid()[:8])
        db.add(org)
        await db.flush()
        return org
    return _make


@pytest.fixture
async def make_workspace(db: AsyncSession):
    async def _make(org_id: str, name: str = "Test Workspace") -> Workspace:
        ws = Workspace(id=generate_uuid(), org_id=org_id, name=name, slug=generate_uuid()[:8])
        db.add(ws)
        await db.flush()
        return ws
    return _make


@pytest.fixture
async def make_user(db: AsyncSession):
    async def _make(org_id: str, email: str = "test@example.com", role: str = "owner") -> User:
        user = User(
            id=generate_uuid(),
            org_id=org_id,
            email=email,
            hashed_password=hash_password("password123"),
            full_name="Test User",
            role=role,
        )
        db.add(user)
        await db.flush()
        return user
    return _make


@pytest.fixture
async def make_bot(db: AsyncSession):
    async def _make(workspace_id: str, org_id: str) -> Bot:
        bot = Bot(
            id=generate_uuid(),
            workspace_id=workspace_id,
            org_id=org_id,
            name="Test Bot",
            public_key=generate_public_key(),
        )
        db.add(bot)
        await db.flush()
        return bot
    return _make
