import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class TokenBlacklist(Base):
    __tablename__ = "token_blacklist"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    token = Column(String(500), nullable=False, unique=True, index=True)
    blacklisted_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    expires_at = Column(
        DateTime(timezone=True),
        nullable=False
    )

    def __repr__(self):
        return f"<TokenBlacklist {self.token[:20]}...>"