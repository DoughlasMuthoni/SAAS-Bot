from pydantic import BaseModel, EmailStr, field_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    org_name: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("full_name", "org_name")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("This field cannot be blank")
        return v.strip()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserMeResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    org_id: str
    is_active: bool
    is_superadmin: bool = False

    model_config = {"from_attributes": True}
