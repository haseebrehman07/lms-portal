from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
import csv
import io
from app.database import get_db
from app.models.enrollment import Enrollment, EnrollmentStatusEnum
from app.models.course import Course
from app.models.user import User
from app.core.deps import require_manager_or_admin

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/completions")
def get_completions_trend(
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    # group completed enrollments by month
    results = (
        db.query(
            extract("year", Enrollment.completed_at).label("year"),
            extract("month", Enrollment.completed_at).label("month"),
            func.count(Enrollment.id).label("count")
        )
        .filter(
            Enrollment.status == EnrollmentStatusEnum.completed,
            Enrollment.completed_at.isnot(None)
        )
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )

    months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ]

    return [
        {
            "month": months[int(r.month) - 1],
            "year": int(r.year),
            "completions": r.count
        }
        for r in results
    ]


@router.get("/by-department")
def get_completions_by_department(
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    results = (
        db.query(
            User.department,
            func.count(Enrollment.id).label("total"),
            func.sum(
                func.cast(
                    Enrollment.status == EnrollmentStatusEnum.completed,
                    db.bind.dialect.name == "postgresql"
                    and __import__("sqlalchemy").Integer
                    or __import__("sqlalchemy").Integer
                )
            ).label("completed")
        )
        .join(User, Enrollment.user_id == User.id)
        .group_by(User.department)
        .all()
    )

    total_completions = sum(r.total for r in results) or 1

    return [
        {
            "department": r.department or "Unassigned",
            "total": r.total,
            "percentage": round((r.total / total_completions) * 100, 1)
        }
        for r in results
    ]


@router.get("/course-performance")
def get_course_performance(
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    results = (
        db.query(
            Course.id,
            Course.title,
            func.count(Enrollment.id).label("enrolled"),
            func.sum(
                func.cast(
                    Enrollment.status == EnrollmentStatusEnum.completed,
                    __import__("sqlalchemy").Integer
                )
            ).label("completed"),
            func.sum(
                func.cast(
                    Enrollment.status == EnrollmentStatusEnum.in_progress,
                    __import__("sqlalchemy").Integer
                )
            ).label("in_progress"),
            func.sum(
                func.cast(
                    Enrollment.status == EnrollmentStatusEnum.not_started,
                    __import__("sqlalchemy").Integer
                )
            ).label("not_started"),
            func.avg(Enrollment.progress_percent).label("avg_progress")
        )
        .join(Enrollment, Course.id == Enrollment.course_id, isouter=True)
        .group_by(Course.id, Course.title)
        .all()
    )

    return [
        {
            "course_id": str(r.id),
            "title": r.title,
            "enrolled": r.enrolled or 0,
            "completed": int(r.completed or 0),
            "in_progress": int(r.in_progress or 0),
            "not_started": int(r.not_started or 0),
            "avg_progress": round(float(r.avg_progress or 0), 1)
        }
        for r in results
    ]


@router.get("/export")
def export_report_csv(
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    enrollments = (
        db.query(Enrollment)
        .join(User, Enrollment.user_id == User.id)
        .join(Course, Enrollment.course_id == Course.id)
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "User Name",
        "User Email",
        "Department",
        "Course Title",
        "Status",
        "Progress %",
        "Enrolled At",
        "Completed At"
    ])

    for e in enrollments:
        writer.writerow([
            e.user.name,
            e.user.email,
            e.user.department or "N/A",
            e.course.title,
            e.status.value,
            e.progress_percent,
            e.enrolled_at.strftime("%Y-%m-%d %H:%M"),
            e.completed_at.strftime("%Y-%m-%d %H:%M") if e.completed_at else "N/A"
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=lms_report_{datetime.utcnow().strftime('%Y%m%d')}.csv"
        }
    )