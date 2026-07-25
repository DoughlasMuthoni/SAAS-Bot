from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User


class UserRepository:
    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> User | None:
        result = await db.execute(
            select(User).where(User.email == email, User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: str) -> User | None:
        result = await db.execute(
            select(User).where(User.id == user_id, User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession,
        *,
        org_id: str,
        email: str,
        hashed_password: str,
        full_name: str,
        role: str = "editor",
    ) -> User:
        user = User(
            org_id=org_id,
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            role=role,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    @staticmethod
    async def list_by_org(db: AsyncSession, org_id: str) -> list[User]:
        result = await db.execute(
            select(User)
            .where(User.org_id == org_id, User.deleted_at.is_(None))
            .order_by(User.created_at)
        )
        return list(result.scalars().all())

    @staticmethod
    async def update_role(db: AsyncSession, user_id: str, role: str) -> None:
        await db.execute(
            update(User).where(User.id == user_id).values(role=role)
        )

    @staticmethod
    async def soft_delete(db: AsyncSession, user_id: str) -> None:
        await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(deleted_at=datetime.now(timezone.utc), is_active=False)
        )

    @staticmethod
    async def update_last_login(db: AsyncSession, user_id: str) -> None:
        await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(last_login_at=datetime.now(timezone.utc))
        )

    @staticmethod
    async def get_by_reset_token(db: AsyncSession, token: str) -> User | None:
        result = await db.execute(
            select(User).where(User.reset_token == token, User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def set_reset_token(
        db: AsyncSession, user_id: str, token: str, expires_at: datetime
    ) -> None:
        await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(reset_token=token, reset_token_expires_at=expires_at)
        )
        await db.commit()

    @staticmethod
    async def clear_reset_token(db: AsyncSession, user_id: str) -> None:
        await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(reset_token=None, reset_token_expires_at=None)
        )
        await db.commit()

    @staticmethod
    async def update_password(db: AsyncSession, user_id: str, hashed_password: str) -> None:
        await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(hashed_password=hashed_password)
        )
        await db.commit()
