from pydantic import BaseModel, field_validator
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.schemas.lesson import LessonResponse


class ModuleCreate(BaseModel):
    title: str
    order_index: int = 0

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()


class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    order_index: Optional[int] = None


class ModuleResponse(BaseModel):
    id: UUID
    course_id: UUID
    title: str
    order_index: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ModuleWithLessonsResponse(BaseModel):
    id: UUID
    course_id: UUID
    title: str
    order_index: int
    created_at: datetime
    lessons: List[LessonResponse] = []

    model_config = {"from_attributes": True}