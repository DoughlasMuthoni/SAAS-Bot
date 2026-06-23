from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import AuthenticationError, ForbiddenError, NotFoundError
from app.core.security import decode_token
from app.models import Bot, User

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        payload = decode_token(credentials.credentials)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    from app.repositories.user_repository import UserRepository
    user = await UserRepository.get_by_id(db, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


async def get_current_active_user(user: User = Depends(get_current_user)) -> User:
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")
    return user


def require_role(*roles: str):
    async def _check(user: User = Depends(get_current_active_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return _check


async def require_superadmin(user: User = Depends(get_current_active_user)) -> User:
    from app.core.config import get_settings
    settings = get_settings()
    if user.email.lower() not in settings.superadmin_email_set:
        raise HTTPException(status_code=403, detail="Platform superadmin access required")
    return user


async def get_bot_or_404(
    bot_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
) -> Bot:
    from app.repositories.bot_repository import BotRepository
    bot = await BotRepository.get_by_id(db, bot_id, user.org_id)
    if bot is None:
        raise HTTPException(status_code=404, detail="Bot not found")
    return bot
