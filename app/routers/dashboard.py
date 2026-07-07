from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment, EnrollmentStatusEnum
from app.core.deps import require_manager_or_admin

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    total_users = db.query(User).filter(
        User.is_active == True  # noqa
    ).count()

    month_start = datetime.utcnow().replace(
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

    completion_percent = (
        round((completed / total_enrollments) * 100, 1)
        if total_enrollments > 0 else 0
    )

    return {
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
        }
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
            "enrolled_at": e.enrolled_at.isoformat()
        }
        for e in enrollments
    ]


@router.get("/top-courses")
def get_top_courses(
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    results = (
        db.query(
            Course.id,
            Course.title,
            func.count(Enrollment.id).label("enrolled_count"),
            func.avg(Enrollment.progress_percent).label("avg_progress")
        )
        .join(Enrollment, Course.id == Enrollment.course_id, isouter=True)
        .group_by(Course.id, Course.title)
        .order_by(desc("avg_progress"))
        .limit(5)
        .all()
    )

    return [
        {
            "course_id": str(r.id),
            "title": r.title,
            "enrolled_count": r.enrolled_count or 0,
            "avg_progress": round(float(r.avg_progress or 0), 1)
        }
        for r in results
    ]


@router.get("/upcoming-trainings")
def get_upcoming_trainings(
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    courses = (
        db.query(Course)
        .filter(Course.is_published == True)  # noqa
        .order_by(desc(Course.created_at))
        .limit(5)
        .all()
    )

    return [
        {
            "course_id": str(c.id),
            "title": c.title,
            "type": c.type.value if c.type else None,
            "total_lessons": c.total_lessons
        }
        for c in courses
    ]