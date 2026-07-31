
import uuid
import enum
from sqlalchemy import (
    Column,
    String,
    Text,
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
    # Admin's choice, per course: does this course track attendance
    # (onsite/online sessions) at all? Off by default - most courses
    # are self-paced and don't need it. Only courses with live/scheduled
    # sessions (like in-person CHRMP training days) would turn this on.
    attendance_enabled = Column(
        Boolean, default=False, server_default='false', nullable=False
    )
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
    creator = relationship(
        "User",
        foreign_keys=[created_by]
    )
    modules = relationship(
        "Module",
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="Module.order_index"
    )
    lessons = relationship(
        "Lesson",
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="Lesson.order_index"
    )
    enrollments = relationship(
        "Enrollment",
        back_populates="course",
        cascade="all, delete-orphan"
    )
    certificates = relationship(
        "Certificate",
        back_populates="course",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Course {self.title}>"