import os
from pathlib import Path

from fastapi import UploadFile

from app.core.config import get_settings
from app.core.exceptions import ValidationError

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}


async def validate_upload(file: UploadFile) -> None:
    settings = get_settings()
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024

    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise ValidationError(f"File type not allowed: {content_type}")

    await file.seek(0)
    size = 0
    chunk = await file.read(8192)
    while chunk:
        size += len(chunk)
        if size > max_bytes:
            raise ValidationError(f"File exceeds {settings.MAX_UPLOAD_MB}MB limit")
        chunk = await file.read(8192)
    await file.seek(0)


async def save_upload(file: UploadFile, workspace_id: str) -> str:
    settings = get_settings()
    upload_dir = Path(settings.UPLOAD_DIR) / workspace_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    safe_name = Path(file.filename or "upload").name
    dest = upload_dir / f"{_uuid()}_{safe_name}"

    content = await file.read()
    dest.write_bytes(content)
    return str(dest.relative_to(settings.UPLOAD_DIR))


def get_upload_path(relative_path: str) -> Path:
    settings = get_settings()
    return (Path(settings.UPLOAD_DIR) / relative_path).resolve()


def _uuid() -> str:
    import uuid
    return str(uuid.uuid4())[:8]
