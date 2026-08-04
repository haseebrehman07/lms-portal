import csv
import io
from datetime import date, datetime, time, timedelta, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, contains_eager
from sqlalchemy import func, or_

from app.database import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.user import User
from app.models.Attendence import Attendance, AttendanceModeEnum
from app.models.class_cancellation import ClassCancellation
from app.schemas.Attendence import (
    AttendanceMarkRequest,
    AttendanceUpdate,
    AttendanceResponse,
    AttendanceDetailResponse,
    AttendanceSummary
)
from app.schemas.class_cancellation import (
    ClassCancellationCreate,
    ClassCancellationResponse
)
from app.core.deps import get_current_user, require_admin

router = APIRouter(prefix="/attendance", tags=["Attendance"])

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday",
             "Friday", "Saturday", "Sunday"]


def _next_session_date(session_days: List[int], from_date: date) -> Optional[date]:
    """Finds the next upcoming date (starting today) that falls on one
    of the course's scheduled session_days."""
    if not session_days:
        return None
    for offset in range(0, 15):
        candidate = from_date + timedelta(days=offset)
        if candidate.weekday() in session_days:
            return candidate
    return None


def _is_cancelled(db: Session, course_id: UUID, on_date: date) -> bool:
    """Whether admin has cancelled the class for this specific date
    (e.g. holiday), regardless of the normal weekly session_days."""
    return db.query(ClassCancellation).filter(
        ClassCancellation.course_id == course_id,
        ClassCancellation.date == on_date
    ).first() is not None


def _sessions_occurred(
    db: Session,
    course,
    up_to: date
) -> int:
    """
    How many scheduled session-days have occurred for this course's
    batch, from its batch_start_date up to (and including) `up_to`,
    excluding any dates admin has cancelled. Used against
    course.total_sessions to know when a batch's classes are finished.
    """
    if not course.session_days:
        return 0

    start = course.batch_start_date or course.created_at.date()
    if start > up_to:
        return 0

    cancelled_dates = {
        c[0] for c in db.query(ClassCancellation.date).filter(
            ClassCancellation.course_id == course.id,
            ClassCancellation.date >= start,
            ClassCancellation.date <= up_to
        ).all()
    }

    count = 0
    d = start
    while d <= up_to:
        if d.weekday() in course.session_days and d not in cancelled_dates:
            count += 1
        d += timedelta(days=1)
    return count


def _batch_completed(db: Session, course, on_date: date) -> bool:
    """
    True once the batch already had course.total_sessions classes
    strictly BEFORE on_date - meaning on_date's own class (if any)
    is not itself blocked, only sessions after the cap is reached.
    """
    if not course.total_sessions:
        return False
    sessions_before_today = _sessions_occurred(
        db, course, on_date - timedelta(days=1)
    )
    return sessions_before_today >= course.total_sessions


