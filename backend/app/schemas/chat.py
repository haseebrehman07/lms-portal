from pydantic import BaseModel, EmailStr
from typing import List, Optional
from uuid import UUID
from datetime import datetime


class ChatGroupCreate(BaseModel):
    name: str


class ChatGroupResponse(BaseModel):
    id: UUID
    name: str
    created_by: Optional[UUID] = None
    created_at: datetime
    member_count: Optional[int] = None

    model_config = {"from_attributes": True}

class ChatGroupUpdate(BaseModel):
    name: str


class GroupMemberResponse(BaseModel):
    user_id: UUID
    user_name: Optional[str] = None
    role: Optional[str] = None


class InviteMembersRequest(BaseModel):
    """Admin invites people by email and/or by their existing user id
    (called student_id in the product spec - this codebase's User.id
    IS the student identifier, there's no separate roll-number field).
    Every match becomes a pending GroupMember until the invitee
    accepts."""
    emails: List[EmailStr] = []
    student_ids: List[UUID] = []


class InviteResultResponse(BaseModel):
    invited: List[str]
    already_member_or_invited: List[str]
    not_found: List[str]


class PendingInviteResponse(BaseModel):
    group_id: UUID
    group_name: str
    invited_by: Optional[UUID] = None
    joined_at: datetime  # the row's created timestamp - i.e. when invited

    model_config = {"from_attributes": True}


class ChatMessageCreate(BaseModel):
    content: str
    parent_id: Optional[UUID] = None


class ParentMessagePreview(BaseModel):
    id: UUID
    sender_id: Optional[UUID] = None
    sender_name: Optional[str] = None
    content: str


class ChatMessageResponse(BaseModel):
    id: UUID
    group_id: UUID
    sender_id: Optional[UUID] = None
    sender_name: Optional[str] = None
    content: str
    parent_id: Optional[UUID] = None
    parent: Optional[ParentMessagePreview] = None
    created_at: datetime

    model_config = {"from_attributes": True}