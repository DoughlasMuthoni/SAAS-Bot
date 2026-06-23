import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return jwt.encode({**data, "exp": expire, "type": "access"}, settings.JWT_SECRET, algorithm="HS256")


def create_refresh_token(data: dict[str, Any]) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode({**data, "exp": expire, "type": "refresh"}, settings.JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}") from e


def generate_api_key() -> tuple[str, str, str]:
    """Returns (raw_key, prefix, hashed_key)."""
    raw = secrets.token_urlsafe(32)
    prefix = raw[:8]
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, prefix, hashed


def generate_public_key() -> str:
    return secrets.token_urlsafe(24)
