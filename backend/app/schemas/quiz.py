from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List, Dict
from uuid import UUID
from datetime import datetime


class QuizQuestionCreate(BaseModel):
    question: str
    options: List[str]
    correct_option: int

    @field_validator("options")
    @classmethod
    def must_have_options(cls, v: List[str]) -> List[str]:
        if len(v) < 2:
            raise ValueError("Must have at least 2 options")
        if len(v) > 4:
            raise ValueError("Maximum 4 options allowed")
        return v

    @field_validator("correct_option")
    @classmethod
    def valid_option_index(cls, v: int) -> int:
        if v < 0 or v > 3:
            raise ValueError("correct_option must be 0, 1, 2, or 3")
        return v

    @model_validator(mode="after")
    def correct_option_within_options(self):
        if self.correct_option >= len(self.options):
            raise ValueError(
                f"correct_option ({self.correct_option}) is out of range "
                f"for {len(self.options)} option(s) provided"
            )
        return self


class QuizCreate(BaseModel):
    title: str
    passing_score: int = 70
    questions: List[QuizQuestionCreate]

    @field_validator("passing_score")
    @classmethod
    def valid_passing_score(cls, v: int) -> int:
        if v < 0 or v > 100:
            raise ValueError("Passing score must be between 0 and 100")
        return v


# correct_option is NOT included here - never sent to frontend
class QuizQuestionResponse(BaseModel):
    id: UUID
    question: str
    options: List[str]

    model_config = {"from_attributes": True}


class QuizResponse(BaseModel):
    id: UUID
    lesson_id: UUID
    title: str
    passing_score: int
    questions: List[QuizQuestionResponse]

    model_config = {"from_attributes": True}


class QuizAttemptCreate(BaseModel):
    # dict of question_id -> selected option index
    answers: Dict[str, int]


class QuizAttemptResponse(BaseModel):
    id: UUID
    quiz_id: UUID
    score: int
    passed: bool
    attempted_at: datetime

    model_config = {"from_attributes": True}