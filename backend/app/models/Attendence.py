import uuid
import enum
from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class AttendanceModeEnum(str, enum.Enum):
    onsite = "onsite"
    online = "online"


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "course_id", "date",
            name="uq_attendance_per_user_course_day"
        ),
    )

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
    date = Column(Date, nullable=False, index=True)
    mode = Column(
        SAEnum(AttendanceModeEnum, name="attendancemodeenum"),
        nullable=False
    )
    marked_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    user = relationship("User", foreign_keys=[user_id])
    course = relationship("Course", foreign_keys=[course_id])

    def __repr__(self):
        return f"<Attendance user={self.user_id} course={self.course_id} date={self.date} mode={self.mode}>"