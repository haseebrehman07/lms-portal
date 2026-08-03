import uuid
import enum
from sqlalchemy import (
    Column,
    String,
    Text,
    Boolean,
    Integer,
    Time,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class CourseTypeEnum(str, enum.Enum):
    onboarding = "Onboarding"
    compliance = "Compliance"
    leadership = "Leadership"
    soft_skills = "Soft Skills"
    technical = "Technical Skills"
    other = "Other"


class Course(Base):
    __tablename__ = "courses"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True
    )
    thumbnail_url = Column(String(500), nullable=True)
    type = Column(
        SAEnum(CourseTypeEnum, name="coursetypeenum"),
        nullable=True
    )
    instructor_name = Column(String(200), nullable=True)
    total_lessons = Column(Integer, default=0, nullable=False)
    is_published = Column(Boolean, default=False, nullable=False)
    attendance_enabled = Column(
        Boolean, default=False, server_default='false', nullable=False
    )
    # Weekday(s) this course/batch meets on. 0=Monday ... 5=Saturday, 6=Sunday.
    # NOTE: this defaults to a SINGLE day (Saturday). Most batches only meet
    # once a week, so don't add a second day here unless this course really
    # does run twice a week - e.g. a Saturday batch and a Sunday batch are
    # two different courses, each with its own single session_day.
    session_days = Column(
        ARRAY(Integer), default=lambda: [5], server_default='{5}', nullable=False
    )
    # The time of day (in the server's configured local time - see
    # settings.attendance_timezone) after which attendance can no longer
    # be marked for that day. NULL = no cutoff, open all day.
    attendance_cutoff_time = Column(Time, nullable=True)
    # Date the batch's session count starts from, for total_sessions
    # purposes. NULL = falls back to created_at date.
    batch_start_date = Column(Date, nullable=True)
    # Total number of classes in this batch (e.g. 8). Once that many
    # session_days have occurred since batch_start_date, attendance can no
    # longer be marked and the batch is considered complete. NULL = open-
    # ended, no cap.
    total_sessions = Column(Integer, nullable=True)
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
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now(),
        nullable=True
    )

    category = relationship("Category", back_populates="courses")
    creator = relationship("User", foreign_keys=[created_by])
    modules = relationship(
        "Module", back_populates="course",
        cascade="all, delete-orphan", order_by="Module.order_index"
    )
    lessons = relationship(
        "Lesson", back_populates="course",
        cascade="all, delete-orphan", order_by="Lesson.order_index"
    )
    enrollments = relationship(
        "Enrollment", back_populates="course", cascade="all, delete-orphan"
    )
    certificates = relationship(
        "Certificate", back_populates="course", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Course {self.title}>"