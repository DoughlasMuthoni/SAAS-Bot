import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.config import get_settings
from app.core.database import get_db
from app.core.exceptions import AuthenticationError
from app.core.security import hash_password
from app.models import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserMeResponse,
)
from app.services.auth_service import AuthService
from app.services.email_service import send_password_reset_email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    try:
        user = await AuthService.register(
            db,
            full_name=body.full_name,
            email=body.email,
            password=body.password,
            org_name=body.org_name,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    access_token, refresh_token = AuthService.create_tokens(user)
    settings = get_settings()

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/v1/auth",
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    try:
        user = await AuthService.authenticate(db, body.email, body.password)
    except AuthenticationError as e:
        raise HTTPException(status_code=401, detail=str(e))

    access_token, refresh_token = AuthService.create_tokens(user)
    settings = get_settings()

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/v1/auth",
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token", path="/api/v1/auth")
    return {"detail": "Logged out"}


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    try:
        access_token = await AuthService.refresh_access_token(db, refresh_token)
    except AuthenticationError as e:
        raise HTTPException(status_code=401, detail=str(e))

    settings = get_settings()
    return TokenResponse(access_token=access_token, expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    # Always return 200 — never reveal whether the email exists
    user = await UserRepository.get_by_email(db, body.email)
    if user and user.is_active:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=1)
        await UserRepository.set_reset_token(db, user.id, token, expires_at)
        settings = get_settings()
        reset_link = f"{settings.ADMIN_WEB_URL}/reset-password?token={token}"
        await send_password_reset_email(user.email, reset_link)
    return {"detail": "If that email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    user = await UserRepository.get_by_reset_token(db, body.token)
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")
    if user.reset_token_expires_at is None or datetime.utcnow() > user.reset_token_expires_at:
        raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")
    await UserRepository.update_password(db, user.id, hash_password(body.new_password))
    await UserRepository.clear_reset_token(db, user.id)
    return {"detail": "Password updated. You can now sign in with your new password."}


@router.get("/me", response_model=UserMeResponse)
async def me(user: User = Depends(get_current_active_user)):
    settings = get_settings()
    data = UserMeResponse.model_validate(user)
    data.is_superadmin = user.email.lower() in settings.superadmin_email_set
    return data


@router.put("/profile", response_model=UserMeResponse)
async def update_profile(
    body: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    from app.core.security import hash_password, verify_password
    from sqlalchemy import select

    # Password change requested — verify current password first
    if body.new_password:
        if not body.current_password:
            raise HTTPException(status_code=422, detail="Current password is required to set a new password")
        if not verify_password(body.current_password, user.hashed_password):
            raise HTTPException(status_code=422, detail="Current password is incorrect")

    # Email change — check uniqueness
    if body.email and body.email.lower() != user.email.lower():
        existing = await UserRepository.get_by_email(db, body.email.lower())
        if existing and existing.id != user.id:
            raise HTTPException(status_code=409, detail="That email address is already in use")
        user.email = body.email.lower()

    if body.full_name:
        user.full_name = body.full_name

    if body.new_password:
        user.hashed_password = hash_password(body.new_password)

    await db.commit()
    await db.refresh(user)

    settings = get_settings()
    data = UserMeResponse.model_validate(user)
    data.is_superadmin = user.email.lower() in settings.superadmin_email_set
    return data
