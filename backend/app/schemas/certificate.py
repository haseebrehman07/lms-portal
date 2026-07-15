from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class CertificateResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    certificate_url: Optional[str]
    issued_at: datetime

    model_config = {"from_attributes": True}