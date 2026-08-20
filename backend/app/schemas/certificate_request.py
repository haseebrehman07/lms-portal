from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.certificate_request import CertificateRequestStatusEnum


class CertificateRequestCreate(BaseModel):
    course_id: UUID


class CertificateRequestResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    enrollment_id: UUID
    status: CertificateRequestStatusEnum
    admin_note: Optional[str]
    requested_at: datetime
    actioned_at: Optional[datetime]

    model_config = {"from_attributes": True}


class CertificateRequestDetail(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    enrollment_id: UUID
    status: CertificateRequestStatusEnum
    admin_note: Optional[str]
    requested_at: datetime
    actioned_at: Optional[datetime]
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    course_title: Optional[str] = None

    model_config = {"from_attributes": True}


class AdminCertificateAction(BaseModel):
    admin_note: Optional[str] = None