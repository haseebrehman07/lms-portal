from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
from jose import jwt
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Precomputed dummy hash used to keep login response timing constant
# whether or not the email exists - prevents timing-based user enumeration.
_DUMMY_HASH = pwd_context.hash("not-a-real-password-used-only-for-timing-safety")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def verify_password_constant_time(
    plain_password: str,
    hashed_password: Optional[str]
) -> bool:
    """
    Always performs a real bcrypt verification even when hashed_password
    is None. Falls back to a precomputed dummy hash so response time is
    identical whether the account exists or not. This prevents an attacker
    from discovering valid email addresses by measuring response speed.
    """
    return pwd_context.verify(plain_password, hashed_password or _DUMMY_HASH)


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (
        expires_delta
        if expires_delta
        else timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire, "iat": now, "type": "access"})
    return jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
    )


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "iat": now, "type": "refresh"})
    return jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
    )


def decode_token(token: str) -> dict:
    payload = jwt.decode(
        token,
        settings.secret_key,
        algorithms=[settings.algorithm]
    )
    return payload