@router.post(
    "/mark",
    response_model=AttendanceResponse,
    status_code=status.HTTP_201_CREATED
)
def mark_attendance(
    payload: AttendanceMarkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == payload.course_id
    ).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not enrolled in this course"
        )

    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course or not course.attendance_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance tracking is not enabled for this course"
        )

    now = datetime.now(timezone.utc)
    today = now.date()

    if course.session_days:
        if today.weekday() not in course.session_days:
            scheduled = ", ".join(
                DAY_NAMES[d] for d in sorted(course.session_days)
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"No session scheduled today for this course. "
                    f"Sessions are held on: {scheduled}"
                )
            )

    if _is_cancelled(db, course.id, today):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Today's class has been cancelled for this course."
        )

    if _batch_completed(db, course, today):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"This batch's {course.total_sessions} scheduled classes "
                f"are already complete. Attendance marking is closed."
            )
        )

    if course.attendance_cutoff_time:
        if now.time() > course.attendance_cutoff_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"The attendance window for today closed at "
                    f"{course.attendance_cutoff_time.strftime('%I:%M %p')}"
                )
            )

    existing = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.course_id == payload.course_id,
        Attendance.date == today
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You've already marked attendance for this course today"
        )

    record = Attendance(
        user_id=current_user.id,
        course_id=payload.course_id,
        date=today,
        mode=payload.mode
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/me/today-status")
def get_today_status(
    course_id: UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Everything the frontend's 'today' card needs in one call: is today
    a session day, has the learner already marked, what mode, when
    does the window close, and (if not a session day) when's next.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    now = datetime.now(timezone.utc)
    today = now.date()
    is_regular_session_day = (
        not course.session_days or today.weekday() in course.session_days
    )
    is_cancelled = _is_cancelled(db, course_id, today)
    batch_completed = _batch_completed(db, course, today)
    is_session_day = is_regular_session_day and not is_cancelled and not batch_completed

    existing = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.course_id == course_id,
        Attendance.date == today
    ).first()

    window_closed = False
    if course.attendance_cutoff_time and now.time() > course.attendance_cutoff_time:
        window_closed = True

    # FIX: Safely calculate the NEXT class strictly starting from tomorrow.
    # Unconditional calculation ensures it ignores whether today is a class day or not.
    next_session_date_iso = None
    if not batch_completed and course.session_days:
        next_date = _next_session_date(course.session_days, today + timedelta(days=1))
        if next_date:
            next_session_date_iso = next_date.isoformat()

    # Safely unpack marked_at to avoid NoneType errors
    marked_mode = None
    marked_at_iso = None
    if existing:
        marked_mode = existing.mode.value if hasattr(existing.mode, "value") else existing.mode
        if getattr(existing, "marked_at", None):
            marked_at_iso = existing.marked_at.isoformat()

    return {
        "date": today.isoformat(),
        "day_name": DAY_NAMES[today.weekday()],
        "is_session_day": is_session_day,
        "is_cancelled": is_cancelled,
        "batch_completed": batch_completed,
        "total_sessions": course.total_sessions,
        "already_marked": existing is not None,
        "marked_mode": marked_mode,
        "marked_at": marked_at_iso,
        "attendance_cutoff_time": (
            course.attendance_cutoff_time.isoformat()
            if course.attendance_cutoff_time else None
        ),
        "window_closed": window_closed,
        "next_session_date": next_session_date_iso
    }


@router.get("/me/summary")
def get_my_attendance_summary(
    course_id: UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Attendance %, classes attended, classes missed, total classes so
    far - counted from the learner's enrollment date up to today,
    based on the course's scheduled session_days.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not enrolled in this course"
        )

    today = datetime.now(timezone.utc).date()
    start_date = max(
        enrollment.enrolled_at.date(),
        course.batch_start_date or enrollment.enrolled_at.date()
    )

    cancelled_dates = {
        c[0] for c in db.query(ClassCancellation.date).filter(
            ClassCancellation.course_id == course_id,
            ClassCancellation.date >= start_date,
            ClassCancellation.date <= today
        ).all()
    }

    total_classes = 0
    if course.session_days:
        d = start_date
        while d <= today:
            if d.weekday() in course.session_days and d not in cancelled_dates:
                total_classes += 1
            d += timedelta(days=1)

    # A batch total_sessions cap is course-wide (counted from
    # batch_start_date), so it may be lower than what enrollment-since
    # counting above produces - respect whichever is the real ceiling.
    if course.total_sessions is not None:
        total_classes = min(total_classes, course.total_sessions)

    classes_attended = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.course_id == course_id
    ).count()

    classes_missed = max(total_classes - classes_attended, 0)
    attendance_percent = (
        round((classes_attended / total_classes) * 100, 1)
        if total_classes > 0 else 0
    )

    return {
        "attendance_percent": attendance_percent,
        "classes_attended": classes_attended,
        "classes_missed": classes_missed,
        "total_classes": total_classes
    }


@router.get(
    "/me",
    response_model=List[AttendanceResponse]
)
def get_my_attendance(
    course_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Attendance).filter(
        Attendance.user_id == current_user.id
    )
    if course_id:
        query = query.filter(Attendance.course_id == course_id)
    return query.order_by(Attendance.date.desc()).all()


@router.get("")
def get_all_attendance(
    course_id: Optional[UUID] = Query(None),
    attendance_date: Optional[date] = Query(None, alias="date"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    mode: Optional[AttendanceModeEnum] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """
    Admin attendance table - filterable by course, date/date range,
    mode, and student name/email search. Paginated with a total count
    so the frontend can render 'Showing X to Y of Z records'.
    """
    query = (
        db.query(Attendance)
        .join(User, Attendance.user_id == User.id)
        .join(Course, Attendance.course_id == Course.id)
        .options(
            contains_eager(Attendance.user),
            contains_eager(Attendance.course)
        )
    )

    if course_id:
        query = query.filter(Attendance.course_id == course_id)
    if attendance_date:
        query = query.filter(Attendance.date == attendance_date)
    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)
    if mode:
        query = query.filter(Attendance.mode == mode)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(User.name.ilike(term), User.email.ilike(term))
        )

    total = query.count()
    records = (
        query.order_by(Attendance.date.desc())
        .offset(skip).limit(limit).all()
    )

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [
            AttendanceDetailResponse(
                id=r.id,
                user_id=r.user_id,
                course_id=r.course_id,
                date=r.date,
                mode=r.mode,
                marked_at=r.marked_at,
                user_name=r.user.name if r.user else None,
                user_email=r.user.email if r.user else None,
                course_title=r.course.title if r.course else None
            )
            for r in records
        ]
    }


