from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime


class AnnouncementCreate(BaseModel):
    title: str
    body: str

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()

    @field_validator("body")
    @classmethod
    def body_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Body cannot be empty")
        return v.strip()


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None


class AnnouncementResponse(BaseModel):
    id: UUID
    title: str
    body: str
    created_by: Optional[UUID]
    created_at: datetime

    model_config = {"from_attributes": True}