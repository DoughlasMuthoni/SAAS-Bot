from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    APP_ENV: str = "development"
    APP_URL: str = "http://localhost:8000"
    ADMIN_WEB_URL: str = "http://localhost:3000"
    WIDGET_WEB_URL: str = "http://localhost:3001"

    MYSQL_HOST: str = "127.0.0.1"
    MYSQL_PORT: int = 3306
    MYSQL_DATABASE: str = "chatbot_platform"
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = ""

    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL_MAIN: str = "claude-sonnet-4-6"
    ANTHROPIC_MODEL_ADVANCED: str = "claude-opus-4-7"
    ANTHROPIC_MODEL_FAST: str = "claude-haiku-4-5-20251001"
    VOYAGE_API_KEY: str = ""  # Voyage AI key; falls back to ANTHROPIC_API_KEY if blank

    JWT_SECRET: str = "dev-secret-change-in-production"
    SESSION_SECRET: str = "dev-session-secret-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_MB: int = 20

    RATE_LIMIT_PER_MINUTE: int = 30
    MAX_HISTORY_MESSAGES: int = 10
    MAX_TOKENS_PER_RESPONSE: int = 1024
    ALLOWED_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002"

    EMBEDDING_PROVIDER: str = "anthropic"
    VECTOR_BACKEND: str = "chroma"
    CHROMA_PERSIST_DIR: str = "./chroma_data"

    REDIS_URL: str = ""
    LOG_LEVEL: str = "INFO"

    # Comma-separated list of emails that have platform superadmin access
    # These users can manage plans and see all organisations.
    SUPERADMIN_EMAILS: str = ""

    @property
    def superadmin_email_set(self) -> set[str]:
        return {e.strip().lower() for e in self.SUPERADMIN_EMAILS.split(",") if e.strip()}
    WIDGET_BUNDLE_URL: str = "http://localhost:8000/static/widget.js"

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mysql+aiomysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"
        )

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
