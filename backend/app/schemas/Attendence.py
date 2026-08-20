from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from app.models.Attendence import AttendanceModeEnum


class AttendanceMarkRequest(BaseModel):
    course_id: UUID
    mode: AttendanceModeEnum


class AttendanceResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    date: date
    mode: AttendanceModeEnum
    marked_at: datetime

    model_config = {"from_attributes": True}


class AttendanceDetailResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    date: date
    mode: AttendanceModeEnum
    marked_at: datetime
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    course_title: Optional[str] = None

    model_config = {"from_attributes": True}


class AttendanceUpdate(BaseModel):
    date: Optional[date] = None
    mode: Optional[AttendanceModeEnum] = None


class AttendanceSummary(BaseModel):
    user_id: UUID
    user_name: str
    total_sessions_marked: int
    onsite_count: int
    online_count: int