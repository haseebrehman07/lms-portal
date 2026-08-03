from pydantic import BaseModel, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime, time, date
from app.models.course import CourseTypeEnum


class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    thumbnail_url: Optional[str] = None
    type: Optional[CourseTypeEnum] = None
    instructor_name: Optional[str] = None
    attendance_enabled: bool = False
    # Which weekday(s) this batch meets on. Defaults to a single day
    # (Saturday). Only add more than one day if this course genuinely
    # holds multiple classes per week - a Saturday batch and a Sunday
    # batch should be two separate courses, not [5, 6] on one course.
    session_days: List[int] = [5]
    attendance_cutoff_time: Optional[time] = None
    batch_start_date: Optional[date] = None
    total_sessions: Optional[int] = None

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

    @field_validator("total_sessions")
    @classmethod
    def positive_total_sessions(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise ValueError("total_sessions must be a positive number")
        return v


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
    batch_start_date: Optional[date] = None
    total_sessions: Optional[int] = None

    @field_validator("session_days")
    @classmethod
    def valid_weekdays(cls, v: Optional[List[int]]) -> Optional[List[int]]:
        if v is not None and any(day < 0 or day > 6 for day in v):
            raise ValueError("session_days must be between 0 (Monday) and 6 (Sunday)")
        return v

    @field_validator("total_sessions")
    @classmethod
    def positive_total_sessions(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise ValueError("total_sessions must be a positive number")
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
    batch_start_date: Optional[date]
    total_sessions: Optional[int]
    created_by: Optional[UUID]
    instructor_name: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}