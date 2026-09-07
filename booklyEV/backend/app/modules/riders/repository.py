"""Every list/get method that touches a rider-owned table takes
`rider_profile_id` as a required filter — not optional, not inferred
from anything else. That's the structural enforcement behind "every
query must enforce ownership": there is no method here capable of
returning another rider's row by accident.
"""
import uuid
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.investors.enums import EVAssetStatus
from app.modules.investors.models import EVAsset
from app.modules.riders.enums import BookingStatus, EarningStatus, JobStatus
from app.modules.riders.models import (
    Job,
    KycDocument,
    RiderEarning,
    RiderProfile,
    Trip,
    VehicleBooking,
)


def _offset(page: int, page_size: int) -> int:
    return (page - 1) * page_size


class RiderProfileRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_user_id(self, user_id: uuid.UUID) -> RiderProfile | None:
        stmt = select(RiderProfile).where(RiderProfile.user_id == user_id)
        return self.db.scalar(stmt)

    def create(self, profile: RiderProfile) -> RiderProfile:
        self.db.add(profile)
        self.db.flush()
        return profile


class VehicleRepository:
    """Read-only view of the shared `EVAsset` fleet, from a rider's
    perspective: "available" means deployed (investment status
    ALLOCATED) *and* not currently in an ACTIVE booking with any rider —
    a derived notion, never written back to `EVAsset` itself.
    """

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, asset_id: uuid.UUID) -> EVAsset | None:
        return self.db.get(EVAsset, asset_id)

    def list_available_for_booking(
        self, *, page: int, page_size: int
    ) -> tuple[list[EVAsset], int]:
        booked_subquery = select(VehicleBooking.ev_asset_id).where(
            VehicleBooking.status == BookingStatus.ACTIVE
        )
        is_available = (EVAsset.status == EVAssetStatus.ALLOCATED) & (
            EVAsset.id.not_in(booked_subquery)
        )
        total = self.db.scalar(select(func.count()).select_from(EVAsset).where(is_available)) or 0
        stmt = (
            select(EVAsset)
            .where(is_available)
            .order_by(EVAsset.created_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total

    def is_currently_booked(self, ev_asset_id: uuid.UUID) -> bool:
        stmt = select(VehicleBooking).where(
            VehicleBooking.ev_asset_id == ev_asset_id, VehicleBooking.status == BookingStatus.ACTIVE
        )
        return self.db.scalar(stmt) is not None


class VehicleBookingRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, booking: VehicleBooking) -> VehicleBooking:
        self.db.add(booking)
        self.db.flush()
        return booking

    def list_for_rider(
        self, rider_profile_id: uuid.UUID, *, page: int, page_size: int
    ) -> tuple[list[VehicleBooking], int]:
        is_owner = VehicleBooking.rider_profile_id == rider_profile_id
        count_stmt = select(func.count()).select_from(VehicleBooking).where(is_owner)
        total = self.db.scalar(count_stmt) or 0
        stmt = (
            select(VehicleBooking)
            .where(is_owner)
            .order_by(VehicleBooking.created_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total

    def get_owned(
        self, booking_id: uuid.UUID, rider_profile_id: uuid.UUID
    ) -> VehicleBooking | None:
        """Not-found and not-yours are indistinguishable to the caller —
        same IDOR-resistant pattern as the investor module's `get_owned`.
        """
        stmt = select(VehicleBooking).where(
            VehicleBooking.id == booking_id, VehicleBooking.rider_profile_id == rider_profile_id
        )
        return self.db.scalar(stmt)

    def get_active_for_rider(self, rider_profile_id: uuid.UUID) -> VehicleBooking | None:
        stmt = select(VehicleBooking).where(
            VehicleBooking.rider_profile_id == rider_profile_id,
            VehicleBooking.status == BookingStatus.ACTIVE,
        )
        return self.db.scalar(stmt)


class JobRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, job_id: uuid.UUID) -> Job | None:
        return self.db.get(Job, job_id)

    def list_open(self, *, page: int, page_size: int) -> tuple[list[Job], int]:
        is_open = Job.status == JobStatus.OPEN
        total = self.db.scalar(select(func.count()).select_from(Job).where(is_open)) or 0
        stmt = (
            select(Job)
            .where(is_open)
            .order_by(Job.created_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total

    def list_for_rider(
        self, rider_profile_id: uuid.UUID, *, page: int, page_size: int
    ) -> tuple[list[Job], int]:
        is_assignee = Job.assigned_rider_profile_id == rider_profile_id
        total = self.db.scalar(select(func.count()).select_from(Job).where(is_assignee)) or 0
        stmt = (
            select(Job)
            .where(is_assignee)
            .order_by(Job.created_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total

    def get_owned(self, job_id: uuid.UUID, rider_profile_id: uuid.UUID) -> Job | None:
        """A job "owned" by this rider means assigned to them — same
        not-found/not-yours-are-indistinguishable pattern used elsewhere.
        """
        stmt = select(Job).where(
            Job.id == job_id, Job.assigned_rider_profile_id == rider_profile_id
        )
        return self.db.scalar(stmt)


class TripRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, trip: Trip) -> Trip:
        self.db.add(trip)
        self.db.flush()
        return trip

    def list_for_rider(
        self, rider_profile_id: uuid.UUID, *, page: int, page_size: int
    ) -> tuple[list[Trip], int]:
        is_owner = Trip.rider_profile_id == rider_profile_id
        total = self.db.scalar(select(func.count()).select_from(Trip).where(is_owner)) or 0
        stmt = (
            select(Trip)
            .where(is_owner)
            .order_by(Trip.completed_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total


class EarningRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, earning: RiderEarning) -> RiderEarning:
        self.db.add(earning)
        self.db.flush()
        return earning

    def list_for_rider(
        self, rider_profile_id: uuid.UUID, *, page: int, page_size: int
    ) -> tuple[list[RiderEarning], int]:
        is_owner = RiderEarning.rider_profile_id == rider_profile_id
        total = self.db.scalar(select(func.count()).select_from(RiderEarning).where(is_owner)) or 0
        stmt = (
            select(RiderEarning)
            .where(is_owner)
            .order_by(RiderEarning.created_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total

    def list_paid_for_rider(
        self, rider_profile_id: uuid.UUID, *, page: int, page_size: int
    ) -> tuple[list[RiderEarning], int]:
        is_paid = (RiderEarning.rider_profile_id == rider_profile_id) & (
            RiderEarning.status == EarningStatus.PAID
        )
        total = self.db.scalar(select(func.count()).select_from(RiderEarning).where(is_paid)) or 0
        stmt = (
            select(RiderEarning)
            .where(is_paid)
            .order_by(RiderEarning.paid_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total

    def summary_for_rider(self, rider_profile_id: uuid.UUID) -> tuple[Decimal, Decimal, int]:
        """Returns (total_earned, total_paid, trip_count)."""
        is_owner = RiderEarning.rider_profile_id == rider_profile_id
        total_earned = self.db.scalar(
            select(func.coalesce(func.sum(RiderEarning.amount), 0)).where(is_owner)
        )
        is_paid = is_owner & (RiderEarning.status == EarningStatus.PAID)
        total_paid = self.db.scalar(
            select(func.coalesce(func.sum(RiderEarning.amount), 0)).where(is_paid)
        )
        trip_count = self.db.scalar(select(func.count()).select_from(RiderEarning).where(is_owner))
        return Decimal(total_earned or 0), Decimal(total_paid or 0), trip_count or 0


class KycDocumentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, document: KycDocument) -> KycDocument:
        self.db.add(document)
        self.db.flush()
        return document

    def list_for_rider(
        self, rider_profile_id: uuid.UUID, *, page: int, page_size: int
    ) -> tuple[list[KycDocument], int]:
        is_owner = KycDocument.rider_profile_id == rider_profile_id
        total = self.db.scalar(select(func.count()).select_from(KycDocument).where(is_owner)) or 0
        stmt = (
            select(KycDocument)
            .where(is_owner)
            .order_by(KycDocument.created_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total
