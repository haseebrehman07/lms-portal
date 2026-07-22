from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.enrollment_request import EnrollmentRequestStatusEnum


class EnrollmentRequestCreate(BaseModel):
    course_id: UUID
    message: Optional[str] = None


class EnrollmentRequestResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    status: EnrollmentRequestStatusEnum
    message: Optional[str]
    admin_note: Optional[str]
    requested_at: datetime
    actioned_at: Optional[datetime]

    model_config = {"from_attributes": True}


class EnrollmentRequestDetail(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    status: EnrollmentRequestStatusEnum
    message: Optional[str]
    admin_note: Optional[str]
    requested_at: datetime
    actioned_at: Optional[datetime]
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    course_title: Optional[str] = None

    model_config = {"from_attributes": True}


class AdminActionRequest(BaseModel):
    admin_note: Optional[str] = None