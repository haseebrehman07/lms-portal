from pydantic import BaseModel, field_validator, model_validator
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.assignment import SubmissionStatusEnum


class AssignmentCreate(BaseModel):
    title: str
    instructions: str
    due_date: Optional[datetime] = None
    max_score: int = 100

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()

    @field_validator("instructions")
    @classmethod
    def instructions_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Instructions cannot be empty")
        return v.strip()

    @field_validator("max_score")
    @classmethod
    def max_score_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("max_score must be greater than 0")
        return v


class AssignmentResponse(BaseModel):
    id: UUID
    lesson_id: UUID
    title: str
    instructions: str
    due_date: Optional[datetime]
    max_score: int

    model_config = {"from_attributes": True}


class AssignmentSubmissionCreate(BaseModel):
    submission_text: Optional[str] = None
    file_url: Optional[str] = None

    @model_validator(mode="after")
    def require_at_least_one(self):
        if not self.submission_text and not self.file_url:
            raise ValueError("Provide either submission text or a file")
        return self


class AssignmentSubmissionResponse(BaseModel):
    id: UUID
    assignment_id: UUID
    user_id: UUID
    submission_text: Optional[str]
    file_url: Optional[str]
    status: SubmissionStatusEnum
    score: Optional[int]
    feedback: Optional[str]
    submitted_at: datetime
    graded_at: Optional[datetime]

    model_config = {"from_attributes": True}


class AssignmentGradeInput(BaseModel):
    score: int
    feedback: Optional[str] = None

    @field_validator("score")
    @classmethod
    def score_not_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("score cannot be negative")
        return v