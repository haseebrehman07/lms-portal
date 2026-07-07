from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.course import CourseTypeEnum


class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    thumbnail_url: Optional[str] = None
    type: Optional[CourseTypeEnum] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    thumbnail_url: Optional[str] = None
    type: Optional[CourseTypeEnum] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip() if v else v


class CourseResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    category_id: Optional[UUID]
    thumbnail_url: Optional[str]
    type: Optional[CourseTypeEnum]
    total_lessons: int
    is_published: bool
    created_by: Optional[UUID]
    created_at: datetime

    model_config = {"from_attributes": True}