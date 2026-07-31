from datetime import date, datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, contains_eager
from sqlalchemy import func

from app.database import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.user import User
from app.models.Attendence import Attendance, AttendanceModeEnum
from app.schemas.Attendence import (
    AttendanceMarkRequest,
    AttendanceUpdate,
    AttendanceResponse,
    AttendanceDetailResponse,
    AttendanceSummary
)
from app.core.deps import get_current_user, require_admin

router = APIRouter(prefix="/attendance", tags=["Attendance"])


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
    """
    Learner marks their own attendance for today, for a course they're
    enrolled in. One mark per learner per course per day - trying again
    the same day just returns a clear error instead of a duplicate row.
    """
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

    today = datetime.now(timezone.utc).date()

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


@router.get(
    "/me",
    response_model=List[AttendanceResponse]
)
def get_my_attendance(
    course_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Learner's own attendance history, optionally filtered to one course."""
    query = db.query(Attendance).filter(
        Attendance.user_id == current_user.id
    )
    if course_id:
        query = query.filter(Attendance.course_id == course_id)

    return query.order_by(Attendance.date.desc()).all()


@router.get(
    "/me/today",
    response_model=Optional[AttendanceResponse]
)
def get_my_attendance_today(
    course_id: UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lets the frontend check 'have I already marked attendance today?'
    so it can show the marked state / disable the button instead of
    the learner finding out only after a failed attempt.
    """
    today = datetime.now(timezone.utc).date()
    return db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.course_id == course_id,
        Attendance.date == today
    ).first()


@router.get(
    "",
    response_model=List[AttendanceDetailResponse]
)
def get_all_attendance(
    course_id: Optional[UUID] = Query(None),
    attendance_date: Optional[date] = Query(None, alias="date"),
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """Admin view of attendance records, filterable by course and/or date."""
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

    records = query.order_by(Attendance.date.desc()).all()

    return [
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
    """
    Admin corrects a mistaken attendance record - e.g. a learner
    accidentally marked 'Onsite' when they meant 'Online', or picked
    the wrong day. Learners cannot edit their own records.
    """
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
    """
    Admin removes a mistaken attendance record entirely - e.g. a
    learner accidentally marked present on a day they were actually
    absent. Learners cannot delete their own records.
    """
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


@router.get(
    "/course/{course_id}/summary",
    response_model=List[AttendanceSummary]
)
def get_course_attendance_summary(
    course_id: UUID,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """
    Per-learner attendance totals for one course - how many days each
    enrolled learner has attended, broken down by onsite vs online.
    """
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
        entry = per_user.setdefault(
            user_id, {"onsite": 0, "online": 0}
        )
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