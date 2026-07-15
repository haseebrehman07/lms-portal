from datetime import datetime, timezone
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.user import User, RoleEnum
from app.core.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")

        if user_id is None:
            raise credentials_exception
        if token_type != "access":
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(
        User.id == user_id,
        User.is_active == True  # noqa
    ).first()

    if user is None:
        raise credentials_exception

    # If the password was changed after this token was issued, the token
    # is stale - reject it even though it hasn't technically expired yet.
    # This is what makes "reset password" actually kill old sessions.
    token_iat = payload.get("iat")
    if token_iat and user.password_changed_at:
        issued_at = datetime.fromtimestamp(token_iat, tz=timezone.utc)
        if issued_at < user.password_changed_at:
            raise credentials_exception

    return user


def get_optional_user(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Like get_current_user, but returns None instead of raising when no
    valid token is present. Used on public endpoints (e.g. course listing)
    that behave differently for admins vs. anonymous/regular visitors,
    without forcing a login just to browse.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        return None

    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        return None

    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id or payload.get("type") != "access":
            return None
    except JWTError:
        return None

    return db.query(User).filter(
        User.id == user_id,
        User.is_active == True  # noqa
    ).first()


def require_admin(
    user: User = Depends(get_current_user)
) -> User:
    if user.role != RoleEnum.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user


def require_manager_or_admin(
    user: User = Depends(get_current_user)
) -> User:
    if user.role not in [RoleEnum.admin, RoleEnum.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager or admin access required"
        )
    return user