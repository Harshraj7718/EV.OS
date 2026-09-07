import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.modules.investors.enums import (
    EarningStatus,
    EVAssetStatus,
    InvestmentStatus,
    KycDocumentStatus,
    KycDocumentType,
    KycStatus,
    PayoutStatus,
    TransactionStatus,
    TransactionType,
)

MONEY = Numeric(12, 2)


class InvestorProfile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """One per User (role=INVESTOR). Every other model in this module is
    reached only through this profile's id, which is always resolved
    server-side from the authenticated user — never accepted from the
    client. See docs/investor.md.
    """

    __tablename__ = "investor_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    legal_name: Mapped[str] = mapped_column(String(150), nullable=False)
    pan_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    address_line1: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False, default="India")
    kyc_status: Mapped[KycStatus] = mapped_column(
        SAEnum(KycStatus, name="investor_kyc_status"), nullable=False, default=KycStatus.NOT_STARTED
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"InvestorProfile(id={self.id!r}, user_id={self.user_id!r})"


class EVAsset(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Investable inventory. `owner_investor_profile_id` is set only by
    `InvestorService.invest()` on successful (mock) settlement — no
    endpoint lets a client set or change it directly, which is what
    "investor cannot change asset ownership" actually means in code.
    """

    __tablename__ = "ev_assets"

    asset_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    model_name: Mapped[str] = mapped_column(String(150), nullable=False)
    registration_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    price: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    expected_monthly_return: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    status: Mapped[EVAssetStatus] = mapped_column(
        SAEnum(EVAssetStatus, name="ev_asset_status"),
        nullable=False,
        default=EVAssetStatus.AVAILABLE,
        index=True,
    )
    owner_investor_profile_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("investor_profiles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:  # pragma: no cover
        return f"EVAsset(id={self.id!r}, asset_code={self.asset_code!r}, status={self.status!r})"


class Investment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "investments"

    investor_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("investor_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ev_asset_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ev_assets.id"), nullable=False, index=True
    )
    amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    status: Mapped[InvestmentStatus] = mapped_column(
        SAEnum(InvestmentStatus, name="investment_status"),
        nullable=False,
        default=InvestmentStatus.PENDING,
        index=True,
    )
    invested_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    ev_asset: Mapped[EVAsset] = relationship(EVAsset, lazy="joined")

    def __repr__(self) -> str:  # pragma: no cover
        return f"Investment(id={self.id!r}, status={self.status!r})"


class InvestorEarning(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Periodic accrued income from an owned asset. Never created by any
    investor-facing endpoint — only a system/dev process accrues earnings
    (see `InvestorService.accrue_earning_dev`), otherwise an investor
    could fabricate their own income.
    """

    __tablename__ = "investor_earnings"

    investor_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("investor_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    investment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("investments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[EarningStatus] = mapped_column(
        SAEnum(EarningStatus, name="earning_status"),
        nullable=False,
        default=EarningStatus.ACCRUED,
        index=True,
    )
    paid_out_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("payouts.id", ondelete="SET NULL"), nullable=True
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"InvestorEarning(id={self.id!r}, amount={self.amount!r}, status={self.status!r})"


class Payout(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A disbursement of accrued earnings. `payout_method` is always
    "MOCK_BANK_TRANSFER" in this phase — no real payment gateway is
    connected; settlement is simulated synchronously in the service layer.
    """

    __tablename__ = "payouts"

    investor_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("investor_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    status: Mapped[PayoutStatus] = mapped_column(
        SAEnum(PayoutStatus, name="payout_status"),
        nullable=False,
        default=PayoutStatus.PENDING,
        index=True,
    )
    payout_method: Mapped[str] = mapped_column(
        String(50), nullable=False, default="MOCK_BANK_TRANSFER"
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:  # pragma: no cover
        return f"Payout(id={self.id!r}, amount={self.amount!r}, status={self.status!r})"


class Transaction(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Unified ledger of every money movement (investment, earning credit,
    payout) for a single investor — powers /investor/transactions.
    `reference_type`/`reference_id` point at the originating record
    (investment/earning/payout), same pattern as AuditLog's target fields.
    """

    __tablename__ = "investor_transactions"

    investor_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("investor_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    type: Mapped[TransactionType] = mapped_column(
        SAEnum(TransactionType, name="investor_transaction_type"), nullable=False, index=True
    )
    amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    status: Mapped[TransactionStatus] = mapped_column(
        SAEnum(TransactionStatus, name="investor_transaction_status"),
        nullable=False,
        default=TransactionStatus.COMPLETED,
        index=True,
    )
    reference_type: Mapped[str] = mapped_column(String(50), nullable=False)
    reference_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)

    def __repr__(self) -> str:  # pragma: no cover
        return f"Transaction(id={self.id!r}, type={self.type!r}, amount={self.amount!r})"


class KycDocument(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Metadata only — `file_reference` is a client-supplied string
    (filename/mock URL). No file storage service is integrated yet.
    """

    __tablename__ = "investor_kyc_documents"

    investor_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("investor_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_type: Mapped[KycDocumentType] = mapped_column(
        SAEnum(KycDocumentType, name="kyc_document_type"), nullable=False
    )
    file_reference: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[KycDocumentStatus] = mapped_column(
        SAEnum(KycDocumentStatus, name="kyc_document_status"),
        nullable=False,
        default=KycDocumentStatus.PENDING,
        index=True,
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"KycDocument(id={self.id!r}, document_type={self.document_type!r})"
