from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime, time
from app.models.course import CourseTypeEnum


class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    thumbnail_url: Optional[str] = None
    type: Optional[CourseTypeEnum] = None
    instructor_name: Optional[str] = None
    attendance_enabled: bool = False
    session_days: List[int] = []
    attendance_cutoff_time: Optional[time] = None
    total_sessions: Optional[int] = None
    certificate_prefix: Optional[str] = None
    certificate_template_url: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()

    @field_validator("session_days")
    @classmethod
    def valid_weekdays(cls, v: List[int]) -> List[int]:
        if any(day < 0 or day > 6 for day in v):
            raise ValueError("session_days must be between 0 (Monday) and 6 (Sunday)")
        return v

    @model_validator(mode="after")
    def require_days_if_attendance_enabled(self):
        if self.attendance_enabled and not self.session_days:
            raise ValueError(
                "Select at least one session day when attendance tracking is enabled"
            )
        return self


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    thumbnail_url: Optional[str] = None
    type: Optional[CourseTypeEnum] = None
    instructor_name: Optional[str] = None
    attendance_enabled: Optional[bool] = None
    session_days: Optional[List[int]] = None
    attendance_cutoff_time: Optional[time] = None
    total_sessions: Optional[int] = None
    certificate_prefix: Optional[str] = None
    certificate_template_url: Optional[str] = None

    @field_validator("session_days")
    @classmethod
    def valid_weekdays(cls, v: Optional[List[int]]) -> Optional[List[int]]:
        if v is not None and any(day < 0 or day > 6 for day in v):
            raise ValueError("session_days must be between 0 (Monday) and 6 (Sunday)")
        return v


class CourseResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    category_id: Optional[UUID]
    thumbnail_url: Optional[str]
    type: Optional[CourseTypeEnum]
    total_lessons: int
    is_published: bool
    attendance_enabled: bool
    session_days: List[int]
    attendance_cutoff_time: Optional[time]
    total_sessions: Optional[int]
    certificate_prefix: Optional[str]
    certificate_template_url: Optional[str]
    created_by: Optional[UUID]
    instructor_name: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}