from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.user import RoleEnum


class UserUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    avatar_url: Optional[str] = None


class AdminUserUpdate(BaseModel):
    role: Optional[RoleEnum] = None
    is_active: Optional[bool] = None
    department: Optional[str] = None


class UserListResponse(BaseModel):
    id: UUID
    name: str
    email: str
    role: RoleEnum
    department: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}