import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.modules.investors.models import EVAsset
from app.modules.riders.enums import (
    BookingStatus,
    EarningStatus,
    JobStatus,
    KycDocumentStatus,
    KycDocumentType,
    KycStatus,
    TripStatus,
)

MONEY = Numeric(12, 2)


class RiderProfile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """One per User (role=RIDER). Every other model in this module is
    reached only through this profile's id, which is always resolved
    server-side from the authenticated user — never accepted from the
    client. See docs/rider.md.
    """

    __tablename__ = "rider_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    legal_name: Mapped[str] = mapped_column(String(150), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    driving_license_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    address_line1: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False, default="India")
    kyc_status: Mapped[KycStatus] = mapped_column(
        SAEnum(KycStatus, name="rider_kyc_status"), nullable=False, default=KycStatus.NOT_STARTED
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"RiderProfile(id={self.id!r}, user_id={self.user_id!r})"


class VehicleBooking(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A rider's booking of an EV from the fleet. `ev_asset_id` points at
    the SAME `EVAsset` rows the investor module owns/allocates — booking
    never writes `EVAsset.status` or `owner_investor_profile_id`; a
    vehicle's *investment* ownership and its *current booking* are
    tracked independently (see `RiderService` for how "available for
    booking" is derived). That separation is what "rider cannot modify
    vehicle/fleet ownership" means in code — no code path in this module
    ever touches those two columns.
    """

    __tablename__ = "vehicle_bookings"

    rider_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("rider_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ev_asset_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ev_assets.id"), nullable=False, index=True
    )
    status: Mapped[BookingStatus] = mapped_column(
        SAEnum(BookingStatus, name="rider_booking_status"),
        nullable=False,
        default=BookingStatus.PENDING,
        index=True,
    )
    booked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    ev_asset: Mapped[EVAsset] = relationship(EVAsset, lazy="joined")

    def __repr__(self) -> str:  # pragma: no cover
        return f"VehicleBooking(id={self.id!r}, status={self.status!r})"


class Job(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A job-marketplace posting. `assigned_rider_profile_id` is set only
    by `RiderService.accept_job()` for the authenticated caller's own
    profile — no endpoint accepts a rider id for this field.
    """

    __tablename__ = "jobs"

    job_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    pickup_location: Mapped[str] = mapped_column(String(255), nullable=False)
    dropoff_location: Mapped[str] = mapped_column(String(255), nullable=False)
    fare_amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    status: Mapped[JobStatus] = mapped_column(
        SAEnum(JobStatus, name="rider_job_status"),
        nullable=False,
        default=JobStatus.OPEN,
        index=True,
    )
    assigned_rider_profile_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("rider_profiles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:  # pragma: no cover
        return f"Job(id={self.id!r}, job_code={self.job_code!r}, status={self.status!r})"


class Trip(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A completed (or cancelled) ride/delivery — created only by
    `RiderService.complete_job()`, snapshotting the job's route/fare at
    completion time so later job edits (if any existed) couldn't rewrite
    trip history.
    """

    __tablename__ = "trips"

    rider_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("rider_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    vehicle_booking_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("vehicle_bookings.id"), nullable=False, index=True
    )
    pickup_location: Mapped[str] = mapped_column(String(255), nullable=False)
    dropoff_location: Mapped[str] = mapped_column(String(255), nullable=False)
    fare_amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    status: Mapped[TripStatus] = mapped_column(
        SAEnum(TripStatus, name="rider_trip_status"),
        nullable=False,
        default=TripStatus.COMPLETED,
        index=True,
    )
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    job: Mapped[Job] = relationship(Job, lazy="joined")

    def __repr__(self) -> str:  # pragma: no cover
        return f"Trip(id={self.id!r}, status={self.status!r})"


class RiderEarning(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Income from one completed trip. Created only by
    `RiderService.complete_job()` and mock-settled to PAID in the same
    request — unlike the investor module's periodic passive accrual,
    rider income is realized the moment a job is completed (active/gig
    income), so there is no separate "request payout" step. See
    docs/rider.md.
    """

    __tablename__ = "rider_earnings"

    rider_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("rider_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    trip_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    status: Mapped[EarningStatus] = mapped_column(
        SAEnum(EarningStatus, name="rider_earning_status"),
        nullable=False,
        default=EarningStatus.ACCRUED,
        index=True,
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:  # pragma: no cover
        return f"RiderEarning(id={self.id!r}, amount={self.amount!r}, status={self.status!r})"


class KycDocument(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Metadata only — `file_reference` is a client-supplied string
    (filename/mock URL). No file storage service is integrated yet.
    """

    __tablename__ = "rider_kyc_documents"

    rider_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("rider_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_type: Mapped[KycDocumentType] = mapped_column(
        SAEnum(KycDocumentType, name="rider_kyc_document_type"), nullable=False
    )
    file_reference: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[KycDocumentStatus] = mapped_column(
        SAEnum(KycDocumentStatus, name="rider_kyc_document_status"),
        nullable=False,
        default=KycDocumentStatus.PENDING,
        index=True,
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"KycDocument(id={self.id!r}, document_type={self.document_type!r})"
