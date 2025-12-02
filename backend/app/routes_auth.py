from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from .config import settings
from .schemas import Token
from .security import create_access_token


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Token:
    """
    Minimal admin auth for v1.

    NOTE: Per project requirements, this uses a fixed username/password pair
    loaded from environment variables, without hashing. Do NOT use this
    pattern in production systems.
    """
    expected_username = settings.ADMIN_USERNAME
    expected_password = settings.ADMIN_PASSWORD

    if form_data.username != expected_username or form_data.password != expected_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        subject=expected_username, expires_delta=access_token_expires
    )
    return Token(access_token=token)


@router.get("/me")
async def me() -> dict:
    # Keep response minimal; subject is the username we used when creating the token
    return {"username": settings.ADMIN_USERNAME}


