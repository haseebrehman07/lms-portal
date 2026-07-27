import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.course import Course
from app.models.enrollment import Enrollment, EnrollmentStatusEnum
from app.schemas.user import UserListResponse, AdminUserUpdate, UserUpdate
from app.schemas.enrollment import EnrollmentResponse
from app.core.deps import require_admin, get_current_user
from app.core.security import hash_password
from app.services.email import send_invite_email

router = APIRouter(prefix="/users", tags=["Users"])


class AdminCreateUser(BaseModel):
    name: str
    email: EmailStr
    role: RoleEnum = RoleEnum.learner
    department: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class AdminEnrollUser(BaseModel):
    course_id: UUID


@router.get("", response_model=List[UserListResponse])
def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    query = db.query(User)
    if search:
        query = query.filter(
            or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
        )
    return query.order_by(
        User.created_at.desc()
    ).offset(skip).limit(limit).all()


@router.get("/me", response_model=UserListResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.patch("/me", response_model=UserListResponse)
def update_my_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post(
    "",
    response_model=UserListResponse,
    status_code=status.HTTP_201_CREATED
)
def create_user(
    payload: AdminCreateUser,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """
    Admin creates a new account. No usable password is set here - the
    user receives an invite email with a real, database-backed token and
    sets their own password. The account stays inactive until they do.

    If the email belongs to a user who never activated (is_active=False,
    still holding an unused invite token), we treat this as "resend the
    invite" instead of blocking with a duplicate-email error - this is
    the common case of an admin re-clicking "Add User" for someone whose
    first invite email never arrived or expired.
    """
    email = payload.email.lower().strip()
    existing = db.query(User).filter(User.email == email).first()

    if existing:
        if existing.is_active:
            # Real duplicate: an active account already owns this email.
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Inactive account with this email = an unclaimed invite.
        # Refresh it and resend, rather than blocking the admin.
        invite_token = secrets.token_urlsafe(32)
        existing.name = payload.name
        existing.role = payload.role
        existing.department = payload.department
        existing.phone = payload.phone
        existing.password_reset_token = invite_token
        existing.password_reset_expires = (
            datetime.now(timezone.utc) + timedelta(days=7)
        )
        db.commit()
        db.refresh(existing)

        background_tasks.add_task(
            send_invite_email, existing.email, existing.name, invite_token
        )
        return existing

    invite_token = secrets.token_urlsafe(32)

    user = User(
        name=payload.name,
        email=email,
        # Unusable placeholder - real password is set via the invite link.
        # is_active=False blocks login until then regardless.
        password_hash=hash_password(secrets.token_urlsafe(32)),
        role=payload.role,
        department=payload.department,
        phone=payload.phone,
        is_active=False,
        password_reset_token=invite_token,
        password_reset_expires=datetime.now(timezone.utc) + timedelta(days=7)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    background_tasks.add_task(
        send_invite_email, user.email, user.name, invite_token
    )

    return user


@router.post("/{user_id}/resend-invite", status_code=status.HTTP_200_OK)
def resend_invite(
    user_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """Admin fallback: re-send a fresh invite to a user who never activated."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has already activated their account"
        )

    invite_token = secrets.token_urlsafe(32)
    user.password_reset_token = invite_token
    user.password_reset_expires = datetime.now(timezone.utc) + timedelta(days=7)
    db.commit()

    background_tasks.add_task(
        send_invite_email, user.email, user.name, invite_token
    )
    return {"message": "Invite resent"}


@router.post("/{user_id}/enroll", response_model=EnrollmentResponse)
def admin_enroll_user(
    user_id: UUID,
    payload: AdminEnrollUser,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    existing = db.query(Enrollment).filter(
        Enrollment.user_id == user_id,
        Enrollment.course_id == payload.course_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already enrolled in this course"
        )

    enrollment = Enrollment(
        user_id=user_id,
        course_id=payload.course_id,
        status=EnrollmentStatusEnum.not_started,
        progress_percent=0.0
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.get("/{user_id}/enrollments")
def get_user_enrollments(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    enrollments = db.query(Enrollment).filter(
        Enrollment.user_id == user_id
    ).all()

    return [
        {
            "enrollment_id": str(e.id),
            "course_id": str(e.course_id),
            "course_title": e.course.title,
            "status": e.status.value,
            "progress_percent": e.progress_percent,
            "enrolled_at": e.enrolled_at.isoformat()
        }
        for e in enrollments
    ]


@router.patch("/{user_id}", response_model=UserListResponse)
def update_user(
    user_id: UUID,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    update_data = payload.model_dump(exclude_unset=True)

    if (
        str(user.id) == str(admin.id)
        and "role" in update_data
        and update_data["role"] != RoleEnum.admin
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own admin role"
        )

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def deactivate_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    if str(user.id) == str(admin.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account"
        )
    user.is_active = False
    db.commit()