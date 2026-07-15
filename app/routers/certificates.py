from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.certificate import Certificate
from app.schemas.certificate import CertificateResponse
from app.core.deps import get_current_user, require_admin

router = APIRouter(prefix="/certificates", tags=["Certificates"])


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


@router.get("/admin/all", response_model=List[CertificateResponse])
def list_all_certificates(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """Admin oversight view - see every certificate issued across the platform."""
    certs = db.query(Certificate).order_by(Certificate.issued_at.desc()).all()
    return [_to_response(c) for c in certs]