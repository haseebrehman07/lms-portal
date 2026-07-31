from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment, EnrollmentStatusEnum
from app.models.certificate import Certificate
from app.models.certificate_request import (
    CertificateRequest,
    CertificateRequestStatusEnum
)
from app.schemas.certificate_request import (
    AdminCertificateAction,
    CertificateRequestCreate,
    CertificateRequestDetail,
    CertificateRequestResponse
)
from app.core.deps import get_current_user, require_admin
from app.services.certificate_pdf import generate_certificate_pdf

router = APIRouter(prefix="/certificate-requests", tags=["Certificate Requests"])


@router.post(
    "",
    response_model=CertificateRequestResponse,
    status_code=status.HTTP_201_CREATED
)
def request_certificate(
    payload: CertificateRequestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == payload.course_id
    ).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not enrolled in this course"
        )

    if enrollment.progress_percent < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must complete all lessons before requesting a certificate"
        )

    if enrollment.status == EnrollmentStatusEnum.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This course is already marked completed"
        )

    existing_request = db.query(CertificateRequest).filter(
        CertificateRequest.user_id == current_user.id,
        CertificateRequest.course_id == payload.course_id,
        CertificateRequest.status == CertificateRequestStatusEnum.pending
    ).first()
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending certificate request for this course"
        )

    cert_request = CertificateRequest(
        user_id=current_user.id,
        course_id=payload.course_id,
        enrollment_id=enrollment.id
    )
    db.add(cert_request)
    db.commit()
    db.refresh(cert_request)
    return cert_request


@router.get(
    "/me",
    response_model=List[CertificateRequestResponse]
)
def get_my_certificate_requests(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(CertificateRequest).filter(
        CertificateRequest.user_id == current_user.id
    ).order_by(CertificateRequest.requested_at.desc()).all()


@router.get(
    "",
    response_model=List[CertificateRequestDetail]
)
def get_all_certificate_requests(
    request_status: Optional[CertificateRequestStatusEnum] = Query(None),
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    query = db.query(CertificateRequest)
    if request_status:
        query = query.filter(CertificateRequest.status == request_status)

    requests = query.order_by(
        CertificateRequest.requested_at.desc()
    ).all()

    return [
        CertificateRequestDetail(
            id=r.id,
            user_id=r.user_id,
            course_id=r.course_id,
            enrollment_id=r.enrollment_id,
            status=r.status,
            admin_note=r.admin_note,
            requested_at=r.requested_at,
            actioned_at=r.actioned_at,
            user_name=r.user.name if r.user else None,
            user_email=r.user.email if r.user else None,
            course_title=r.course.title if r.course else None
        )
        for r in requests
    ]


@router.patch(
    "/{request_id}/approve",
    response_model=CertificateRequestDetail
)
def approve_certificate_request(
    request_id: UUID,
    payload: AdminCertificateAction,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    req = db.query(CertificateRequest).filter(
        CertificateRequest.id == request_id
    ).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    if req.status != CertificateRequestStatusEnum.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Request is already {req.status.value}"
        )

    enrollment = db.query(Enrollment).filter(
        Enrollment.id == req.enrollment_id
    ).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Underlying enrollment no longer exists"
        )

    now = datetime.now(timezone.utc)
    course = db.query(Course).filter(Course.id == req.course_id).first()

    # Mark the enrollment completed - this is the ONLY place completion
    # + certificate issuance happens now (per-learner, admin-approved).
    enrollment.status = EnrollmentStatusEnum.completed
    enrollment.completed_at = now

    existing_cert = db.query(Certificate).filter(
        Certificate.user_id == req.user_id,
        Certificate.course_id == req.course_id
    ).first()

    if not existing_cert:
        certificate = Certificate(
            user_id=req.user_id,
            course_id=req.course_id
        )
        db.add(certificate)
        db.flush()  # get certificate.id before generating the PDF

        certificate.certificate_url = generate_certificate_pdf(
            learner_name=req.user.name,
            course_title=course.title if course else "",
            issued_at=certificate.issued_at or now,
            certificate_id=certificate.id,
            user_id=req.user_id,
            course_id=req.course_id
        )

    req.status = CertificateRequestStatusEnum.approved
    req.admin_note = payload.admin_note
    req.actioned_at = now
    req.actioned_by = admin.id

    db.commit()
    db.refresh(req)

    return CertificateRequestDetail(
        id=req.id,
        user_id=req.user_id,
        course_id=req.course_id,
        enrollment_id=req.enrollment_id,
        status=req.status,
        admin_note=req.admin_note,
        requested_at=req.requested_at,
        actioned_at=req.actioned_at,
        user_name=req.user.name if req.user else None,
        user_email=req.user.email if req.user else None,
        course_title=req.course.title if req.course else None
    )


@router.patch(
    "/{request_id}/reject",
    response_model=CertificateRequestDetail
)
def reject_certificate_request(
    request_id: UUID,
    payload: AdminCertificateAction,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    req = db.query(CertificateRequest).filter(
        CertificateRequest.id == request_id
    ).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    if req.status != CertificateRequestStatusEnum.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Request is already {req.status.value}"
        )

    req.status = CertificateRequestStatusEnum.rejected
    req.admin_note = payload.admin_note
    req.actioned_at = datetime.now(timezone.utc)
    req.actioned_by = admin.id
    db.commit()
    db.refresh(req)

    return CertificateRequestDetail(
        id=req.id,
        user_id=req.user_id,
        course_id=req.course_id,
        enrollment_id=req.enrollment_id,
        status=req.status,
        admin_note=req.admin_note,
        requested_at=req.requested_at,
        actioned_at=req.actioned_at,
        user_name=req.user.name if req.user else None,
        user_email=req.user.email if req.user else None,
        course_title=req.course.title if req.course else None
    )


@router.get("/pending/count")
def get_pending_certificate_count(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    count = db.query(CertificateRequest).filter(
        CertificateRequest.status == CertificateRequestStatusEnum.pending
    ).count()
    return {"pending_count": count}