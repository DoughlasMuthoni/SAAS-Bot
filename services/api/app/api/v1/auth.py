from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.config import get_settings
from app.core.database import get_db
from app.core.exceptions import AuthenticationError
from app.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserMeResponse
from app.services.auth_service import AuthService

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


@router.get("/me", response_model=UserMeResponse)
async def me(user: User = Depends(get_current_active_user)):
    settings = get_settings()
    data = UserMeResponse.model_validate(user)
    data.is_superadmin = user.email.lower() in settings.superadmin_email_set
    return data
