import uuid
from sqlalchemy import (
    Column,
    Date,
    DateTime,
    String,
    ForeignKey,
    UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class ClassCancellation(Base):
    """
    Marks a single date's class as cancelled/no-class for a course,
    without touching the course's weekly session_days schedule.

    Example: Course normally meets every Saturday, but this Saturday
    is a holiday - admin cancels just that date instead of removing
    Saturday from session_days (which would affect every future week).
    """
    __tablename__ = "class_cancellations"
    __table_args__ = (
        UniqueConstraint(
            "course_id", "date",
            name="uq_cancellation_per_course_day"
        ),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    course_id = Column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    date = Column(Date, nullable=False, index=True)
    reason = Column(String(300), nullable=True)
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    course = relationship("Course", foreign_keys=[course_id], back_populates="session_cancellations")
    created_by_user = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<ClassCancellation course={self.course_id} date={self.date}>"
