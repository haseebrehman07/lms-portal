from typing import List, Optional
from datetime import date, datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.fee import FeeStructure, FeeVoucher, FeeVoucherStatusEnum
from app.schemas.fee import (
    FeeStructureCreate,
    FeeStructureResponse,
    FeeSummaryResponse,
    FeeVoucherResponse,
    FeeVoucherReview
)
from app.core.deps import get_current_user, require_admin
from app.core.storage import (
    upload_fee_receipt,
    ALLOWED_RECEIPT_TYPES,
    MAX_RECEIPT_SIZE
)

router = APIRouter(prefix="/fees", tags=["Fees"])


def _total_approved(db: Session, fee_structure_id: UUID) -> int:
    total = db.query(func.sum(FeeVoucher.amount_approved)).filter(
        FeeVoucher.fee_structure_id == fee_structure_id,
        FeeVoucher.status == FeeVoucherStatusEnum.approved
    ).scalar()
    return total or 0


def _current_fee_structure(
    db: Session, student_id: UUID, semester: Optional[str]
) -> Optional[FeeStructure]:
    query = db.query(FeeStructure).filter(FeeStructure.student_id == student_id)
    if semester:
        return query.filter(FeeStructure.semester == semester).first()
    return query.order_by(FeeStructure.created_at.desc()).first()


def _voucher_response(v: FeeVoucher) -> FeeVoucherResponse:
    return FeeVoucherResponse(
        id=v.id,
        fee_structure_id=v.fee_structure_id,
        student_id=v.student_id,
        student_name=v.student.name if v.student else None,
        student_email=v.student.email if v.student else None,
        semester=v.fee_structure.semester if v.fee_structure else None,
        amount=v.amount,
        amount_approved=v.amount_approved,
        proof_url=v.proof_url,
        status=v.status,
        created_at=v.created_at,
        reviewed_at=v.reviewed_at
    )


@router.post(
    "/structure",
    response_model=FeeStructureResponse,
    status_code=status.HTTP_201_CREATED
)
def create_fee_structure(
    payload: FeeStructureCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    student = db.query(User).filter(User.id == payload.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    if payload.total_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="total_amount must be greater than 0"
        )

    existing = db.query(FeeStructure).filter(
        FeeStructure.student_id == payload.student_id,
        FeeStructure.semester == payload.semester
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"A fee structure already exists for this student for "
                f"semester '{payload.semester}' - use PATCH /fees/structure/{existing.id} to update it"
            )
        )

    fs = FeeStructure(
        student_id=payload.student_id,
        semester=payload.semester,
        total_amount=payload.total_amount,
        due_date=payload.due_date,
        created_by=admin.id
    )
    db.add(fs)
    db.commit()
    db.refresh(fs)
    return fs


@router.patch(
    "/structure/{fee_structure_id}",
    response_model=FeeStructureResponse
)
def update_fee_structure(
    fee_structure_id: UUID,
    payload: FeeStructureCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    fs = db.query(FeeStructure).filter(FeeStructure.id == fee_structure_id).first()
    if not fs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fee structure not found"
        )
    if payload.total_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="total_amount must be greater than 0"
        )

    fs.semester = payload.semester
    fs.total_amount = payload.total_amount
    fs.due_date = payload.due_date
    db.commit()
    db.refresh(fs)
    return fs


@router.get("/structures", response_model=List[FeeStructureResponse])
def list_fee_structures(
    student_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = db.query(FeeStructure)
    if student_id:
        query = query.filter(FeeStructure.student_id == student_id)
    return query.order_by(FeeStructure.created_at.desc()).all()


@router.get("", response_model=List[FeeVoucherResponse])
def get_all_fee_vouchers(
    status_filter: Optional[FeeVoucherStatusEnum] = Query(None, alias="status"),
    student_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = db.query(FeeVoucher).options(
        joinedload(FeeVoucher.student),
        joinedload(FeeVoucher.fee_structure)
    )
    if status_filter:
        query = query.filter(FeeVoucher.status == status_filter)
    if student_id:
        query = query.filter(FeeVoucher.student_id == student_id)

    vouchers = query.order_by(FeeVoucher.created_at.desc()).all()
    return [_voucher_response(v) for v in vouchers]


@router.put("/{voucher_id}", response_model=FeeVoucherResponse)
def review_fee_voucher(
    voucher_id: UUID,
    payload: FeeVoucherReview,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    voucher = db.query(FeeVoucher).filter(FeeVoucher.id == voucher_id).first()
    if not voucher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fee voucher not found"
        )

    if payload.status == FeeVoucherStatusEnum.approved:
        if payload.amount_approved is None or payload.amount_approved <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="amount_approved is required and must be greater than 0 when approving"
            )
        voucher.amount_approved = payload.amount_approved
    elif payload.status == FeeVoucherStatusEnum.rejected:
        voucher.amount_approved = None

    voucher.status = payload.status
    voucher.reviewed_by = admin.id
    voucher.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(voucher)
    return _voucher_response(voucher)


@router.get("/me/summary", response_model=FeeSummaryResponse)
def get_my_fee_summary(
    semester: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fs = _current_fee_structure(db, current_user.id, semester)
    if not fs:
        return FeeSummaryResponse(
            fee_structure_id=None,
            semester=None,
            total_amount=0,
            total_paid=0,
            remaining_balance=0,
            due_date=None,
            status="No Fee Structure Set"
        )

    total_paid = _total_approved(db, fs.id)
    remaining = max(fs.total_amount - total_paid, 0)

    if remaining <= 0:
        label = "Paid"
    elif fs.due_date and fs.due_date < date.today():
        label = "Overdue"
    else:
        label = "Unpaid"

    return FeeSummaryResponse(
        fee_structure_id=fs.id,
        semester=fs.semester,
        total_amount=fs.total_amount,
        total_paid=total_paid,
        remaining_balance=remaining,
        due_date=fs.due_date,
        status=label
    )


@router.get("/history", response_model=List[FeeVoucherResponse])
def get_my_fee_history(
    semester: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(FeeVoucher).options(
        joinedload(FeeVoucher.student),
        joinedload(FeeVoucher.fee_structure)
    ).filter(FeeVoucher.student_id == current_user.id)

    if semester:
        query = query.join(FeeStructure).filter(FeeStructure.semester == semester)

    vouchers = query.order_by(FeeVoucher.created_at.desc()).all()
    return [_voucher_response(v) for v in vouchers]


@router.post(
    "/upload",
    response_model=FeeVoucherResponse,
    status_code=status.HTTP_201_CREATED
)
async def upload_fee_voucher(
    receipt: UploadFile = File(...),
    semester: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fs = _current_fee_structure(db, current_user.id, semester)
    if not fs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fee structure has been set up for you yet - contact admin"
        )

    if receipt.content_type not in ALLOWED_RECEIPT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Allowed: JPEG, PNG, WebP, PDF"
        )

    content = await receipt.read()
    if len(content) > MAX_RECEIPT_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Receipt file must be under 10MB"
        )

    try:
        proof_url = upload_fee_receipt(content, receipt.filename, receipt.content_type)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Receipt upload failed. Please try again."
        )

    total_paid = _total_approved(db, fs.id)
    remaining = max(fs.total_amount - total_paid, 0)

    voucher = FeeVoucher(
        fee_structure_id=fs.id,
        student_id=current_user.id,
        amount=remaining,
        proof_url=proof_url,
        status=FeeVoucherStatusEnum.pending
    )
    db.add(voucher)
    db.commit()
    db.refresh(voucher)
    return _voucher_response(voucher)