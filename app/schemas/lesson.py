from pydantic import BaseModel, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class LessonCreate(BaseModel):
    title: str
    order_index: int = 0
    video_url: Optional[str] = None
    duration_seconds: int = 0
    content: Optional[str] = None
    materials_url: Optional[List[str]] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()

    @field_validator("duration_seconds")
    @classmethod
    def duration_positive(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Duration cannot be negative")
        return v


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    order_index: Optional[int] = None
    video_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    content: Optional[str] = None
    materials_url: Optional[List[str]] = None


class LessonResponse(BaseModel):
    id: UUID
    course_id: UUID
    title: str
    order_index: int
    video_url: Optional[str]
    duration_seconds: int
    content: Optional[str]
    materials_url: Optional[List[str]]
    created_at: datetime

    model_config = {"from_attributes": True}