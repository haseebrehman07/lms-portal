import secrets
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

router = APIRouter(prefix="/users", tags=["Users"])


class AdminCreateUser(BaseModel):
    name: str
    email: EmailStr
    role: RoleEnum = RoleEnum.learner
    department: Optional[str] = None

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
async def create_user(
    payload: AdminCreateUser,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    existing = db.query(User).filter(
        User.email == payload.email.lower().strip()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    temp_password = secrets.token_urlsafe(12)

    user = User(
        name=payload.name,
        email=payload.email.lower().strip(),
        password_hash=hash_password(temp_password),
        role=payload.role,
        department=payload.department
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    try:
        from app.services.email import send_invite_email
        background_tasks.add_task(
            send_invite_email,
            user.email,
            user.name,
            temp_password
        )
    except Exception:
        pass

    return user


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