import re

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models import Organization, User, Workspace
from app.repositories.user_repository import UserRepository


class AuthService:
    @staticmethod
    async def authenticate(db: AsyncSession, email: str, password: str) -> User:
        user = await UserRepository.get_by_email(db, email)
        if user is None or not verify_password(password, user.hashed_password):
            raise AuthenticationError("Invalid email or password")
        if not user.is_active:
            raise AuthenticationError("Account is inactive")
        await UserRepository.update_last_login(db, user.id)
        return user

    @staticmethod
    def create_tokens(user: User) -> tuple[str, str]:
        data = {"sub": user.id, "org_id": user.org_id, "role": user.role}
        access = create_access_token(data)
        refresh = create_refresh_token(data)
        return access, refresh

    @staticmethod
    async def register(
        db: AsyncSession, *, full_name: str, email: str, password: str, org_name: str
    ) -> User:
        existing = await UserRepository.get_by_email(db, email)
        if existing:
            raise ValueError("An account with this email already exists")

        slug_base = re.sub(r"[^a-z0-9]+", "-", org_name.lower()).strip("-")
        count = (await db.execute(
            select(func.count()).select_from(Organization).where(Organization.slug.like(f"{slug_base}%"))
        )).scalar() or 0
        slug = slug_base if count == 0 else f"{slug_base}-{count}"

        org = Organization(name=org_name, slug=slug, plan="free")
        db.add(org)
        await db.flush()

        workspace = Workspace(org_id=org.id, name="Main Workspace", slug="main")
        db.add(workspace)
        await db.flush()

        user = await UserRepository.create(
            db,
            org_id=org.id,
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role="owner",
        )
        return user

    @staticmethod
    async def refresh_access_token(db: AsyncSession, refresh_token: str) -> str:
        try:
            payload = decode_token(refresh_token)
        except ValueError:
            raise AuthenticationError("Invalid refresh token")
        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid token type")
        user_id = payload.get("sub")
        user = await UserRepository.get_by_id(db, user_id)
        if user is None or not user.is_active:
            raise AuthenticationError("User not found")
        data = {"sub": user.id, "org_id": user.org_id, "role": user.role}
        return create_access_token(data)
