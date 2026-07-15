import uuid
import enum
from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
    UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class SubmissionStatusEnum(str, enum.Enum):
    submitted = "submitted"
    graded = "graded"
    returned = "returned"  # sent back to the learner for revision


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    lesson_id = Column(
        UUID(as_uuid=True),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )
    title = Column(String(200), nullable=False)
    instructions = Column(Text, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    max_score = Column(Integer, default=100, nullable=False)

    lesson = relationship("Lesson", back_populates="assignment")
    submissions = relationship(
        "AssignmentSubmission",
        back_populates="assignment",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Assignment {self.title}>"


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"
    __table_args__ = (
        UniqueConstraint(
            "assignment_id", "user_id", name="uq_submission_per_user"
        ),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    assignment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("assignments.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    submission_text = Column(Text, nullable=True)
    file_url = Column(String(500), nullable=True)
    status = Column(
        SAEnum(SubmissionStatusEnum, name="submissionstatusenum"),
        default=SubmissionStatusEnum.submitted,
        nullable=False
    )
    score = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    submitted_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    graded_at = Column(DateTime(timezone=True), nullable=True)
    graded_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    assignment = relationship("Assignment", back_populates="submissions")

    def __repr__(self):
        return f"<AssignmentSubmission user={self.user_id} status={self.status}>"