@router.get("/export")
def export_attendance_csv(
    course_id: Optional[UUID] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    mode: Optional[AttendanceModeEnum] = Query(None),
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """CSV export of attendance records, respecting the same filters as the table."""
    query = (
        db.query(Attendance)
        .join(User, Attendance.user_id == User.id)
        .join(Course, Attendance.course_id == Course.id)
        .options(
            contains_eager(Attendance.user),
            contains_eager(Attendance.course)
        )
    )

    if course_id:
        query = query.filter(Attendance.course_id == course_id)
    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)
    if mode:
        query = query.filter(Attendance.mode == mode)

    records = query.order_by(Attendance.date.desc()).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Student Name", "Email", "Course", "Date", "Day", "Mode", "Time Marked"])
    for r in records:
        writer.writerow([
            r.user.name if r.user else "",
            r.user.email if r.user else "",
            r.course.title if r.course else "",
            r.date.isoformat(),
            DAY_NAMES[r.date.weekday()],
            r.mode.value,
            r.marked_at.strftime("%I:%M %p") if getattr(r, "marked_at", None) else ""
        ])

    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=attendance_export_{date.today()}.csv"
        }
    )


@router.patch(
    "/{attendance_id}",
    response_model=AttendanceResponse
)
def update_attendance(
    attendance_id: UUID,
    payload: AttendanceUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    record = db.query(Attendance).filter(
        Attendance.id == attendance_id
    ).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found"
        )

    update_data = payload.model_dump(exclude_unset=True)

    if "date" in update_data:
        duplicate = db.query(Attendance).filter(
            Attendance.user_id == record.user_id,
            Attendance.course_id == record.course_id,
            Attendance.date == update_data["date"],
            Attendance.id != attendance_id
        ).first()
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This learner already has an attendance record for that date"
            )

    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record


@router.delete(
    "/{attendance_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_attendance(
    attendance_id: UUID,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    record = db.query(Attendance).filter(
        Attendance.id == attendance_id
    ).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found"
        )
    db.delete(record)
    db.commit()


@router.post(
    "/course/{course_id}/cancel-date",
    response_model=ClassCancellationResponse,
    status_code=status.HTTP_201_CREATED
)
def cancel_class_date(
    course_id: UUID,
    payload: ClassCancellationCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """
    Cancels the class for one specific date (holiday, instructor
    unavailable, etc.) without touching the course's weekly
    session_days schedule.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    existing = db.query(ClassCancellation).filter(
        ClassCancellation.course_id == course_id,
        ClassCancellation.date == payload.date
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This date is already marked as cancelled for this course"
        )

    record = ClassCancellation(
        course_id=course_id,
        date=payload.date,
        reason=payload.reason,
        created_by=admin.id
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get(
    "/course/{course_id}/cancelled-dates",
    response_model=List[ClassCancellationResponse]
)
def list_cancelled_dates(
    course_id: UUID,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    return db.query(ClassCancellation).filter(
        ClassCancellation.course_id == course_id
    ).order_by(ClassCancellation.date.desc()).all()


@router.delete(
    "/course/{course_id}/cancel-date/{cancellation_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def uncancel_class_date(
    course_id: UUID,
    cancellation_id: UUID,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """Un-cancels a previously cancelled date, restoring it as a normal session day."""
    record = db.query(ClassCancellation).filter(
        ClassCancellation.id == cancellation_id,
        ClassCancellation.course_id == course_id
    ).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cancellation record not found"
        )
    db.delete(record)
    db.commit()


@router.get(
    "/course/{course_id}/summary",
    response_model=List[AttendanceSummary]
)
def get_course_attendance_summary(
    course_id: UUID,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    counts = (
        db.query(
            Attendance.user_id,
            Attendance.mode,
            func.count(Attendance.id).label("count")
        )
        .filter(Attendance.course_id == course_id)
        .group_by(Attendance.user_id, Attendance.mode)
        .all()
    )

    names = {
        u.id: u.name
        for u in db.query(User.id, User.name).join(
            Attendance, Attendance.user_id == User.id
        ).filter(Attendance.course_id == course_id).distinct()
    }

    per_user = {}
    for user_id, mode, count in counts:
        entry = per_user.setdefault(user_id, {"onsite": 0, "online": 0})
        entry[mode.value] = count

    return [
        AttendanceSummary(
            user_id=user_id,
            user_name=names.get(user_id, "Unknown"),
            total_sessions_marked=data["onsite"] + data["online"],
            onsite_count=data["onsite"],
            online_count=data["online"]
        )
        for user_id, data in per_user.items()
    ]