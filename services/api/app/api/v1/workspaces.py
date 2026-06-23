from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models import User, Workspace

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


class WorkspaceResponse(BaseModel):
    id: str
    org_id: str
    name: str
    slug: str

    model_config = {"from_attributes": True}


@router.get("", response_model=list[WorkspaceResponse])
async def list_workspaces(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Workspace)
        .where(Workspace.org_id == user.org_id, Workspace.deleted_at.is_(None))
        .order_by(Workspace.name)
    )
    return result.scalars().all()


@router.post("", response_model=WorkspaceResponse, status_code=201)
async def create_workspace(
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    from app.utils.ids import generate_uuid
    ws = Workspace(
        id=generate_uuid(),
        org_id=user.org_id,
        name=body["name"],
        slug=body.get("slug", body["name"].lower().replace(" ", "-")),
    )
    db.add(ws)
    await db.commit()
    await db.refresh(ws)
    return ws
