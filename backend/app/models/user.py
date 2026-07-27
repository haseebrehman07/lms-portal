import uuid
import enum
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
    DateTime,
    Enum as SAEnum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class RoleEnum(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    learner = "learner"


class User(Base):
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    name = Column(String(100), nullable=False)
    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )
    password_hash = Column(String(255), nullable=False)
    role = Column(
        SAEnum(RoleEnum, name="roleenum"),
        default=RoleEnum.learner,
        nullable=False
    )
    department = Column(String(100), nullable=True)
    phone = Column(String(30), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    must_change_password = Column(Boolean, default=False, nullable=False)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    password_changed_at = Column(DateTime(timezone=True), nullable=True)
    # False until the user accepts their invite / sets their own password.
    # Admin-created accounts start as False; self-registration (if ever
    # re-enabled) would start as True.
    password_reset_token = Column(String(255), nullable=True, index=True)
    password_reset_expires = Column(DateTime(timezone=True), nullable=True)
    # Set every time the password actually changes. Any JWT issued before
    # this timestamp is treated as invalid, even if it hasn't expired yet -
    # this is what makes a password reset actually kill old sessions.
    password_changed_at = Column(DateTime(timezone=True), nullable=True)
    # Brute-force protection: lock the account after repeated failed logins.
    failed_login_attempts = Column(Integer, default=0, server_default='0', nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)
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

    def __repr__(self):
        return f"<User {self.email} role={self.role}>"