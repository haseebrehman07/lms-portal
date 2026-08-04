import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.database import get_db
from app.models.chat import ChatGroup, GroupMember, ChatMessage, GroupMemberStatusEnum
from app.models.user import User, RoleEnum
from app.schemas.chat import (
    ChatGroupCreate,
    ChatGroupResponse,
    InviteMembersRequest,
    InviteResultResponse,
    PendingInviteResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    ParentMessagePreview
)
from app.core.deps import get_current_user, require_admin
from app.core.pusher import get_pusher_client

router = APIRouter(prefix="/chats", tags=["Chat"])
logger = logging.getLogger(__name__)


def _is_member(db: Session, group_id: UUID, user_id: UUID) -> bool:
    """True only for ACCEPTED members. A pending invite does not grant
    access to read/send messages or see the group in /chats/me - the
    invitee has to accept first."""
    return db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id,
        GroupMember.status == GroupMemberStatusEnum.accepted
    ).first() is not None


def _member_count(db: Session, group_id: UUID) -> int:
    """Counts only accepted members - pending invites aren't members yet."""
    return db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.status == GroupMemberStatusEnum.accepted
    ).count()


def _message_response(msg: ChatMessage) -> ChatMessageResponse:
    parent_preview = None
    if msg.parent_id and msg.parent:
        parent_preview = ParentMessagePreview(
            id=msg.parent.id,
            sender_id=msg.parent.sender_id,
            sender_name=msg.parent.sender.name if msg.parent.sender else None,
            content=msg.parent.content
        )

    return ChatMessageResponse(
        id=msg.id,
        group_id=msg.group_id,
        sender_id=msg.sender_id,
        sender_name=msg.sender.name if msg.sender else None,
        content=msg.content,
        parent_id=msg.parent_id,
        parent=parent_preview,
        created_at=msg.created_at
    )


@router.post(
    "",
    response_model=ChatGroupResponse,
    status_code=status.HTTP_201_CREATED
)
def create_chat_group(
    payload: ChatGroupCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Admin creates a new chat group. The admin is automatically
    added as the first member."""
    if not payload.name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group name cannot be empty"
        )

    group = ChatGroup(name=payload.name.strip(), created_by=admin.id)
    db.add(group)
    db.commit()
    db.refresh(group)

    db.add(GroupMember(
        group_id=group.id,
        user_id=admin.id,
        status=GroupMemberStatusEnum.accepted
    ))
    db.commit()

    return ChatGroupResponse(
        id=group.id,
        name=group.name,
        created_by=group.created_by,
        created_at=group.created_at,
        member_count=_member_count(db, group.id)
    )


@router.post(
    "/{group_id}/members",
    response_model=InviteResultResponse,
    status_code=status.HTTP_201_CREATED
)
def invite_group_members(
    group_id: UUID,
    payload: InviteMembersRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Admin invites people to a group by email and/or user id
    (student_id). Each match gets a GroupMember row with
    status=pending - they only become an active member once they
    accept via POST /chats/invites/{group_id}/accept.
    """
    group = db.query(ChatGroup).filter(ChatGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat group not found"
        )

    if not payload.emails and not payload.student_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least one email or student_id"
        )

    # Resolve every identifier (email or user id) down to a real User.
    identifier_to_user = {}
    not_found = []

    if payload.emails:
        found_by_email = {
            u.email.lower(): u for u in db.query(User).filter(
                func.lower(User.email).in_([e.lower() for e in payload.emails])
            ).all()
        }
        for email in payload.emails:
            match = found_by_email.get(email.lower())
            if match:
                identifier_to_user[email] = match
            else:
                not_found.append(email)

    if payload.student_ids:
        found_by_id = {
            u.id: u for u in db.query(User).filter(
                User.id.in_(payload.student_ids)
            ).all()
        }
        for sid in payload.student_ids:
            match = found_by_id.get(sid)
            if match:
                identifier_to_user[str(sid)] = match
            else:
                not_found.append(str(sid))

    existing_rows = {
        m.user_id: m.status for m in db.query(GroupMember).filter(
            GroupMember.group_id == group_id
        ).all()
    }

    invited, already = [], []
    seen_user_ids = set()
    for identifier, user in identifier_to_user.items():
        if user.id in seen_user_ids:
            continue  # same person matched by both an email and a student_id in this request
        seen_user_ids.add(user.id)

        if user.id in existing_rows:
            already.append(identifier)
            continue

        db.add(GroupMember(
            group_id=group_id,
            user_id=user.id,
            status=GroupMemberStatusEnum.pending
        ))
        invited.append(identifier)

    db.commit()

    return InviteResultResponse(
        invited=invited,
        already_member_or_invited=already,
        not_found=not_found
    )


