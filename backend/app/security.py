from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
import pyotp

from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# Set auto_error=False to allow OPTIONS requests to pass through
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[dict[str, Any]] = None,
) -> str:
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode: dict[str, Any] = {"sub": subject, "exp": expire}
    if extra_claims:
        to_encode.update(extra_claims)
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        ) from e


async def get_current_admin(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme)
) -> dict[str, Any]:
    # Allow OPTIONS requests to pass through (handled by CORS middleware)
    if request.method == "OPTIONS":
        raise HTTPException(
            status_code=status.HTTP_200_OK,
            detail="OK"
        )
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_token(token)
    # In v1, we just trust the token and subject; later we can look up in DB
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
        )
    return {"email": sub}


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def verify_totp(token: str, secret: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(token, valid_window=1)



