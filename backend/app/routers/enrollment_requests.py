from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment, EnrollmentStatusEnum
from app.models.enrollment_request import (
    EnrollmentRequest,
    EnrollmentRequestStatusEnum
)
from app.schemas.enrollment_request import (
    AdminActionRequest,
    EnrollmentRequestCreate,
    EnrollmentRequestDetail,
    EnrollmentRequestResponse
)
from app.core.deps import get_current_user, require_admin

router = APIRouter(prefix="/enrollment-requests", tags=["Enrollment Requests"])


@router.post(
    "",
    response_model=EnrollmentRequestResponse,
    status_code=status.HTTP_201_CREATED
)
def request_enrollment(
    payload: EnrollmentRequestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
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

    # check if already enrolled
    already_enrolled = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == payload.course_id
    ).first()
    if already_enrolled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already enrolled in this course"
        )

    # check if pending request already exists
    existing_request = db.query(EnrollmentRequest).filter(
        EnrollmentRequest.user_id == current_user.id,
        EnrollmentRequest.course_id == payload.course_id,
        EnrollmentRequest.status == EnrollmentRequestStatusEnum.pending
    ).first()
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending request for this course"
        )

    request = EnrollmentRequest(
        user_id=current_user.id,
        course_id=payload.course_id,
        message=payload.message
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


@router.get(
    "/me",
    response_model=List[EnrollmentRequestResponse]
)
def get_my_requests(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(EnrollmentRequest).filter(
        EnrollmentRequest.user_id == current_user.id
    ).order_by(EnrollmentRequest.requested_at.desc()).all()


@router.get(
    "",
    response_model=List[EnrollmentRequestDetail]
)
def get_all_requests(
    request_status: Optional[EnrollmentRequestStatusEnum] = Query(None),
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    query = db.query(EnrollmentRequest)
    if request_status:
        query = query.filter(
            EnrollmentRequest.status == request_status
        )

    requests = query.order_by(
        EnrollmentRequest.requested_at.desc()
    ).all()

    result = []
    for r in requests:
        result.append(EnrollmentRequestDetail(
            id=r.id,
            user_id=r.user_id,
            course_id=r.course_id,
            status=r.status,
            message=r.message,
            admin_note=r.admin_note,
            requested_at=r.requested_at,
            actioned_at=r.actioned_at,
            user_name=r.user.name if r.user else None,
            user_email=r.user.email if r.user else None,
            course_title=r.course.title if r.course else None
        ))
    return result


@router.patch(
    "/{request_id}/approve",
    response_model=EnrollmentRequestDetail
)
def approve_request(
    request_id: UUID,
    payload: AdminActionRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    req = db.query(EnrollmentRequest).filter(
        EnrollmentRequest.id == request_id
    ).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    if req.status != EnrollmentRequestStatusEnum.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Request is already {req.status.value}"
        )

    # create the enrollment
    existing = db.query(Enrollment).filter(
        Enrollment.user_id == req.user_id,
        Enrollment.course_id == req.course_id
    ).first()
    if not existing:
        enrollment = Enrollment(
            user_id=req.user_id,
            course_id=req.course_id,
            status=EnrollmentStatusEnum.not_started,
            progress_percent=0.0
        )
        db.add(enrollment)

    # update request status
    req.status = EnrollmentRequestStatusEnum.approved
    req.admin_note = payload.admin_note
    req.actioned_at = datetime.now(timezone.utc)
    req.actioned_by = admin.id
    db.commit()
    db.refresh(req)

    # send email notification
    try:
        from app.services.email import send_email
        import asyncio
        asyncio.create_task(send_email(
            to=req.user.email,
            subject="Your enrollment request has been approved",
            body=f"""
            <div style="font-family: Arial, sans-serif;">
                <h2 style="color: #1e3a5f;">Enrollment Approved</h2>
                <p>Hi {req.user.name},</p>
                <p>Your request to enroll in <strong>{req.course.title}</strong>
                has been approved.</p>
                <p>You can now access the course from your dashboard.</p>
                {f'<p><strong>Note from admin:</strong> {req.admin_note}</p>'
                 if req.admin_note else ''}
            </div>
            """
        ))
    except Exception:
        pass

    return EnrollmentRequestDetail(
        id=req.id,
        user_id=req.user_id,
        course_id=req.course_id,
        status=req.status,
        message=req.message,
        admin_note=req.admin_note,
        requested_at=req.requested_at,
        actioned_at=req.actioned_at,
        user_name=req.user.name if req.user else None,
        user_email=req.user.email if req.user else None,
        course_title=req.course.title if req.course else None
    )


@router.patch(
    "/{request_id}/reject",
    response_model=EnrollmentRequestDetail
)
def reject_request(
    request_id: UUID,
    payload: AdminActionRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    req = db.query(EnrollmentRequest).filter(
        EnrollmentRequest.id == request_id
    ).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    if req.status != EnrollmentRequestStatusEnum.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Request is already {req.status.value}"
        )

    req.status = EnrollmentRequestStatusEnum.rejected
    req.admin_note = payload.admin_note
    req.actioned_at = datetime.now(timezone.utc)
    req.actioned_by = admin.id
    db.commit()
    db.refresh(req)

    # send email notification
    try:
        from app.services.email import send_email
        import asyncio
        asyncio.create_task(send_email(
            to=req.user.email,
            subject="Update on your enrollment request",
            body=f"""
            <div style="font-family: Arial, sans-serif;">
                <h2 style="color: #1e3a5f;">Enrollment Request Update</h2>
                <p>Hi {req.user.name},</p>
                <p>Your request to enroll in <strong>{req.course.title}</strong>
                was not approved at this time.</p>
                {f'<p><strong>Reason:</strong> {req.admin_note}</p>'
                 if req.admin_note else ''}
                <p>Please contact your administrator for more information.</p>
            </div>
            """
        ))
    except Exception:
        pass

    return EnrollmentRequestDetail(
        id=req.id,
        user_id=req.user_id,
        course_id=req.course_id,
        status=req.status,
        message=req.message,
        admin_note=req.admin_note,
        requested_at=req.requested_at,
        actioned_at=req.actioned_at,
        user_name=req.user.name if req.user else None,
        user_email=req.user.email if req.user else None,
        course_title=req.course.title if req.course else None
    )


@router.get(
    "/pending/count"
)
def get_pending_count(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    count = db.query(EnrollmentRequest).filter(
        EnrollmentRequest.status == EnrollmentRequestStatusEnum.pending
    ).count()
    return {"pending_count": count}