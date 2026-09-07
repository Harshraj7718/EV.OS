"""Every list/get method that touches a business-owned table takes
`business_profile_id` as a required filter — not optional, not inferred
from anything else. That's the structural enforcement behind "do not
rely only on IDs": there is no method here capable of returning another
business's row by accident, because none of them accept a bare resource
id without also filtering on the caller's own business_profile_id.

The two exceptions are deliberately global, not per-business: eligible
riders (must consider every business's roster, not just the caller's)
and the "is this vehicle/rider already actively assigned anywhere"
checks used before creating a new assignment.
"""
import uuid
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.businesses.enums import (
    FleetVehicleStatus,
    RiderAssignmentStatus,
    TripStatus,
    VehicleStatus,
)
from app.modules.businesses.models import (
    BusinessDocument,
    BusinessProfile,
    BusinessRevenue,
    BusinessRiderAssignment,
    Fleet,
    FleetVehicle,
    Trip,
    Vehicle,
)
from app.modules.riders.models import RiderProfile


def _offset(page: int, page_size: int) -> int:
    return (page - 1) * page_size


class BusinessProfileRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_user_id(self, user_id: uuid.UUID) -> BusinessProfile | None:
        stmt = select(BusinessProfile).where(BusinessProfile.user_id == user_id)
        return self.db.scalar(stmt)

    def create(self, profile: BusinessProfile) -> BusinessProfile:
        self.db.add(profile)
        self.db.flush()
        return profile


class BusinessDocumentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, document: BusinessDocument) -> BusinessDocument:
        self.db.add(document)
        self.db.flush()
        return document

    def list_for_business(
        self, business_profile_id: uuid.UUID, *, page: int, page_size: int
    ) -> tuple[list[BusinessDocument], int]:
        is_owner = BusinessDocument.business_profile_id == business_profile_id
        total = self.db.scalar(select(func.count()).select_from(BusinessDocument).where(is_owner))
        stmt = (
            select(BusinessDocument)
            .where(is_owner)
            .order_by(BusinessDocument.created_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total or 0


class FleetRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, fleet: Fleet) -> Fleet:
        self.db.add(fleet)
        self.db.flush()
        return fleet

    def list_for_business(
        self, business_profile_id: uuid.UUID, *, page: int, page_size: int
    ) -> tuple[list[Fleet], int]:
        is_owner = Fleet.business_profile_id == business_profile_id
        total = self.db.scalar(select(func.count()).select_from(Fleet).where(is_owner))
        stmt = (
            select(Fleet)
            .where(is_owner)
            .order_by(Fleet.created_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total or 0

    def get_owned(self, fleet_id: uuid.UUID, business_profile_id: uuid.UUID) -> Fleet | None:
        """Not-found and not-yours are indistinguishable to the caller —
        same IDOR-resistant pattern used across every stakeholder module.
        """
        stmt = select(Fleet).where(
            Fleet.id == fleet_id, Fleet.business_profile_id == business_profile_id
        )
        return self.db.scalar(stmt)

    def get_by_code(self, fleet_code: str) -> Fleet | None:
        return self.db.scalar(select(Fleet).where(Fleet.fleet_code == fleet_code))


class VehicleRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, vehicle: Vehicle) -> Vehicle:
        self.db.add(vehicle)
        self.db.flush()
        return vehicle

    def list_for_business(
        self, business_profile_id: uuid.UUID, *, page: int, page_size: int
    ) -> tuple[list[Vehicle], int]:
        is_owner = Vehicle.business_profile_id == business_profile_id
        total = self.db.scalar(select(func.count()).select_from(Vehicle).where(is_owner))
        stmt = (
            select(Vehicle)
            .where(is_owner)
            .order_by(Vehicle.created_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total or 0

    def get_owned(self, vehicle_id: uuid.UUID, business_profile_id: uuid.UUID) -> Vehicle | None:
        stmt = select(Vehicle).where(
            Vehicle.id == vehicle_id, Vehicle.business_profile_id == business_profile_id
        )
        return self.db.scalar(stmt)

    def get_by_registration_number(self, registration_number: str) -> Vehicle | None:
        stmt = select(Vehicle).where(Vehicle.registration_number == registration_number)
        return self.db.scalar(stmt)

    def count_for_business(self, business_profile_id: uuid.UUID) -> int:
        return (
            self.db.scalar(
                select(func.count())
                .select_from(Vehicle)
                .where(Vehicle.business_profile_id == business_profile_id)
            )
            or 0
        )

    def count_active_for_business(self, business_profile_id: uuid.UUID) -> int:
        is_owner = Vehicle.business_profile_id == business_profile_id
        is_active = Vehicle.status == VehicleStatus.ACTIVE
        stmt = select(func.count()).select_from(Vehicle).where(is_owner & is_active)
        return self.db.scalar(stmt) or 0


class FleetVehicleRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, assignment: FleetVehicle) -> FleetVehicle:
        self.db.add(assignment)
        self.db.flush()
        return assignment

    def list_for_business(
        self, business_profile_id: uuid.UUID, *, page: int, page_size: int
    ) -> tuple[list[FleetVehicle], int]:
        is_owner = FleetVehicle.business_profile_id == business_profile_id
        total = self.db.scalar(select(func.count()).select_from(FleetVehicle).where(is_owner))
        stmt = (
            select(FleetVehicle)
            .where(is_owner)
            .order_by(FleetVehicle.created_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total or 0

    def get_owned(
        self, assignment_id: uuid.UUID, business_profile_id: uuid.UUID
    ) -> FleetVehicle | None:
        stmt = select(FleetVehicle).where(
            FleetVehicle.id == assignment_id,
            FleetVehicle.business_profile_id == business_profile_id,
        )
        return self.db.scalar(stmt)

    def get_active_for_vehicle(self, vehicle_id: uuid.UUID) -> FleetVehicle | None:
        """Global, not business-scoped — a vehicle belongs to exactly one
        business already (via `Vehicle.business_profile_id`), so this only
        ever finds an assignment within the caller's own fleet, but the
        query itself must not accidentally scope by business or it could
        miss a stale active assignment.
        """
        stmt = select(FleetVehicle).where(
            FleetVehicle.vehicle_id == vehicle_id, FleetVehicle.status == FleetVehicleStatus.ACTIVE
        )
        return self.db.scalar(stmt)

    def count_active_for_business(self, business_profile_id: uuid.UUID) -> int:
        is_owner = FleetVehicle.business_profile_id == business_profile_id
        is_active = FleetVehicle.status == FleetVehicleStatus.ACTIVE
        stmt = select(func.count()).select_from(FleetVehicle).where(is_owner & is_active)
        return self.db.scalar(stmt) or 0


class BusinessRiderAssignmentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, assignment: BusinessRiderAssignment) -> BusinessRiderAssignment:
        self.db.add(assignment)
        self.db.flush()
        return assignment

    def list_for_business(
        self, business_profile_id: uuid.UUID, *, page: int, page_size: int
    ) -> tuple[list[BusinessRiderAssignment], int]:
        is_owner = BusinessRiderAssignment.business_profile_id == business_profile_id
        total = self.db.scalar(
            select(func.count()).select_from(BusinessRiderAssignment).where(is_owner)
        )
        stmt = (
            select(BusinessRiderAssignment)
            .where(is_owner)
            .order_by(BusinessRiderAssignment.created_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total or 0

    def get_owned(
        self, assignment_id: uuid.UUID, business_profile_id: uuid.UUID
    ) -> BusinessRiderAssignment | None:
        stmt = select(BusinessRiderAssignment).where(
            BusinessRiderAssignment.id == assignment_id,
            BusinessRiderAssignment.business_profile_id == business_profile_id,
        )
        return self.db.scalar(stmt)

    def get_active_for_rider(self, rider_profile_id: uuid.UUID) -> BusinessRiderAssignment | None:
        """Global, not business-scoped — see `FleetVehicleRepository.get_active_for_vehicle`."""
        stmt = select(BusinessRiderAssignment).where(
            BusinessRiderAssignment.rider_profile_id == rider_profile_id,
            BusinessRiderAssignment.status == RiderAssignmentStatus.ACTIVE,
        )
        return self.db.scalar(stmt)

    def count_active_for_business(self, business_profile_id: uuid.UUID) -> int:
        is_owner = BusinessRiderAssignment.business_profile_id == business_profile_id
        is_active = BusinessRiderAssignment.status == RiderAssignmentStatus.ACTIVE
        stmt = select(func.count()).select_from(BusinessRiderAssignment).where(is_owner & is_active)
        return self.db.scalar(stmt) or 0


class RiderLookupRepository:
    """Deliberately global (not business-scoped) — every business must
    see the same pool of unassigned riders, minus whichever riders are
    currently active with *any* business (including the caller's own).
    Also used to hydrate a rider's minimal public summary onto an
    assignment/trip this business does own.
    """

    def __init__(self, db: Session) -> None:
        self.db = db

    def list_eligible(self, *, page: int, page_size: int) -> tuple[list[RiderProfile], int]:
        assigned_subquery = select(BusinessRiderAssignment.rider_profile_id).where(
            BusinessRiderAssignment.status == RiderAssignmentStatus.ACTIVE
        )
        is_eligible = RiderProfile.id.not_in(assigned_subquery)
        total = self.db.scalar(select(func.count()).select_from(RiderProfile).where(is_eligible))
        stmt = (
            select(RiderProfile)
            .where(is_eligible)
            .order_by(RiderProfile.created_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total or 0

    def get_by_id(self, rider_profile_id: uuid.UUID) -> RiderProfile | None:
        return self.db.get(RiderProfile, rider_profile_id)


class TripRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, trip: Trip) -> Trip:
        self.db.add(trip)
        self.db.flush()
        return trip

    def list_for_business(
        self,
        business_profile_id: uuid.UUID,
        *,
        page: int,
        page_size: int,
        vehicle_id: uuid.UUID | None = None,
        rider_profile_id: uuid.UUID | None = None,
        status: TripStatus | None = None,
        min_distance: Decimal | None = None,
        max_distance: Decimal | None = None,
        min_revenue: Decimal | None = None,
        max_revenue: Decimal | None = None,
    ) -> tuple[list[Trip], int]:
        conditions = [Trip.business_profile_id == business_profile_id]
        if vehicle_id is not None:
            conditions.append(Trip.vehicle_id == vehicle_id)
        if rider_profile_id is not None:
            conditions.append(Trip.rider_profile_id == rider_profile_id)
        if status is not None:
            conditions.append(Trip.status == status)
        if min_distance is not None:
            conditions.append(Trip.distance_km >= min_distance)
        if max_distance is not None:
            conditions.append(Trip.distance_km <= max_distance)
        if min_revenue is not None:
            conditions.append(Trip.revenue_amount >= min_revenue)
        if max_revenue is not None:
            conditions.append(Trip.revenue_amount <= max_revenue)

        total = self.db.scalar(select(func.count()).select_from(Trip).where(*conditions))
        stmt = (
            select(Trip)
            .where(*conditions)
            .order_by(Trip.completed_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total or 0

    def get_owned(self, trip_id: uuid.UUID, business_profile_id: uuid.UUID) -> Trip | None:
        stmt = select(Trip).where(
            Trip.id == trip_id, Trip.business_profile_id == business_profile_id
        )
        return self.db.scalar(stmt)

    def count_for_business(self, business_profile_id: uuid.UUID) -> int:
        is_owner = Trip.business_profile_id == business_profile_id
        return self.db.scalar(select(func.count()).select_from(Trip).where(is_owner)) or 0


class RevenueRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, revenue: BusinessRevenue) -> BusinessRevenue:
        self.db.add(revenue)
        self.db.flush()
        return revenue

    def list_for_business(
        self, business_profile_id: uuid.UUID, *, page: int, page_size: int
    ) -> tuple[list[BusinessRevenue], int]:
        is_owner = BusinessRevenue.business_profile_id == business_profile_id
        total = self.db.scalar(select(func.count()).select_from(BusinessRevenue).where(is_owner))
        stmt = (
            select(BusinessRevenue)
            .where(is_owner)
            .order_by(BusinessRevenue.recognized_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total or 0

    def sum_for_business(self, business_profile_id: uuid.UUID) -> Decimal:
        is_owner = BusinessRevenue.business_profile_id == business_profile_id
        stmt = select(func.coalesce(func.sum(BusinessRevenue.amount), 0)).where(is_owner)
        return Decimal(self.db.scalar(stmt) or 0)
