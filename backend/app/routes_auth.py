from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from .config import settings
from .schemas import Token
from .security import create_access_token, hash_password, verify_password


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Token:
    # v1: single admin user from env; later, load from DB
    if form_data.username != settings.ADMIN_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if settings.ADMIN_PASSWORD_HASH:
        if not verify_password(form_data.password, settings.ADMIN_PASSWORD_HASH):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
    # TODO: add optional TOTP verification via extra field
    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        subject=settings.ADMIN_EMAIL, expires_delta=access_token_expires
    )
    return Token(access_token=token)


@router.get("/me")
async def me() -> dict:
    return {"email": settings.ADMIN_EMAIL}


