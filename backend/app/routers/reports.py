import calendar
import csv
import io
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, case
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment, EnrollmentStatusEnum
from app.models.user import User
from app.core.deps import require_manager_or_admin

router = APIRouter(prefix="/reports", tags=["Reports"])


def _resolve_period_start(period: str, now: datetime) -> datetime:
    if period == "current_month":
        return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if period == "last_month":
        first_of_this_month = now.replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        return (first_of_this_month - timedelta(days=1)).replace(day=1)
    if period == "last_3_months":
        return now - timedelta(days=90)
    if period == "last_6_months":
        return now - timedelta(days=180)
    if period == "this_year":
        return now.replace(
            month=1, day=1, hour=0, minute=0, second=0, microsecond=0
        )
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


@router.get("/summary")
def get_report_summary(
    period: str = Query("current_month"),
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    now = datetime.now(timezone.utc)
    start_date = _resolve_period_start(period, now)

    total_enrollments = db.query(Enrollment).filter(
        Enrollment.enrolled_at >= start_date
    ).count()

    completed = db.query(Enrollment).filter(
        Enrollment.status == EnrollmentStatusEnum.completed,
        Enrollment.completed_at >= start_date
    ).count()

    in_progress = db.query(Enrollment).filter(
        Enrollment.status == EnrollmentStatusEnum.in_progress,
        Enrollment.enrolled_at >= start_date
    ).count()

    avg_progress = db.query(
        func.avg(Enrollment.progress_percent)
    ).filter(
        Enrollment.enrolled_at >= start_date
    ).scalar() or 0

    active_users = db.query(
        func.count(func.distinct(Enrollment.user_id))
    ).filter(
        Enrollment.enrolled_at >= start_date
    ).scalar() or 0

    return {
        "period": period,
        "start_date": start_date.isoformat(),
        "total_enrollments": total_enrollments,
        "completed": completed,
        "in_progress": in_progress,
        "completion_rate": round(
            (completed / total_enrollments * 100)
            if total_enrollments > 0 else 0, 1
        ),
        "avg_progress": round(float(avg_progress), 1),
        "active_users": active_users
    }


@router.get("/completions")
def get_monthly_completions(
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    current_year = datetime.now(timezone.utc).year

    completed_enrollments = db.query(Enrollment.completed_at).filter(
        Enrollment.status == EnrollmentStatusEnum.completed,
        Enrollment.completed_at.isnot(None)
    ).all()

    monthly_counts = {month: 0 for month in range(1, 13)}
    for (completed_date,) in completed_enrollments:
        if completed_date.year == current_year:
            monthly_counts[completed_date.month] += 1

    return [
        {"name": calendar.month_abbr[month], "current": count}
        for month, count in monthly_counts.items()
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
                case(
                    (Enrollment.status == EnrollmentStatusEnum.completed, 1),
                    else_=0
                )
            ).label("completed"),
            func.sum(
                case(
                    (Enrollment.status == EnrollmentStatusEnum.in_progress, 1),
                    else_=0
                )
            ).label("in_progress"),
            func.sum(
                case(
                    (Enrollment.status == EnrollmentStatusEnum.not_started, 1),
                    else_=0
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
def export_csv(
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
            e.course.title,
            e.status.value,
            e.progress_percent,
            e.enrolled_at.strftime("%Y-%m-%d %H:%M") if e.enrolled_at else "N/A",
            e.completed_at.strftime("%Y-%m-%d %H:%M") if e.completed_at else "N/A"
        ])

    output.seek(0)
    filename = f"lms_report_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/pdf")
def export_pdf(
    period: str = Query("current_month"),
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.platypus import (
            SimpleDocTemplate, Table, TableStyle,
            Paragraph, Spacer
        )
        from reportlab.lib.styles import getSampleStyleSheet
    except ImportError:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=500,
            detail="PDF export not available. Install reportlab."
        )

    now = datetime.now(timezone.utc)
    start_date = _resolve_period_start(period, now)

    results = (
        db.query(
            Course.title,
            func.count(Enrollment.id).label("enrolled"),
            func.sum(
                case(
                    (Enrollment.status == EnrollmentStatusEnum.completed, 1),
                    else_=0
                )
            ).label("completed"),
            func.avg(Enrollment.progress_percent).label("avg_progress")
        )
        .join(
            Enrollment,
            (Course.id == Enrollment.course_id)
            & (Enrollment.enrolled_at >= start_date),
            isouter=True
        )
        .group_by(Course.id, Course.title)
        .all()
    )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("HR LMS Performance Report", styles['Title']))
    elements.append(
        Paragraph(f"Period: {period.replace('_', ' ').title()}", styles['Normal'])
    )
    elements.append(
        Paragraph(
            f"Generated: {now.strftime('%Y-%m-%d %H:%M UTC')}",
            styles['Normal']
        )
    )
    elements.append(Spacer(1, 20))

    data = [["Course", "Enrolled", "Completed", "Avg Progress"]]
    for r in results:
        data.append([
            r.title,
            str(r.enrolled or 0),
            str(int(r.completed or 0)),
            f"{round(float(r.avg_progress or 0), 1)}%"
        ])

    if len(data) == 1:
        data.append(["No data for this period", "", "", ""])

    table = Table(data, colWidths=[250, 80, 80, 100])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a5f')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
    ]))

    elements.append(table)
    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=lms_report_{period}.pdf"
        }
    )