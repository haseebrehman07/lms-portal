from pydantic import BaseModel, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.enrollment import EnrollmentStatusEnum


class EnrollmentCreate(BaseModel):
    course_id: UUID


class LessonProgressResponse(BaseModel):
    id: UUID
    lesson_id: UUID
    is_completed: bool
    time_spent_seconds: int
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class EnrollmentResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    status: EnrollmentStatusEnum
    progress_percent: float
    enrolled_at: datetime
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class EnrollmentDetailResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    status: EnrollmentStatusEnum
    progress_percent: float
    enrolled_at: datetime
    completed_at: Optional[datetime]
    lesson_progress: List[LessonProgressResponse] = []

    model_config = {"from_attributes": True}


class BulkEnrollRequest(BaseModel):
    user_ids: List[UUID]

    @field_validator("user_ids")
    @classmethod
    def must_have_users(cls, v: List[UUID]) -> List[UUID]:
        if not v:
            raise ValueError("Provide at least one user_id")
        return v


class BulkEnrollResult(BaseModel):
    enrolled: List[UUID]
    already_enrolled: List[UUID]
    invalid_user_ids: List[UUID]