from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, contains_eager
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.models.enrollment import Enrollment, EnrollmentStatusEnum, LessonProgress
from app.models.lesson import Lesson
from app.models.course import Course
from app.models.user import User
from app.schemas.enrollment import (
    EnrollmentCreate,
    EnrollmentResponse,
    EnrollmentDetailResponse,
    BulkEnrollRequest,
    BulkEnrollResult
)
from app.core.deps import get_current_user, require_admin, require_manager_or_admin
from app.services.progress import mark_lesson_progress_complete, recalculate_progress

router = APIRouter(tags=["Enrollments"])


@router.post(
    "/lessons/{lesson_id}/incomplete",
    status_code=status.HTTP_200_OK
)
def incomplete_lesson(
    lesson_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == lesson.course_id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=400, detail="Not enrolled")

    progress = db.query(LessonProgress).filter(
        LessonProgress.enrollment_id == enrollment.id,
        LessonProgress.lesson_id == lesson_id
    ).first()

    if progress:
        db.delete(progress)
        db.commit()

    # Reuse the SAME recalculation logic used by mark_lesson_progress_complete,
    # instead of duplicating the math here - there's only one source of
    # truth for "how many lessons exist" and "how is percent computed",
    # used everywhere progress changes.
    recalculate_progress(enrollment.id, db)

    db.refresh(enrollment)
    return {
        "message": "Lesson marked as incomplete",
        "progress_percent": enrollment.progress_percent,
        "status": enrollment.status.value
    }


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


@router.get("/enrollments")
def get_all_enrollments(
    course_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """
    Admin enrollments listing - used by the Enrollments page. Returns
    real participant names and course titles (not raw IDs), plus an
    optional course_id filter for viewing one course's participant list.
    """
    query = (
        db.query(Enrollment)
        .join(User, Enrollment.user_id == User.id)
        .join(Course, Enrollment.course_id == Course.id)
        .options(
            contains_eager(Enrollment.user),
            contains_eager(Enrollment.course)
        )
    )

    if course_id:
        query = query.filter(Enrollment.course_id == course_id)

    enrollments = query.order_by(Enrollment.enrolled_at.desc()).all()

    return [
        {
            "id": str(e.id),
            "user_id": str(e.user_id),
            "user_name": e.user.name,
            "user_email": e.user.email,
            "course_id": str(e.course_id),
            "course_title": e.course.title,
            "status": e.status.value,
            "progress_percent": e.progress_percent,
            "enrolled_at": e.enrolled_at.isoformat(),
            "completed_at": e.completed_at.isoformat() if e.completed_at else None
        }
        for e in enrollments
    ]


@router.post(
    "/courses/{course_id}/enroll",
    response_model=BulkEnrollResult
)
def enroll_users_in_course(
    course_id: UUID,
    payload: BulkEnrollRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_manager_or_admin)
):
    """
    Admin/manager gives one or more existing users access to a course.
    Does not touch accounts or send any email - it only grants course
    access. Silently skips users who are invalid or already enrolled,
    reporting both back so the admin knows what actually happened.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    existing_user_ids = {
        u.id for u in db.query(User.id).filter(
            User.id.in_(payload.user_ids)
        ).all()
    }
    invalid_user_ids = [
        uid for uid in payload.user_ids if uid not in existing_user_ids
    ]

    already_enrolled_ids = {
        e.user_id for e in db.query(Enrollment.user_id).filter(
            Enrollment.course_id == course_id,
            Enrollment.user_id.in_(payload.user_ids)
        ).all()
    }

    to_enroll = [
        uid for uid in payload.user_ids
        if uid in existing_user_ids and uid not in already_enrolled_ids
    ]

    for uid in to_enroll:
        db.add(Enrollment(
            user_id=uid,
            course_id=course_id,
            status=EnrollmentStatusEnum.not_started,
            progress_percent=0.0
        ))
    db.commit()

    return BulkEnrollResult(
        enrolled=to_enroll,
        already_enrolled=list(already_enrolled_ids),
        invalid_user_ids=invalid_user_ids
    )


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


@router.delete(
    "/enrollments/{enrollment_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def remove_enrollment(
    enrollment_id: UUID,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """Admin removes a participant from a course."""
    enrollment = db.query(Enrollment).filter(
        Enrollment.id == enrollment_id
    ).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )
    db.delete(enrollment)
    db.commit()


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

    mark_lesson_progress_complete(enrollment.id, lesson_id, db)

    db.refresh(enrollment)
    return {
        "message": "Lesson marked as complete",
        "progress_percent": enrollment.progress_percent,
        "status": enrollment.status.value,
        # Note: with the new admin-controlled completion design, this
        # will now only ever be True if an admin already marked the
        # whole course completed before this lesson was touched -
        # finishing the last lesson yourself no longer flips this.
        "course_completed": enrollment.status == EnrollmentStatusEnum.completed
    }