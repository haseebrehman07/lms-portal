from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.models.certificate import Certificate
from typing import List
from uuid import UUID
from datetime import datetime
from app.database import get_db
from app.models.enrollment import Enrollment, LessonProgress, EnrollmentStatusEnum
from app.models.lesson import Lesson
from app.models.course import Course
from app.models.user import User
from app.schemas.enrollment import (
    EnrollmentCreate,
    EnrollmentResponse,
    EnrollmentDetailResponse
)
from app.core.deps import get_current_user, require_admin

router = APIRouter(tags=["Enrollments"])




def recalculate_progress(enrollment_id: UUID, db: Session):
    enrollment = db.query(Enrollment).filter(
        Enrollment.id == enrollment_id
    ).first()
    if not enrollment:
        return

    total_lessons = db.query(Lesson).filter(
        Lesson.course_id == enrollment.course_id
    ).count()

    if total_lessons == 0:
        return

    completed_lessons = db.query(LessonProgress).filter(
        LessonProgress.enrollment_id == enrollment_id,
        LessonProgress.is_completed == True  # noqa
    ).count()

    progress = (completed_lessons / total_lessons) * 100
    enrollment.progress_percent = round(progress, 1)

    if completed_lessons == total_lessons:
        enrollment.status = EnrollmentStatusEnum.completed
        enrollment.completed_at = datetime.utcnow()

        # auto generate certificate if not already issued
        existing_cert = db.query(Certificate).filter(
            Certificate.user_id == enrollment.user_id,
            Certificate.course_id == enrollment.course_id
        ).first()

        if not existing_cert:
            certificate = Certificate(
                user_id=enrollment.user_id,
                course_id=enrollment.course_id
            )
            db.add(certificate)

    elif completed_lessons > 0:
        enrollment.status = EnrollmentStatusEnum.in_progress
    else:
        enrollment.status = EnrollmentStatusEnum.not_started

    db.commit()

@router.post(
    "/enrollments",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED
)
def enroll_in_course(
    payload: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(
        Course.id == payload.course_id,
        Course.is_published == True  # noqa
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or not published"
        )

    existing = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == payload.course_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already enrolled in this course"
        )

    enrollment = Enrollment(
        user_id=current_user.id,
        course_id=payload.course_id,
        status=EnrollmentStatusEnum.not_started,
        progress_percent=0.0
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.get(
    "/enrollments/me",
    response_model=List[EnrollmentResponse]
)
def get_my_enrollments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id
    ).order_by(Enrollment.enrolled_at.desc()).all()


@router.get(
    "/enrollments",
    response_model=List[EnrollmentResponse]
)
def get_all_enrollments(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    return db.query(Enrollment).order_by(
        Enrollment.enrolled_at.desc()
    ).all()


@router.get(
    "/enrollments/{enrollment_id}",
    response_model=EnrollmentDetailResponse
)
def get_enrollment_detail(
    enrollment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    enrollment = db.query(Enrollment).filter(
        Enrollment.id == enrollment_id
    ).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )
    if str(enrollment.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your enrollment"
        )
    return enrollment


@router.post(
    "/lessons/{lesson_id}/complete",
    status_code=status.HTTP_200_OK
)
def complete_lesson(
    lesson_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )

    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == lesson.course_id
    ).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not enrolled in this course"
        )

    # idempotent - if already completed do not duplicate
    progress = db.query(LessonProgress).filter(
        LessonProgress.enrollment_id == enrollment.id,
        LessonProgress.lesson_id == lesson_id
    ).first()

    if not progress:
        progress = LessonProgress(
            enrollment_id=enrollment.id,
            lesson_id=lesson_id
        )
        db.add(progress)

    if not progress.is_completed:
        progress.is_completed = True
        progress.completed_at = datetime.utcnow()
        db.commit()
        recalculate_progress(enrollment.id, db)

    db.refresh(enrollment)
    return {
        "message": "Lesson marked as complete",
        "progress_percent": enrollment.progress_percent,
        "status": enrollment.status.value,
        "course_completed": enrollment.status == EnrollmentStatusEnum.completed
    }