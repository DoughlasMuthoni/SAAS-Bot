from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.logging import get_logger
from app.models import Bot, User
from app.repositories.bot_repository import BotRepository, DomainRepository
from app.schemas.bot import BotCreate, BotUpdate

logger = get_logger(__name__)


class BotService:
    @staticmethod
    async def create_bot(db: AsyncSession, user: User, data: BotCreate) -> Bot:
        payload = data.model_dump(exclude={"workspace_id"})
        bot = await BotRepository.create(
            db,
            workspace_id=data.workspace_id,
            org_id=user.org_id,
            data=payload,
        )
        logger.info("Bot created", bot_id=bot.id, workspace_id=data.workspace_id)
        return bot

    @staticmethod
    async def get_bot(db: AsyncSession, bot_id: str, workspace_id: str) -> Bot:
        bot = await BotRepository.get_by_id(db, bot_id, workspace_id)
        if bot is None:
            raise NotFoundError("Bot not found")
        return bot

    @staticmethod
    async def list_bots(db: AsyncSession, workspace_id: str, skip: int, limit: int) -> list[Bot]:
        return await BotRepository.list_by_workspace(db, workspace_id, skip, limit)

    @staticmethod
    async def update_bot(db: AsyncSession, bot_id: str, workspace_id: str, data: BotUpdate) -> Bot:
        bot = await BotRepository.get_by_id(db, bot_id, workspace_id)
        if bot is None:
            raise NotFoundError("Bot not found")
        update_data = data.model_dump(exclude_none=True)
        bot = await BotRepository.update(db, bot, update_data)
        return bot

    @staticmethod
    async def delete_bot(db: AsyncSession, bot_id: str, workspace_id: str) -> None:
        bot = await BotRepository.get_by_id(db, bot_id, workspace_id)
        if bot is None:
            raise NotFoundError("Bot not found")
        await BotRepository.soft_delete(db, bot)

    @staticmethod
    async def add_domain(db: AsyncSession, bot_id: str, workspace_id: str, domain: str):
        bot = await BotRepository.get_by_id(db, bot_id, workspace_id)
        if bot is None:
            raise NotFoundError("Bot not found")
        return await DomainRepository.create(db, bot_id=bot_id, workspace_id=workspace_id, domain=domain)

    @staticmethod
    async def remove_domain(db: AsyncSession, domain_id: str, workspace_id: str) -> None:
        deleted = await DomainRepository.delete(db, domain_id, workspace_id)
        if not deleted:
            raise NotFoundError("Domain not found")
