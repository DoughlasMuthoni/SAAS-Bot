import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.core.config import get_settings
from app.core.exceptions import AuthenticationError


@dataclass
class SessionData:
    bot_id: str
    workspace_id: str
    session_id: str


class SessionService:
    @staticmethod
    def create_session(bot_id: str, workspace_id: str) -> tuple[str, str]:
        settings = get_settings()
        session_id = str(uuid.uuid4())
        expire = datetime.now(timezone.utc) + timedelta(hours=24)
        token = jwt.encode(
            {
                "bot_id": bot_id,
                "workspace_id": workspace_id,
                "session_id": session_id,
                "exp": expire,
                "type": "widget_session",
            },
            settings.SESSION_SECRET,
            algorithm="HS256",
        )
        return token, session_id

    @staticmethod
    def validate_session(token: str) -> SessionData:
        settings = get_settings()
        try:
            payload = jwt.decode(token, settings.SESSION_SECRET, algorithms=["HS256"])
        except JWTError as e:
            raise AuthenticationError(f"Invalid session token: {e}")
        if payload.get("type") != "widget_session":
            raise AuthenticationError("Invalid session token type")
        return SessionData(
            bot_id=payload["bot_id"],
            workspace_id=payload["workspace_id"],
            session_id=payload["session_id"],
        )
