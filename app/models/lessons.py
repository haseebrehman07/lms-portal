import uuid
import enum
from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class LessonTypeEnum(str, enum.Enum):
    video = "video"
    pdf = "pdf"
    quiz = "quiz"
    assignment = "assignment"
    text = "text"


class Lesson(Base):
    __tablename__ = "lessons"

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
    # Nullable for now to avoid breaking existing lessons created before
    # modules existed. New lessons should always be created with a
    # module_id going forward - enforced at the API layer, not the DB.
    module_id = Column(
        UUID(as_uuid=True),
        ForeignKey("modules.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    title = Column(String(200), nullable=False)
    lesson_type = Column(
        SAEnum(LessonTypeEnum, name="lessontypeenum"),
        default=LessonTypeEnum.video,
        nullable=False
    )
    order_index = Column(Integer, nullable=False, default=0)
    video_url = Column(String(500), nullable=True)
    thumbnail_url = Column(String(500), nullable=True) 
    pdf_url = Column(String(500), nullable=True)
    duration_seconds = Column(Integer, default=0, nullable=False)
    content = Column(Text, nullable=True)
    materials_url = Column(ARRAY(String), nullable=True, default=list)
    is_free_preview = Column(Boolean, default=False, nullable=False)
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

    course = relationship("Course", back_populates="lessons")
    module = relationship("Module", back_populates="lessons")
    progress = relationship(
        "LessonProgress",
        back_populates="lesson",
        cascade="all, delete-orphan"
    )
    quiz = relationship(
        "Quiz",
        back_populates="lesson",
        uselist=False,
        cascade="all, delete-orphan"
    )
    assignment = relationship(
        "Assignment",
        back_populates="lesson",
        uselist=False,
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Lesson {self.title} type={self.lesson_type}>"