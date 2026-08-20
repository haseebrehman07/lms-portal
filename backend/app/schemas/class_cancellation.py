from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date, datetime


class ClassCancellationCreate(BaseModel):
    date: date
    reason: Optional[str] = None


class ClassCancellationResponse(BaseModel):
    id: UUID
    course_id: UUID
    date: date
    reason: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: datetime

    model_config = {"from_attributes": True}
