from pydantic import BaseModel, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.lesson import LessonTypeEnum


class LessonCreate(BaseModel):
    title: str
    lesson_type: LessonTypeEnum = LessonTypeEnum.video
    module_id: UUID
    order_index: int = 0
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    pdf_url: Optional[str] = None
    duration_seconds: int = 0
    content: Optional[str] = None
    materials_url: Optional[List[str]] = None
    is_free_preview: bool = False


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    lesson_type: Optional[LessonTypeEnum] = None
    order_index: Optional[int] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    pdf_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    content: Optional[str] = None
    materials_url: Optional[List[str]] = None
    is_free_preview: Optional[bool] = None


class LessonResponse(BaseModel):
    id: UUID
    course_id: UUID
    module_id: Optional[UUID] = None
    title: str
    lesson_type: LessonTypeEnum
    order_index: int
    video_url: Optional[str]
    thumbnail_url: Optional[str]
    pdf_url: Optional[str]
    duration_seconds: int
    content: Optional[str]
    materials_url: Optional[List[str]]
    is_free_preview: bool
    created_at: datetime

    model_config = {"from_attributes": True}