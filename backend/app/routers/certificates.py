from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timezone
from pydantic import BaseModel

from app.database import get_db
from app.models.certificate import Certificate
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.schemas.certificate import CertificateResponse
from app.core.deps import get_current_user, require_admin
from app.services.certificate_pdf import generate_certificate_pdf

router = APIRouter(prefix="/certificates", tags=["Certificates"])


class AdminIssueCertificate(BaseModel):
    user_id: UUID
    course_id: UUID


def _to_response(cert: Certificate) -> dict:
    return {
        "id": cert.id,
        "user_id": cert.user_id,
        "course_id": cert.course_id,
        "course_title": cert.course.title if cert.course else None,
        "certificate_url": cert.certificate_url,
        "issued_at": cert.issued_at
    }


@router.get("/me", response_model=List[CertificateResponse])
def get_my_certificates(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    certs = db.query(Certificate).filter(
        Certificate.user_id == current_user.id
    ).order_by(Certificate.issued_at.desc()).all()
    return [_to_response(c) for c in certs]


@router.get("/admin/all", response_model=List[CertificateResponse])
def list_all_certificates(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """Admin oversight view - every certificate issued platform-wide."""
    certs = db.query(Certificate).order_by(Certificate.issued_at.desc()).all()
    return [_to_response(c) for c in certs]


@router.post(
    "/admin/issue",
    response_model=CertificateResponse,
    status_code=status.HTTP_201_CREATED
)
def admin_issue_certificate(
    payload: AdminIssueCertificate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """
    Admin manually issues a certificate - for exceptions (e.g. training
    completed outside the platform, manual override). Does not require
    100% progress, but does require the person to actually be enrolled
    in the course - can't certify someone for a course they never took.
    """
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == payload.user_id,
        Enrollment.course_id == payload.course_id
    ).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not enrolled in this course"
        )

    existing = db.query(Certificate).filter(
        Certificate.user_id == payload.user_id,
        Certificate.course_id == payload.course_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A certificate already exists for this user and course"
        )

    certificate = Certificate(
        user_id=payload.user_id,
        course_id=payload.course_id
    )
    db.add(certificate)
    db.flush()

    certificate.certificate_url = generate_certificate_pdf(
        learner_name=user.name,
        course_title=course.title,
        issued_at=certificate.issued_at or datetime.now(timezone.utc),
        certificate_id=certificate.id,
        user_id=user.id,
        course_id=course.id
    )
    db.commit()
    db.refresh(certificate)

    return _to_response(certificate)


@router.delete(
    "/admin/{certificate_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def admin_revoke_certificate(
    certificate_id: UUID,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """Admin revokes/deletes a certificate (e.g. issued in error)."""
    certificate = db.query(Certificate).filter(
        Certificate.id == certificate_id
    ).first()
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )
    db.delete(certificate)
    db.commit()


@router.get("/{certificate_id}", response_model=CertificateResponse)
def get_certificate(
    certificate_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    certificate = db.query(Certificate).filter(
        Certificate.id == certificate_id,
        Certificate.user_id == current_user.id
    ).first()
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )
    return _to_response(certificate)