from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PlatformPageResponse(BaseModel):
    slug: str
    title: str
    content: str
    updated_by: Optional[str] = None
    updated_at: datetime

    model_config = {"from_attributes": True}


class PlatformPageUpdate(BaseModel):
    title: str
    content: str
