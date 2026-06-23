from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class InviteMemberRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    role: Literal["admin", "editor", "viewer"] = "editor"
    password: str = Field(..., min_length=6, max_length=128)


class UpdateRoleRequest(BaseModel):
    role: Literal["admin", "editor", "viewer"]


class TeamMemberResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    last_login_at: str | None
    created_at: str

    model_config = {"from_attributes": True}
