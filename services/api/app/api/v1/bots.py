from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, require_role
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.models import User
from app.schemas.bot import BotCreate, BotResponse, BotUpdate, DomainCreate, DomainResponse
from app.services.bot_service import BotService
from app.services.plan_service import PlanService

router = APIRouter(prefix="/bots", tags=["bots"])

FREE_BRAND_COLOR = '#16A34A'
FREE_THEME = 'light'

# Role shortcuts
_viewer  = Depends(get_current_active_user)
_editor  = Depends(require_role("owner", "admin", "editor"))
_manager = Depends(require_role("owner", "admin"))


@router.get("", response_model=list[BotResponse])
async def list_bots(
    workspace_id: str,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    user: User = _viewer,
):
    bots = await BotService.list_bots(db, workspace_id, skip, limit)
    return [_to_response(b) for b in bots]


@router.post("", response_model=BotResponse, status_code=201)
async def create_bot(
    body: BotCreate,
    db: AsyncSession = Depends(get_db),
    user: User = _manager,
):
    await PlanService.check_bot_limit(db, user.org_id)
    limits = await PlanService.get_limits_for_org(db, user.org_id)
    if not limits.allow_custom_branding:
        body = body.model_copy(update={'brand_color': FREE_BRAND_COLOR, 'theme': 'light'})
    bot = await BotService.create_bot(db, user, body)
    return _to_response(bot)


@router.get("/{bot_id}", response_model=BotResponse)
async def get_bot(
    bot_id: str,
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = _viewer,
):
    try:
        bot = await BotService.get_bot(db, bot_id, workspace_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Bot not found")
    return _to_response(bot)


@router.put("/{bot_id}", response_model=BotResponse)
async def update_bot(
    bot_id: str,
    workspace_id: str,
    body: BotUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = _editor,
):
    limits = await PlanService.get_limits_for_org(db, user.org_id)
    if not limits.allow_custom_branding:
        # Strip branding fields — free plan can't customise them
        body = body.model_copy(update={'brand_color': FREE_BRAND_COLOR, 'theme': FREE_THEME})
    try:
        bot = await BotService.update_bot(db, bot_id, workspace_id, body)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Bot not found")
    return _to_response(bot)


@router.delete("/{bot_id}", status_code=204)
async def delete_bot(
    bot_id: str,
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = _manager,
):
    try:
        await BotService.delete_bot(db, bot_id, workspace_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Bot not found")


@router.get("/{bot_id}/domains", response_model=list[DomainResponse])
async def list_domains(
    bot_id: str,
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = _viewer,
):
    from app.repositories.bot_repository import DomainRepository
    return await DomainRepository.list_by_bot(db, bot_id, workspace_id)


@router.post("/{bot_id}/domains", response_model=DomainResponse, status_code=201)
async def add_domain(
    bot_id: str,
    workspace_id: str,
    body: DomainCreate,
    db: AsyncSession = Depends(get_db),
    user: User = _manager,
):
    try:
        return await BotService.add_domain(db, bot_id, workspace_id, body.domain)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Bot not found")


@router.delete("/{bot_id}/domains/{domain_id}", status_code=204)
async def remove_domain(
    bot_id: str,
    domain_id: str,
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = _manager,
):
    try:
        await BotService.remove_domain(db, domain_id, workspace_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Domain not found")


def _to_response(bot) -> BotResponse:
    return BotResponse(
        id=bot.id,
        workspace_id=bot.workspace_id,
        org_id=bot.org_id,
        name=bot.name,
        public_key=bot.public_key,
        brand_color=bot.brand_color,
        welcome_message=bot.welcome_message,
        fallback_email=bot.fallback_email,
        fallback_phone=bot.fallback_phone,
        fallback_whatsapp=bot.fallback_whatsapp,
        model_name=bot.model_name,
        is_active=bot.is_active,
        position=bot.position,
        theme=bot.theme,
        domains=[DomainResponse.model_validate(d) for d in (bot.domains or [])],
        created_at=bot.created_at.isoformat(),
    )
