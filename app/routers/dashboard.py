from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, contains_eager
from sqlalchemy import func, desc
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment, EnrollmentStatusEnum, LessonProgress
from app.models.certificate import Certificate
from app.core.deps import require_manager_or_admin, get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    total_users = db.query(User).filter(
        User.is_active == True  # noqa
    ).count()

    month_start = datetime.now(timezone.utc).replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )
    new_users_this_month = db.query(User).filter(
        User.created_at >= month_start
    ).count()

    total_courses = db.query(Course).count()
    published_courses = db.query(Course).filter(
        Course.is_published == True  # noqa
    ).count()

    total_enrollments = db.query(Enrollment).count()

    completed = db.query(Enrollment).filter(
        Enrollment.status == EnrollmentStatusEnum.completed
    ).count()

    in_progress = db.query(Enrollment).filter(
        Enrollment.status == EnrollmentStatusEnum.in_progress
    ).count()

    not_started = db.query(Enrollment).filter(
        Enrollment.status == EnrollmentStatusEnum.not_started
    ).count()

    certificates_issued = db.query(Certificate).count()

    completion_percent = (
        round((completed / total_enrollments) * 100, 1)
        if total_enrollments > 0 else 0
    )

    return {
        # original field names - kept for any other existing consumer
        "total_users": total_users,
        "new_users_this_month": new_users_this_month,
        "total_courses": total_courses,
        "published_courses": published_courses,
        "enrolled_users": total_enrollments,
        "completed_courses": completed,
        "training_progress": {
            "completed": completed,
            "completed_percent": completion_percent,
            "in_progress": in_progress,
            "in_progress_percent": round(
                (in_progress / total_enrollments) * 100, 1
            ) if total_enrollments > 0 else 0,
            "not_started": not_started,
            "not_started_percent": round(
                (not_started / total_enrollments) * 100, 1
            ) if total_enrollments > 0 else 0,
        },
        # fields the admin dashboard cards (CourseAllocationTab.jsx) expect
        "total_students": total_users,
        "total_enrollments": total_enrollments,
        "certificates_issued": certificates_issued
    }


@router.get("/recent-enrollments")
def get_recent_enrollments(
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    enrollments = (
        db.query(Enrollment)
        .join(User, Enrollment.user_id == User.id)
        .join(Course, Enrollment.course_id == Course.id)
        .options(
            contains_eager(Enrollment.user),
            contains_eager(Enrollment.course)
        )
        .order_by(desc(Enrollment.enrolled_at))
        .limit(5)
        .all()
    )

    return [
        {
            "id": str(e.id),
            "user_name": e.user.name,
            "user_email": e.user.email,
            "course_title": e.course.title,
            "status": e.status.value,
            "progress_percent": e.progress_percent,
            "enrolled_at": e.enrolled_at.isoformat(),
            # fields CourseAllocationTab.jsx expects
            "student_name": e.user.name,
            "course_name": e.course.title,
            "date": e.enrolled_at.isoformat()
        }
        for e in enrollments
    ]


@router.get("/top-courses")
def get_top_courses(
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    # "Top" = most enrolled. Previously ordered by avg_progress, which let
    # courses with 0 enrollments (NULL/0 avg) outrank real, popular courses.
    # Also drop courses with no enrollments at all - they aren't "top"
    # anything and were cluttering the list with test/empty courses.
    results = (
        db.query(
            Course.id,
            Course.title,
            func.count(Enrollment.id).label("enrolled_count"),
            func.avg(Enrollment.progress_percent).label("avg_progress")
        )
        .join(Enrollment, Course.id == Enrollment.course_id, isouter=True)
        .group_by(Course.id, Course.title)
        .having(func.count(Enrollment.id) > 0)
        .order_by(desc("enrolled_count"))
        .limit(5)
        .all()
    )

    return [
        {
            "course_id": str(r.id),
            "title": r.title,
            "enrolled_count": r.enrolled_count or 0,
            "avg_progress": round(float(r.avg_progress or 0), 1),
            # fields CourseAllocationTab.jsx expects
            "id": str(r.id),
            "enrollments": r.enrolled_count or 0
        }
        for r in results
    ]


@router.get("/learning-hours")
def get_learning_hours(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = db.query(
        func.sum(LessonProgress.time_spent_seconds)
    ).join(
        Enrollment,
        LessonProgress.enrollment_id == Enrollment.id
    ).filter(
        Enrollment.user_id == current_user.id
    ).scalar()

    total_seconds = result or 0
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60

    return {
        "total_seconds": total_seconds,
        "hours": hours,
        "minutes": minutes,
        "formatted": f"{hours}h {minutes}m"
    }