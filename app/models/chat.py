import uuid
import enum
from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
    UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class GroupMemberStatusEnum(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"


class ChatGroup(Base):
    __tablename__ = "chat_groups"

    id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    name = Column(String(200), nullable=False)
    created_by = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    creator = relationship("User", foreign_keys=[created_by])
    members = relationship(
        "GroupMember", back_populates="group", cascade="all, delete-orphan"
    )
    messages = relationship(
        "ChatMessage", back_populates="group", cascade="all, delete-orphan",
        order_by="ChatMessage.created_at"
    )

    def __repr__(self):
        return f"<ChatGroup {self.name}>"


class GroupMember(Base):
    __tablename__ = "group_members"
    __table_args__ = (
        UniqueConstraint("group_id", "user_id", name="uq_group_member"),
    )

    id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    group_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chat_groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    joined_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    # pending = invited but not yet accepted; accepted = active member.
    # Membership for chat access (reading/sending messages, showing up
    # in GET /chats/me) requires status == accepted.
    status = Column(
        SAEnum(GroupMemberStatusEnum, name="groupmemberstatusenum"),
        default=GroupMemberStatusEnum.pending,
        server_default=GroupMemberStatusEnum.pending.value,
        nullable=False
    )

    group = relationship("ChatGroup", back_populates="members")
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self):
        return f"<GroupMember group={self.group_id} user={self.user_id}>"


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    group_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chat_groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    sender_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    content = Column(Text, nullable=False)
    parent_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chat_messages.id", ondelete="SET NULL"),
        nullable=True
    )
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    group = relationship("ChatGroup", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
    parent = relationship("ChatMessage", remote_side=[id])

    def __repr__(self):
        return f"<ChatMessage group={self.group_id} sender={self.sender_id}>"