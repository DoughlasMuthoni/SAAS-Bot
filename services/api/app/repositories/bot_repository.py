from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import generate_public_key
from app.models import Bot, Domain
from app.utils.ids import generate_uuid


class BotRepository:
    @staticmethod
    async def list_by_workspace(
        db: AsyncSession, workspace_id: str, skip: int = 0, limit: int = 20
    ) -> list[Bot]:
        result = await db.execute(
            select(Bot)
            .where(Bot.workspace_id == workspace_id, Bot.deleted_at.is_(None))
            .options(selectinload(Bot.domains))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(db: AsyncSession, bot_id: str, workspace_id: str) -> Bot | None:
        result = await db.execute(
            select(Bot)
            .where(Bot.id == bot_id, Bot.workspace_id == workspace_id, Bot.deleted_at.is_(None))
            .options(selectinload(Bot.domains))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_public_key(db: AsyncSession, public_key: str) -> Bot | None:
        result = await db.execute(
            select(Bot)
            .where(Bot.public_key == public_key, Bot.deleted_at.is_(None), Bot.is_active.is_(True))
            .options(selectinload(Bot.domains))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, *, workspace_id: str, org_id: str, data: dict) -> Bot:
        bot = Bot(
            id=generate_uuid(),
            workspace_id=workspace_id,
            org_id=org_id,
            public_key=generate_public_key(),
            **data,
        )
        db.add(bot)
        await db.flush()
        await db.refresh(bot)
        await db.refresh(bot, ["domains"])
        return bot

    @staticmethod
    async def update(db: AsyncSession, bot: Bot, data: dict) -> Bot:
        for key, value in data.items():
            if value is not None:
                setattr(bot, key, value)
        await db.flush()
        return bot

    @staticmethod
    async def soft_delete(db: AsyncSession, bot: Bot) -> None:
        from datetime import datetime, timezone
        bot.deleted_at = datetime.now(timezone.utc)
        await db.flush()


class DomainRepository:
    @staticmethod
    async def list_by_bot(db: AsyncSession, bot_id: str, workspace_id: str) -> list[Domain]:
        result = await db.execute(
            select(Domain).where(Domain.bot_id == bot_id, Domain.workspace_id == workspace_id)
        )
        return list(result.scalars().all())

    @staticmethod
    async def create(db: AsyncSession, *, bot_id: str, workspace_id: str, domain: str) -> Domain:
        d = Domain(id=generate_uuid(), bot_id=bot_id, workspace_id=workspace_id, domain=domain)
        db.add(d)
        await db.flush()
        return d

    @staticmethod
    async def delete(db: AsyncSession, domain_id: str, workspace_id: str) -> bool:
        result = await db.execute(
            select(Domain).where(Domain.id == domain_id, Domain.workspace_id == workspace_id)
        )
        domain = result.scalar_one_or_none()
        if domain is None:
            return False
        await db.delete(domain)
        await db.flush()
        return True

    @staticmethod
    async def validate_domain(db: AsyncSession, bot_public_key: str, origin: str) -> bool:
        result = await db.execute(
            select(Bot).where(Bot.public_key == bot_public_key, Bot.deleted_at.is_(None))
        )
        bot = result.scalar_one_or_none()
        if bot is None:
            return False

        domains_result = await db.execute(
            select(Domain).where(
                Domain.bot_id == bot.id,
                Domain.workspace_id == bot.workspace_id,
                Domain.is_active.is_(True),
            )
        )
        domains = list(domains_result.scalars().all())
        if not domains:
            return True  # no restrictions configured

        origin_host = origin.lower().split("//")[-1].split("/")[0].split(":")[0]
        for d in domains:
            pattern = d.domain.lower().lstrip("*.")
            if origin_host == pattern or origin_host.endswith("." + pattern):
                return True
        return False
