from datetime import datetime, timedelta, timezone
import io

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, case
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment, EnrollmentStatusEnum
from app.core.deps import require_manager_or_admin

router = APIRouter(prefix="/reports", tags=["Reports"])


def _resolve_period_start(period: str, now: datetime) -> datetime:
    """Shared period -> start_date logic, used by both the PDF export
    and the summary endpoint so they always agree on the same date range."""
    if period == "current_month":
        return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if period == "last_month":
        first_of_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return (first_of_this_month - timedelta(days=1)).replace(day=1)
    if period == "last_3_months":
        return now - timedelta(days=90)
    if period == "last_6_months":
        return now - timedelta(days=180)
    if period == "this_year":
        return now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    # default / unrecognized period falls back to current_month
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


@router.get("/export/pdf")
def export_report_pdf(
    period: str = Query("current_month"),
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    now = datetime.now(timezone.utc)
    start_date = _resolve_period_start(period, now)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("HR LMS Performance Report", styles['Title']))
    elements.append(Paragraph(f"Period: {period}", styles['Normal']))
    elements.append(Spacer(1, 20))

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

    data = [["Course", "Enrolled", "Completed", "Avg Progress"]]
    for r in results:
        data.append([
            r.title,
            str(r.enrolled or 0),
            str(int(r.completed or 0)),
            f"{round(float(r.avg_progress or 0), 1)}%"
        ])

    table = Table(data, colWidths=[250, 80, 80, 100])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a5f')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('PADDING', (0, 0), (-1, -1), 8),
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
            (completed / total_enrollments * 100) if total_enrollments > 0 else 0, 1
        ),
        "avg_progress": round(float(avg_progress), 1),
        "active_users": active_users
    }