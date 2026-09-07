"""Every business-owned table carries `business_profile_id` directly —
never only reachable via a join through Fleet/FleetVehicle. That
denormalization is deliberate: multi-tenant ownership checks in
`repository.py` are always a single-column `WHERE business_profile_id =
:id` filter, never a computed join, which is what "do not rely only on
IDs" and "check resource ownership" mean in code for this module. See
docs/business.md.
"""
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, Text, text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.modules.businesses.enums import (
    BusinessDocumentStatus,
    BusinessDocumentType,
    FleetStatus,
    FleetVehicleStatus,
    RiderAssignmentStatus,
    TripStatus,
    VehicleStatus,
    VerificationStatus,
)

MONEY = Numeric(12, 2)


class BusinessProfile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """One per User (role=BUSINESS). "Business membership" (see
    docs/business.md's four-layer authorization model) means this row
    exists for the authenticated user — `BusinessService.get_business_for_user()`
    is the only place any other model in this module is reached from.
    """

    __tablename__ = "business_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    business_name: Mapped[str] = mapped_column(String(150), nullable=False)
    registration_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    business_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address_line1: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False, default="India")
    verification_status: Mapped[VerificationStatus] = mapped_column(
        SAEnum(VerificationStatus, name="business_verification_status"),
        nullable=False,
        default=VerificationStatus.NOT_STARTED,
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"BusinessProfile(id={self.id!r}, business_name={self.business_name!r})"


class BusinessDocument(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Metadata only — `file_reference` is a client-supplied string
    (filename/mock URL). No file storage service is integrated yet.
    """

    __tablename__ = "business_documents"

    business_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("business_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_type: Mapped[BusinessDocumentType] = mapped_column(
        SAEnum(BusinessDocumentType, name="business_document_type"), nullable=False
    )
    file_reference: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[BusinessDocumentStatus] = mapped_column(
        SAEnum(BusinessDocumentStatus, name="business_document_status"),
        nullable=False,
        default=BusinessDocumentStatus.PENDING,
        index=True,
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"BusinessDocument(id={self.id!r}, document_type={self.document_type!r})"


class Fleet(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "fleets"

    business_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("business_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    fleet_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[FleetStatus] = mapped_column(
        SAEnum(FleetStatus, name="business_fleet_status"),
        nullable=False,
        default=FleetStatus.ACTIVE,
        index=True,
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"Fleet(id={self.id!r}, fleet_code={self.fleet_code!r}, status={self.status!r})"


class Vehicle(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A business's own vehicle inventory — distinct from the investor
    module's `EVAsset` (the platform's shared investable fleet). A
    business adds and manages its own vehicles here; `assign`/`unassign`
    (see `FleetVehicle`) is a separate lifecycle from this record's own
    operational `status`.
    """

    __tablename__ = "vehicles"

    business_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("business_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    registration_number: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    model_name: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[VehicleStatus] = mapped_column(
        SAEnum(VehicleStatus, name="business_vehicle_status"),
        nullable=False,
        default=VehicleStatus.ACTIVE,
        index=True,
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"Vehicle(id={self.id!r}, registration_number={self.registration_number!r})"


class FleetVehicle(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """The assign/unassign join between `Fleet` and `Vehicle`. A vehicle
    can only be actively assigned once at a time — enforced both here
    (service-layer check before creating a new ACTIVE row) and at the
    database level by the partial unique index below, so the invariant
    holds even against a service-layer bug or a concurrent request.
    """

    __tablename__ = "fleet_vehicles"
    __table_args__ = (
        Index(
            "ix_fleet_vehicles_one_active_per_vehicle",
            "vehicle_id",
            unique=True,
            postgresql_where=text("status = 'ACTIVE'"),
        ),
    )

    business_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("business_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    fleet_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("fleets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[FleetVehicleStatus] = mapped_column(
        SAEnum(FleetVehicleStatus, name="business_fleet_vehicle_status"),
        nullable=False,
        default=FleetVehicleStatus.ACTIVE,
        index=True,
    )
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    unassigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    fleet: Mapped[Fleet] = relationship(Fleet, lazy="joined")
    vehicle: Mapped[Vehicle] = relationship(Vehicle, lazy="joined")

    def __repr__(self) -> str:  # pragma: no cover
        return f"FleetVehicle(id={self.id!r}, status={self.status!r})"


class BusinessRiderAssignment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A rider recruited to drive for this business. `rider_profile_id`
    references the riders module's own `RiderProfile` — this module never
    writes to it, only reads a minimal projection (see
    `RiderSummaryPublic` in schemas.py) to protect rider privacy. A rider
    can only be actively assigned to one business at a time — enforced
    both here and by the partial unique index below, same reasoning as
    `FleetVehicle`.
    """

    __tablename__ = "business_rider_assignments"
    __table_args__ = (
        Index(
            "ix_rider_assignments_one_active_per_rider",
            "rider_profile_id",
            unique=True,
            postgresql_where=text("status = 'ACTIVE'"),
        ),
    )

    business_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("business_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rider_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("rider_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[RiderAssignmentStatus] = mapped_column(
        SAEnum(RiderAssignmentStatus, name="business_rider_assignment_status"),
        nullable=False,
        default=RiderAssignmentStatus.ACTIVE,
        index=True,
    )
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    unassigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:  # pragma: no cover
        return f"BusinessRiderAssignment(id={self.id!r}, status={self.status!r})"


class Trip(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A business's own fleet-operations trip log — distinct from the
    riders module's gig-marketplace `Trip`. `vehicle_id`/`rider_profile_id`
    are snapshotted directly (not just reachable via `fleet_vehicle_id`/
    `rider_assignment_id`) so filtering by "this vehicle" or "this rider"
    never requires a join and stays correct even if the vehicle is later
    reassigned to a different fleet.
    """

    __tablename__ = "business_trips"

    business_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("business_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    fleet_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("fleets.id"), nullable=False, index=True)
    fleet_vehicle_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("fleet_vehicles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("vehicles.id"), nullable=False, index=True
    )
    rider_assignment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("business_rider_assignments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rider_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("rider_profiles.id"), nullable=False, index=True
    )
    pickup_location: Mapped[str] = mapped_column(String(255), nullable=False)
    dropoff_location: Mapped[str] = mapped_column(String(255), nullable=False)
    distance_km: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
    revenue_amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    status: Mapped[TripStatus] = mapped_column(
        SAEnum(TripStatus, name="business_trip_status"),
        nullable=False,
        default=TripStatus.COMPLETED,
        index=True,
    )
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    vehicle: Mapped[Vehicle] = relationship(Vehicle, lazy="joined")

    def __repr__(self) -> str:  # pragma: no cover
        return f"Trip(id={self.id!r}, status={self.status!r})"


class BusinessRevenue(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """One row per completed trip's recognized revenue — created only by
    `BusinessService.log_trip()` in the same request as the `Trip`, never
    by a direct client-facing "add revenue" endpoint (same
    operational-record/financial-ledger split as the investor and rider
    modules).
    """

    __tablename__ = "business_revenue"

    business_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("business_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    trip_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("business_trips.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    recognized_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    def __repr__(self) -> str:  # pragma: no cover
        return f"BusinessRevenue(id={self.id!r}, amount={self.amount!r})"
