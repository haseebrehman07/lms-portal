import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Certificate(Base):
    __tablename__ = "certificates"

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
    # Human-readable, publicly-shown ID printed on the certificate and
    # used in the QR verification URL - e.g. "CHRPE-2026-062".
    # Different from `id` (the internal UUID primary key).
    certificate_number = Column(
        String(50), unique=True, nullable=False, index=True
    )
    certificate_url = Column(String(500), nullable=True)
    issued_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    user = relationship("User", foreign_keys=[user_id])
    course = relationship("Course", back_populates="certificates")

    def __repr__(self):
        return f"<Certificate {self.certificate_number} user={self.user_id} course={self.course_id}>"