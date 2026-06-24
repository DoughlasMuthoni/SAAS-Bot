from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select

from app.core.database import get_db
from app.core.exceptions import AuthenticationError
from app.models import Lead, Organization
from app.models.plan import Plan
from app.repositories.bot_repository import BotRepository
from app.schemas.chat import (
    ChatRequest,
    LeadCreateRequest,
    SessionCreateRequest,
    SessionCreateResponse,
    WidgetConfigResponse,
)
from app.services.chat_service import ChatService
from app.services.plan_service import PlanService
from app.services.session_service import SessionService
from app.utils.ids import generate_uuid

router = APIRouter(prefix="/widget", tags=["widget"])


@router.get("/config/{public_key}", response_model=WidgetConfigResponse)
async def get_widget_config(public_key: str, db: AsyncSession = Depends(get_db)):
    bot = await BotRepository.get_by_public_key(db, public_key)
    if bot is None:
        raise HTTPException(status_code=404, detail="Bot not found")

    # Resolve the org to enforce suspension and determine branding gate
    allow_custom_branding = False
    org_result = await db.execute(select(Organization).where(Organization.id == bot.org_id))
    org = org_result.scalar_one_or_none()
    if org:
        if org.suspended_at is not None:
            raise HTTPException(status_code=403, detail="This service is currently unavailable.")
        plan_result = await db.execute(select(Plan).where(Plan.slug == org.plan))
        plan = plan_result.scalar_one_or_none()
        if plan:
            allow_custom_branding = plan.allow_custom_branding

    return WidgetConfigResponse(
        bot_id=bot.id,
        name=bot.name,
        brand_color=bot.brand_color,
        welcome_message=bot.welcome_message,
        position=bot.position,
        theme=bot.theme,
        show_branding=not allow_custom_branding,
    )


@router.post("/session", response_model=SessionCreateResponse)
async def create_session(body: SessionCreateRequest, db: AsyncSession = Depends(get_db)):
    bot = await BotRepository.get_by_public_key(db, body.public_key)
    if bot is None:
        raise HTTPException(status_code=404, detail="Bot not found")

    from app.repositories.bot_repository import DomainRepository
    is_allowed = await DomainRepository.validate_domain(db, body.public_key, body.domain)
    if not is_allowed:
        raise HTTPException(status_code=403, detail="Domain not authorized for this bot")

    org_result = await db.execute(select(Organization).where(Organization.id == bot.org_id))
    org = org_result.scalar_one_or_none()
    if org and org.suspended_at is not None:
        raise HTTPException(status_code=403, detail="This service is currently unavailable.")

    await PlanService.check_conversation_limit(db, bot.org_id, bot.workspace_id)

    token, session_id = SessionService.create_session(bot.id, bot.workspace_id)
    return SessionCreateResponse(session_token=token, session_id=session_id)


@router.post("/chat")
async def chat(body: ChatRequest, request: Request, db: AsyncSession = Depends(get_db)):
    try:
        session = SessionService.validate_session(body.session_token)
    except AuthenticationError as e:
        raise HTTPException(status_code=401, detail=str(e))

    bot = await BotRepository.get_by_id(db, session.bot_id, session.workspace_id)
    if bot is None:
        raise HTTPException(status_code=404, detail="Bot not found")

    visitor_ip = request.headers.get("X-Forwarded-For", "")
    if request.client:
        visitor_ip = visitor_ip or request.client.host

    history = [{"role": m.role, "content": m.content} for m in body.history]

    # Extract domain from referer or origin
    referer = request.headers.get("referer", "") or request.headers.get("origin", "")

    async def event_stream():
        async for chunk in ChatService.handle_chat(
            db=db,
            bot=bot,
            session_id=session.session_id,
            query=body.message,
            history=history,
            visitor_domain=referer,
            visitor_ip=visitor_ip,
        ):
            yield chunk
        await db.commit()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/lead", status_code=201)
async def capture_lead(body: LeadCreateRequest, db: AsyncSession = Depends(get_db)):
    try:
        session = SessionService.validate_session(body.session_token)
    except AuthenticationError as e:
        raise HTTPException(status_code=401, detail=str(e))

    lead = Lead(
        id=generate_uuid(),
        workspace_id=session.workspace_id,
        bot_id=session.bot_id,
        name=body.name,
        email=body.email,
        phone=body.phone,
        message=body.message,
        page_url=body.page_url,
    )
    db.add(lead)
    await db.commit()
    return {"id": lead.id, "status": "created"}
