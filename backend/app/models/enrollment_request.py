import uuid
import enum
from sqlalchemy import Column, DateTime, Enum as SAEnum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class EnrollmentRequestStatusEnum(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class EnrollmentRequest(Base):
    __tablename__ = "enrollment_requests"

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
        SAEnum(EnrollmentRequestStatusEnum, name="enrollmentrequeststatusenum"),
        default=EnrollmentRequestStatusEnum.pending,
        nullable=False,
        index=True
    )
    message = Column(Text, nullable=True)
    admin_note = Column(Text, nullable=True)
    requested_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    actioned_at = Column(
        DateTime(timezone=True),
        nullable=True
    )
    actioned_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    user = relationship("User", foreign_keys=[user_id])
    course = relationship("Course", foreign_keys=[course_id])
    actioned_by_user = relationship("User", foreign_keys=[actioned_by])

    def __repr__(self):
        return f"<EnrollmentRequest user={self.user_id} course={self.course_id} status={self.status}>"