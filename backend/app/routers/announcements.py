from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.announcement import Announcement
from app.schemas.announcement import (
    AnnouncementCreate,
    AnnouncementUpdate,
    AnnouncementResponse
)
from app.core.deps import get_current_user, require_admin

router = APIRouter(prefix="/announcements", tags=["Announcements"])


@router.get("", response_model=List[AnnouncementResponse])
def get_announcements(
    db: Session = Depends(get_db)
):
    return db.query(Announcement).order_by(
        Announcement.created_at.desc()
    ).all()

@router.post(
    "",
    response_model=AnnouncementResponse,
    status_code=status.HTTP_201_CREATED
)
def create_announcement(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    announcement = Announcement(
        title=payload.title,
        body=payload.body,
        created_by=admin.id
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement


@router.patch(
    "/{announcement_id}",
    response_model=AnnouncementResponse
)
def update_announcement(
    announcement_id: UUID,
    payload: AnnouncementUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    announcement = db.query(Announcement).filter(
        Announcement.id == announcement_id
    ).first()
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(announcement, field, value)
    db.commit()
    db.refresh(announcement)
    return announcement


@router.delete(
    "/{announcement_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_announcement(
    announcement_id: UUID,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    announcement = db.query(Announcement).filter(
        Announcement.id == announcement_id
    ).first()
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    db.delete(announcement)
    db.commit()