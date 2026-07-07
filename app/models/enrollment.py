import uuid
import enum
from sqlalchemy import (
    Column,
    Float,
    Boolean,
    Integer,
    DateTime,
    Enum as SAEnum,
    ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class EnrollmentStatusEnum(str, enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    course_id = Column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    status = Column(
        SAEnum(EnrollmentStatusEnum, name="enrollmentstatusenum"),
        default=EnrollmentStatusEnum.not_started,
        nullable=False
    )
    progress_percent = Column(Float, default=0.0, nullable=False)
    enrolled_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    completed_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    user = relationship("User", foreign_keys=[user_id])
    course = relationship("Course", back_populates="enrollments")
    lesson_progress = relationship(
        "LessonProgress",
        back_populates="enrollment",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Enrollment user={self.user_id} course={self.course_id}>"


class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    enrollment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("enrollments.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    lesson_id = Column(
        UUID(as_uuid=True),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    is_completed = Column(Boolean, default=False, nullable=False)
    time_spent_seconds = Column(Integer, default=0, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    enrollment = relationship("Enrollment", back_populates="lesson_progress")
    lesson = relationship("Lesson", back_populates="progress")

    def __repr__(self):
        return f"<LessonProgress enrollment={self.enrollment_id} lesson={self.lesson_id}>"