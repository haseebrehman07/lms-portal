import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
from jose import JWTError
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.models.user import User
from app.models.token_blacklist import TokenBlacklist
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from app.core.security import (
    hash_password,
    verify_password,
    verify_password_constant_time,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.core.deps import get_current_user
from app.services.email import send_password_reset_email

router = APIRouter(prefix="/auth", tags=["Authentication"])
limiter = Limiter(key_func=get_remote_address)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

MAX_FAILED_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(
    request: Request,
    payload: LoginRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == payload.email.lower().strip()
    ).first()

    if user and user.locked_until and user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Account temporarily locked. Try again later."
        )

    password_valid = verify_password_constant_time(
        payload.password,
        user.password_hash if user else None
    )

    if not user or not password_valid:
        if user:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= MAX_FAILED_LOGIN_ATTEMPTS:
                user.locked_until = datetime.now(timezone.utc) + timedelta(
                    minutes=LOCKOUT_MINUTES
                )
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        # Distinguish "you haven't activated your invite yet" from
        # "an admin actually deactivated you" - very different situations,
        # and telling a brand-new user to "contact your administrator"
        # is confusing and wrong.
        if user.password_reset_token:
            detail = "Please check your email to activate your account first."
        else:
            detail = "Account is deactivated. Contact your administrator."
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )

    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    token_data = {"sub": str(user.id), "role": user.role.value}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        must_change_password=user.must_change_password
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    payload: RefreshRequest,
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token"
    )
    try:
        decoded = decode_token(payload.refresh_token)
        if decoded.get("type") != "refresh":
            raise credentials_exception
        user_id: str = decoded.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    blacklisted = db.query(TokenBlacklist).filter(
        TokenBlacklist.token == payload.refresh_token
    ).first()
    if blacklisted:
        raise credentials_exception

    user = db.query(User).filter(
        User.id == user_id,
        User.is_active == True  # noqa
    ).first()
    if not user:
        raise credentials_exception

    token_iat = decoded.get("iat")
    if token_iat and user.password_changed_at:
        issued_at = datetime.fromtimestamp(token_iat, tz=timezone.utc)
        if issued_at < user.password_changed_at:
            raise credentials_exception

    token_data = {"sub": str(user.id), "role": user.role.value}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data)
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    payload: Optional[LogoutRequest] = None,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        access_payload = decode_token(token)
        exp = access_payload.get("exp")
        expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    already_blacklisted = db.query(TokenBlacklist).filter(
        TokenBlacklist.token == token
    ).first()
    if not already_blacklisted:
        db.add(TokenBlacklist(token=token, expires_at=expires_at))
        db.commit()

    if payload and payload.refresh_token:
        try:
            refresh_payload = decode_token(payload.refresh_token)
            refresh_exp = refresh_payload.get("exp")
            refresh_expires_at = datetime.fromtimestamp(
                refresh_exp, tz=timezone.utc
            )
            already = db.query(TokenBlacklist).filter(
                TokenBlacklist.token == payload.refresh_token
            ).first()
            if not already:
                db.add(TokenBlacklist(
                    token=payload.refresh_token,
                    expires_at=refresh_expires_at
                ))
                db.commit()
        except JWTError:
            pass

    return {"message": "Successfully logged out"}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == payload.email.lower().strip()
    ).first()

    if user:
        token = secrets.token_urlsafe(32)
        user.password_reset_token = token
        user.password_reset_expires = (
            datetime.now(timezone.utc) + timedelta(hours=1)
        )
        db.commit()
        background_tasks.add_task(
            send_password_reset_email,
            user.email,
            user.name,
            token
        )

    return {
        "message": "If that email exists you will receive a reset link shortly"
    }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
def reset_password(
    request: Request,
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.password_reset_token == payload.token
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    if not user.password_reset_expires or \
            user.password_reset_expires < datetime.now(timezone.utc):
        user.password_reset_token = None
        user.password_reset_expires = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )

    user.password_hash = hash_password(payload.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    user.is_active = True
    user.password_changed_at = datetime.now(timezone.utc)
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    return {"message": "Password reset successful"}


@router.post("/change-password", status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
def change_password(
    request: Request,
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    current_user.password_hash = hash_password(payload.new_password)
    current_user.must_change_password = False
    current_user.password_changed_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Password changed successfully"}