@router.get("/me", response_model=List[ChatGroupResponse])
def get_my_chat_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """All chat groups the current user is an ACCEPTED member of.
    Pending invites don't show up here - see GET /chats/invites/me."""
    groups = (
        db.query(ChatGroup)
        .join(GroupMember, GroupMember.group_id == ChatGroup.id)
        .filter(
            GroupMember.user_id == current_user.id,
            GroupMember.status == GroupMemberStatusEnum.accepted
        )
        .all()
    )

    return [
        ChatGroupResponse(
            id=g.id,
            name=g.name,
            created_by=g.created_by,
            created_at=g.created_at,
            member_count=_member_count(db, g.id)
        )
        for g in groups
    ]


@router.get("/invites/me", response_model=List[PendingInviteResponse])
def get_my_pending_invites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Every group the current user has been invited to but hasn't
    accepted or declined yet."""
    rows = (
        db.query(GroupMember, ChatGroup)
        .join(ChatGroup, ChatGroup.id == GroupMember.group_id)
        .filter(
            GroupMember.user_id == current_user.id,
            GroupMember.status == GroupMemberStatusEnum.pending
        )
        .all()
    )

    return [
        PendingInviteResponse(
            group_id=group.id,
            group_name=group.name,
            invited_by=group.created_by,
            joined_at=member.joined_at
        )
        for member, group in rows
    ]


@router.post("/invites/{group_id}/accept", status_code=status.HTTP_200_OK)
def accept_group_invite(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invite = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id,
        GroupMember.status == GroupMemberStatusEnum.pending
    ).first()
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending invite found for this group"
        )

    invite.status = GroupMemberStatusEnum.accepted
    db.commit()
    return {"detail": "Invite accepted", "group_id": str(group_id)}


@router.post("/invites/{group_id}/decline", status_code=status.HTTP_200_OK)
def decline_group_invite(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invite = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id,
        GroupMember.status == GroupMemberStatusEnum.pending
    ).first()
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending invite found for this group"
        )

    db.delete(invite)
    db.commit()
    return {"detail": "Invite declined", "group_id": str(group_id)}


@router.get(
    "/{group_id}/messages",
    response_model=List[ChatMessageResponse]
)
def get_chat_messages(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = db.query(ChatGroup).filter(ChatGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat group not found"
        )
    if not _is_member(db, group_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this group"
        )

    messages = (
        db.query(ChatMessage)
        .options(
            joinedload(ChatMessage.sender),
            joinedload(ChatMessage.parent).joinedload(ChatMessage.sender)
        )
        .filter(ChatMessage.group_id == group_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    return [_message_response(m) for m in messages]


@router.post(
    "/{group_id}/messages",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED
)
def send_chat_message(
    group_id: UUID,
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = db.query(ChatGroup).filter(ChatGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat group not found"
        )
    if not _is_member(db, group_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this group"
        )
    if not payload.content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty"
        )

    if payload.parent_id:
        parent = db.query(ChatMessage).filter(
            ChatMessage.id == payload.parent_id,
            ChatMessage.group_id == group_id
        ).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="parent_id does not refer to a message in this group"
            )

    message = ChatMessage(
        group_id=group_id,
        sender_id=current_user.id,
        content=payload.content.strip(),
        parent_id=payload.parent_id
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    try:
        get_pusher_client().trigger(
            f"group-{group_id}",
            "new-message",
            {
                "id": str(message.id),
                "group_id": str(group_id),
                "sender_id": str(current_user.id),
                "sender_name": current_user.name,
                "content": message.content,
                "parent_id": str(message.parent_id) if message.parent_id else None,
                "created_at": message.created_at.isoformat()
            }
        )
    except Exception:
        # The message is already saved in the DB at this point - if
        # Pusher is down/misconfigured, don't fail the whole request
        # and lose that. The message will just show up on next
        # refresh/history load instead of instantly for other users.
        logger.error("Pusher trigger failed for group %s", group_id, exc_info=True)

    return _message_response(message)