import uuid
import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
    UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class FeeVoucherStatusEnum(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class FeeStructure(Base):
    """
    What a student owes for a given semester, and by when. Admin sets
    this once per student per semester. Everything else (total paid,
    remaining balance, paid/unpaid status) is derived from the
    approved FeeVouchers against this, not stored separately - so
    there's never a stale/out-of-sync 'remaining' number to fix.
    """
    __tablename__ = "fee_structures"
    __table_args__ = (
        UniqueConstraint("student_id", "semester", name="uq_fee_structure_per_semester"),
    )

    id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    student_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    semester = Column(String(50), nullable=False)
    total_amount = Column(Integer, nullable=False)
    due_date = Column(Date, nullable=True)
    created_by = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    student = relationship("User", foreign_keys=[student_id])
    creator = relationship("User", foreign_keys=[created_by])
    vouchers = relationship(
        "FeeVoucher", back_populates="fee_structure", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<FeeStructure student={self.student_id} semester={self.semester}>"


class FeeVoucher(Base):
    """
    One payment submission (receipt upload) against a FeeStructure.
    `amount` is what was owed/expected at the moment the student
    submitted this receipt (auto-computed, not typed by the
    student - the upload form only takes a file). `amount_approved`
    is what admin actually verifies from the receipt and can differ
    (e.g. a partial payment).
    """
    __tablename__ = "fee_vouchers"

    id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    fee_structure_id = Column(
        UUID(as_uuid=True),
        ForeignKey("fee_structures.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    student_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    amount = Column(Integer, nullable=False)
    amount_approved = Column(Integer, nullable=True)
    proof_url = Column(String(500), nullable=False)
    status = Column(
        SAEnum(FeeVoucherStatusEnum, name="feevoucherstatusenum"),
        default=FeeVoucherStatusEnum.pending,
        server_default=FeeVoucherStatusEnum.pending.value,
        nullable=False
    )
    reviewed_by = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    fee_structure = relationship("FeeStructure", back_populates="vouchers")
    student = relationship("User", foreign_keys=[student_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])

    def __repr__(self):
        return f"<FeeVoucher student={self.student_id} status={self.status}>"