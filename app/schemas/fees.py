from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date, datetime

from app.models.fee import FeeVoucherStatusEnum


class FeeStructureCreate(BaseModel):
    student_id: UUID
    semester: str
    total_amount: int
    due_date: Optional[date] = None


class FeeStructureResponse(BaseModel):
    id: UUID
    student_id: UUID
    semester: str
    total_amount: int
    due_date: Optional[date] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class FeeSummaryResponse(BaseModel):
    """What the student's Financial Ledger card should show - the
    single source of truth for total/paid/remaining, instead of the
    frontend hardcoding a total and re-deriving this itself."""
    fee_structure_id: Optional[UUID] = None
    semester: Optional[str] = None
    total_amount: int
    total_paid: int
    remaining_balance: int
    due_date: Optional[date] = None
    status: str  # "Paid" | "Unpaid" | "Overdue" | "No Fee Structure Set"


class FeeVoucherResponse(BaseModel):
    id: UUID
    fee_structure_id: UUID
    student_id: UUID
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    semester: Optional[str] = None
    amount: int
    amount_approved: Optional[int] = None
    proof_url: str
    status: FeeVoucherStatusEnum
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class FeeVoucherReview(BaseModel):
    status: FeeVoucherStatusEnum
    amount_approved: Optional[int] = None