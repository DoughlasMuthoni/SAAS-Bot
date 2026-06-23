from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, require_role
from app.core.database import get_db
from app.core.security import hash_password
from app.models import User
from app.repositories.user_repository import UserRepository
from app.schemas.team import InviteMemberRequest, TeamMemberResponse, UpdateRoleRequest
from app.services.plan_service import PlanService

router = APIRouter(prefix="/team", tags=["team"])

_viewer  = Depends(get_current_active_user)
_manager = Depends(require_role("owner", "admin"))


def _to_response(u: User) -> TeamMemberResponse:
    return TeamMemberResponse(
        id=u.id,
        email=u.email,
        full_name=u.full_name,
        role=u.role,
        is_active=u.is_active,
        last_login_at=u.last_login_at.isoformat() if u.last_login_at else None,
        created_at=u.created_at.isoformat(),
    )


@router.get("", response_model=list[TeamMemberResponse])
async def list_team(
    db: AsyncSession = Depends(get_db),
    user: User = _viewer,
):
    members = await UserRepository.list_by_org(db, user.org_id)
    return [_to_response(m) for m in members]


@router.post("/invite", response_model=TeamMemberResponse, status_code=201)
async def invite_member(
    body: InviteMemberRequest,
    db: AsyncSession = Depends(get_db),
    user: User = _manager,
):
    await PlanService.check_team_member_limit(db, user.org_id)

    existing = await UserRepository.get_by_email(db, body.email)
    if existing:
        raise HTTPException(status_code=409, detail="A user with this email already exists.")

    new_user = await UserRepository.create(
        db,
        org_id=user.org_id,
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        role=body.role,
    )
    return _to_response(new_user)


@router.put("/{member_id}/role", response_model=TeamMemberResponse)
async def update_member_role(
    member_id: str,
    body: UpdateRoleRequest,
    db: AsyncSession = Depends(get_db),
    user: User = _manager,
):
    member = await UserRepository.get_by_id(db, member_id)
    if member is None or member.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Member not found.")
    if member.role == "owner":
        raise HTTPException(status_code=403, detail="Cannot change the owner's role.")
    if member.id == user.id:
        raise HTTPException(status_code=403, detail="Cannot change your own role.")
    # Only owner can promote to admin
    if body.role == "admin" and user.role != "owner":
        raise HTTPException(status_code=403, detail="Only the owner can assign the admin role.")

    await UserRepository.update_role(db, member_id, body.role)
    updated = await UserRepository.get_by_id(db, member_id)
    return _to_response(updated)


@router.delete("/{member_id}", status_code=204)
async def remove_member(
    member_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = _manager,
):
    member = await UserRepository.get_by_id(db, member_id)
    if member is None or member.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Member not found.")
    if member.role == "owner":
        raise HTTPException(status_code=403, detail="Cannot remove the owner.")
    if member.id == user.id:
        raise HTTPException(status_code=403, detail="Cannot remove yourself.")

    await UserRepository.soft_delete(db, member_id)
