"""BusinessService — implements the four-layer authorization this
module's multi-tenancy requirement calls for:

1. **Authenticated user** — every method receives an already-verified
   `User` (resolved from the JWT by `get_current_user`, never trusted
   from client input).
2. **Business membership** — `get_business_for_user(user)` is the only
   way any other method learns "which business"; it resolves the
   caller's own `BusinessProfile` from that `User`, 404ing if none
   exists. No method anywhere in this file accepts a `business_id`
   parameter from a caller.
3. **Permission** — enforced at the router with
   `require_role(RoleName.BUSINESS)` (see router.py's docstring for why
   role-gating, not permission-gating).
4. **Resource ownership** — every read/write of a specific record uses a
   repository `get_owned(id, business_profile_id)` call, which filters on
   both the resource id *and* the caller's own business_profile_id in one
   query. A record that exists but belongs to another business is
   indistinguishable from one that doesn't exist at all (404 either way)
   — this is what "do not rely only on IDs" means in code, and why
   assigning Business B's vehicle into Business A's fleet, or logging a
   trip against Business B's rider assignment, both 404 rather than 403:
   the caller was never allowed to even resolve the other business's id
   into a real record in the first place.

See docs/business.md.
"""
import uuid
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.core.pagination import Page
from app.modules.businesses.analytics import calculate_utilization_percent
from app.modules.businesses.enums import (
    FleetStatus,
    FleetVehicleStatus,
    RiderAssignmentStatus,
    TripStatus,
    VehicleStatus,
    VerificationStatus,
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
from app.modules.businesses.repository import (
    BusinessDocumentRepository,
    BusinessProfileRepository,
    BusinessRiderAssignmentRepository,
    FleetRepository,
    FleetVehicleRepository,
    RevenueRepository,
    RiderLookupRepository,
    TripRepository,
    VehicleRepository,
)
from app.modules.businesses.schemas import (
    BusinessAnalytics,
    BusinessDocumentCreate,
    BusinessDocumentPublic,
    BusinessProfileCreate,
    BusinessProfileUpdate,
    BusinessRevenuePublic,
    BusinessRiderAssignmentPublic,
    FleetCreate,
    FleetPublic,
    FleetUpdate,
    FleetVehicleAssignCreate,
    FleetVehiclePublic,
    RiderSummaryPublic,
    TripCreate,
    TripPublic,
    VehicleCreate,
    VehiclePublic,
    VehicleUpdate,
)
from app.modules.users.models import User


class BusinessService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.profiles = BusinessProfileRepository(db)
        self.documents = BusinessDocumentRepository(db)
        self.fleets = FleetRepository(db)
        self.vehicles = VehicleRepository(db)
        self.fleet_vehicles = FleetVehicleRepository(db)
        self.rider_assignments = BusinessRiderAssignmentRepository(db)
        self.rider_lookup = RiderLookupRepository(db)
        self.trips = TripRepository(db)
        self.revenue = RevenueRepository(db)

    # --- identity resolution (membership layer) ---------------------------------

    def get_business_for_user(self, user: User) -> BusinessProfile:
        business = self.profiles.get_by_user_id(user.id)
        if business is None:
            raise NotFoundError("Business profile not found. Create one first.")
        return business

    # --- profile -----------------------------------------------------------------

    def create_profile(self, user: User, payload: BusinessProfileCreate) -> BusinessProfile:
        if self.profiles.get_by_user_id(user.id) is not None:
            raise ConflictError("Business profile already exists.")

        business = BusinessProfile(user_id=user.id, **payload.model_dump())
        self.profiles.create(business)
        self.db.commit()
        return business

    def update_profile(self, user: User, payload: BusinessProfileUpdate) -> BusinessProfile:
        business = self.get_business_for_user(user)
        changes = payload.model_dump(exclude_unset=True)
        for field, value in changes.items():
            setattr(business, field, value)
        if changes:
            self.db.commit()
        return business

    # --- documents -----------------------------------------------------------------

    def submit_document(self, user: User, payload: BusinessDocumentCreate) -> BusinessDocument:
        business = self.get_business_for_user(user)
        document = BusinessDocument(
            business_profile_id=business.id,
            document_type=payload.document_type,
            file_reference=payload.file_reference,
        )
        self.documents.create(document)
        if business.verification_status == VerificationStatus.NOT_STARTED:
            business.verification_status = VerificationStatus.PENDING
        self.db.commit()
        return document

    def list_documents(
        self, user: User, *, page: int, page_size: int
    ) -> Page[BusinessDocumentPublic]:
        business = self.get_business_for_user(user)
        items, total = self.documents.list_for_business(business.id, page=page, page_size=page_size)
        return Page[BusinessDocumentPublic](
            items=[BusinessDocumentPublic.from_document(d) for d in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    # --- fleets ----------------------------------------------------------------------

    def create_fleet(self, user: User, payload: FleetCreate) -> Fleet:
        business = self.get_business_for_user(user)
        if self.fleets.get_by_code(payload.fleet_code) is not None:
            raise ConflictError("A fleet with this fleet_code already exists.")

        fleet = Fleet(business_profile_id=business.id, **payload.model_dump())
        self.fleets.create(fleet)
        self.db.commit()
        return fleet

    def list_fleets(self, user: User, *, page: int, page_size: int) -> Page[FleetPublic]:
        business = self.get_business_for_user(user)
        items, total = self.fleets.list_for_business(business.id, page=page, page_size=page_size)
        return Page[FleetPublic](
            items=[FleetPublic.model_validate(f) for f in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_fleet(self, user: User, fleet_id: uuid.UUID) -> Fleet:
        business = self.get_business_for_user(user)
        fleet = self.fleets.get_owned(fleet_id, business.id)
        if fleet is None:
            raise NotFoundError("Fleet not found.")
        return fleet

    def update_fleet(self, user: User, fleet_id: uuid.UUID, payload: FleetUpdate) -> Fleet:
        fleet = self.get_fleet(user, fleet_id)
        changes = payload.model_dump(exclude_unset=True)
        for field, value in changes.items():
            setattr(fleet, field, value)
        if changes:
            self.db.commit()
        return fleet

    # --- vehicles ----------------------------------------------------------------------

    def create_vehicle(self, user: User, payload: VehicleCreate) -> Vehicle:
        business = self.get_business_for_user(user)
        if self.vehicles.get_by_registration_number(payload.registration_number) is not None:
            raise ConflictError("A vehicle with this registration_number already exists.")

        vehicle = Vehicle(business_profile_id=business.id, **payload.model_dump())
        self.vehicles.create(vehicle)
        self.db.commit()
        return vehicle

    def list_vehicles(self, user: User, *, page: int, page_size: int) -> Page[VehiclePublic]:
        business = self.get_business_for_user(user)
        items, total = self.vehicles.list_for_business(business.id, page=page, page_size=page_size)
        return Page[VehiclePublic](
            items=[VehiclePublic.model_validate(v) for v in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_vehicle(self, user: User, vehicle_id: uuid.UUID) -> Vehicle:
        business = self.get_business_for_user(user)
        vehicle = self.vehicles.get_owned(vehicle_id, business.id)
        if vehicle is None:
            raise NotFoundError("Vehicle not found.")
        return vehicle

    def update_vehicle(self, user: User, vehicle_id: uuid.UUID, payload: VehicleUpdate) -> Vehicle:
        vehicle = self.get_vehicle(user, vehicle_id)
        changes = payload.model_dump(exclude_unset=True)
        for field, value in changes.items():
            setattr(vehicle, field, value)
        if changes:
            self.db.commit()
        return vehicle

    # --- fleet <-> vehicle assignments -------------------------------------------------

    def assign_vehicle(self, user: User, payload: FleetVehicleAssignCreate) -> FleetVehicle:
        business = self.get_business_for_user(user)

        # Both ids came from the client — each is looked up *scoped to
        # this business* before anything else happens. Business B's
        # fleet_id or vehicle_id simply doesn't resolve under Business
        # A's id, so this 404s rather than ever comparing ownership after
        # the fact.
        fleet = self.fleets.get_owned(payload.fleet_id, business.id)
        if fleet is None:
            raise NotFoundError("Fleet not found.")
        vehicle = self.vehicles.get_owned(payload.vehicle_id, business.id)
        if vehicle is None:
            raise NotFoundError("Vehicle not found.")

        if fleet.status != FleetStatus.ACTIVE:
            raise ConflictError("Cannot assign a vehicle to an inactive fleet.")
        if vehicle.status != VehicleStatus.ACTIVE:
            raise ConflictError("Only an active vehicle can be assigned to a fleet.")
        if self.fleet_vehicles.get_active_for_vehicle(vehicle.id) is not None:
            raise ConflictError("This vehicle is already actively assigned to a fleet.")

        assignment = FleetVehicle(
            business_profile_id=business.id,
            fleet_id=fleet.id,
            vehicle_id=vehicle.id,
            status=FleetVehicleStatus.ACTIVE,
            assigned_at=datetime.now(UTC),
        )
        self.fleet_vehicles.create(assignment)
        self.db.commit()
        return assignment

    def list_fleet_vehicle_assignments(
        self, user: User, *, page: int, page_size: int
    ) -> Page[FleetVehiclePublic]:
        business = self.get_business_for_user(user)
        items, total = self.fleet_vehicles.list_for_business(
            business.id, page=page, page_size=page_size
        )
        return Page[FleetVehiclePublic](
            items=[FleetVehiclePublic.from_assignment(a) for a in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def unassign_vehicle(self, user: User, assignment_id: uuid.UUID) -> FleetVehicle:
        business = self.get_business_for_user(user)
        assignment = self.fleet_vehicles.get_owned(assignment_id, business.id)
        if assignment is None:
            raise NotFoundError("Fleet vehicle assignment not found.")
        if assignment.status != FleetVehicleStatus.ACTIVE:
            raise ConflictError("This assignment is already inactive.")

        assignment.status = FleetVehicleStatus.INACTIVE
        assignment.unassigned_at = datetime.now(UTC)
        self.db.commit()
        return assignment

    # --- riders ------------------------------------------------------------------------

    def list_eligible_riders(self, *, page: int, page_size: int) -> Page[RiderSummaryPublic]:
        items, total = self.rider_lookup.list_eligible(page=page, page_size=page_size)
        return Page[RiderSummaryPublic](
            items=[RiderSummaryPublic.from_rider_profile(r) for r in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def assign_rider(self, user: User, rider_profile_id: uuid.UUID) -> BusinessRiderAssignment:
        business = self.get_business_for_user(user)

        rider = self.rider_lookup.get_by_id(rider_profile_id)
        if rider is None:
            raise NotFoundError("Rider not found.")
        if self.rider_assignments.get_active_for_rider(rider_profile_id) is not None:
            raise ConflictError("This rider is already assigned to a business.")

        assignment = BusinessRiderAssignment(
            business_profile_id=business.id,
            rider_profile_id=rider.id,
            status=RiderAssignmentStatus.ACTIVE,
            assigned_at=datetime.now(UTC),
        )
        self.rider_assignments.create(assignment)
        self.db.commit()
        return assignment

    def list_rider_assignments(
        self, user: User, *, page: int, page_size: int
    ) -> Page[BusinessRiderAssignmentPublic]:
        business = self.get_business_for_user(user)
        items, total = self.rider_assignments.list_for_business(
            business.id, page=page, page_size=page_size
        )
        public_items = []
        for assignment in items:
            rider = self.rider_lookup.get_by_id(assignment.rider_profile_id)
            assert rider is not None  # FK guarantees the row exists
            public_items.append(BusinessRiderAssignmentPublic.from_assignment(assignment, rider))
        return Page[BusinessRiderAssignmentPublic](
            items=public_items, total=total, page=page, page_size=page_size
        )

    def unassign_rider(self, user: User, assignment_id: uuid.UUID) -> BusinessRiderAssignment:
        business = self.get_business_for_user(user)
        assignment = self.rider_assignments.get_owned(assignment_id, business.id)
        if assignment is None:
            raise NotFoundError("Rider assignment not found.")
        if assignment.status != RiderAssignmentStatus.ACTIVE:
            raise ConflictError("This assignment is already inactive.")

        assignment.status = RiderAssignmentStatus.INACTIVE
        assignment.unassigned_at = datetime.now(UTC)
        self.db.commit()
        return assignment

    # --- trips ---------------------------------------------------------------------------

    def log_trip(self, user: User, payload: TripCreate) -> Trip:
        business = self.get_business_for_user(user)

        # Both ids are looked up scoped to this business first — a trip
        # can never be logged against another business's vehicle
        # assignment or rider assignment, even if the ids are guessed
        # correctly, because they simply don't resolve under this
        # business's id.
        fleet_vehicle = self.fleet_vehicles.get_owned(payload.fleet_vehicle_id, business.id)
        if fleet_vehicle is None:
            raise NotFoundError("Fleet vehicle assignment not found.")
        if fleet_vehicle.status != FleetVehicleStatus.ACTIVE:
            raise ConflictError("This vehicle is not currently assigned to an active fleet.")

        rider_assignment = self.rider_assignments.get_owned(
            payload.rider_assignment_id, business.id
        )
        if rider_assignment is None:
            raise NotFoundError("Rider assignment not found.")
        if rider_assignment.status != RiderAssignmentStatus.ACTIVE:
            raise ConflictError("This rider is not currently assigned to your business.")

        now = datetime.now(UTC)
        trip = Trip(
            business_profile_id=business.id,
            fleet_id=fleet_vehicle.fleet_id,
            fleet_vehicle_id=fleet_vehicle.id,
            vehicle_id=fleet_vehicle.vehicle_id,
            rider_assignment_id=rider_assignment.id,
            rider_profile_id=rider_assignment.rider_profile_id,
            pickup_location=payload.pickup_location,
            dropoff_location=payload.dropoff_location,
            distance_km=payload.distance_km,
            revenue_amount=payload.revenue_amount,
            status=TripStatus.COMPLETED,
            completed_at=now,
        )
        self.trips.create(trip)

        revenue = BusinessRevenue(
            business_profile_id=business.id,
            trip_id=trip.id,
            amount=payload.revenue_amount,
            recognized_at=now,
        )
        self.revenue.create(revenue)

        self.db.commit()
        return trip

    def list_trips(
        self,
        user: User,
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
    ) -> Page[TripPublic]:
        business = self.get_business_for_user(user)
        items, total = self.trips.list_for_business(
            business.id,
            page=page,
            page_size=page_size,
            vehicle_id=vehicle_id,
            rider_profile_id=rider_profile_id,
            status=status,
            min_distance=min_distance,
            max_distance=max_distance,
            min_revenue=min_revenue,
            max_revenue=max_revenue,
        )
        return Page[TripPublic](
            items=[TripPublic.from_trip(t) for t in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_trip(self, user: User, trip_id: uuid.UUID) -> Trip:
        business = self.get_business_for_user(user)
        trip = self.trips.get_owned(trip_id, business.id)
        if trip is None:
            raise NotFoundError("Trip not found.")
        return trip

    # --- revenue -----------------------------------------------------------------------

    def list_revenue(
        self, user: User, *, page: int, page_size: int
    ) -> Page[BusinessRevenuePublic]:
        business = self.get_business_for_user(user)
        items, total = self.revenue.list_for_business(business.id, page=page, page_size=page_size)
        return Page[BusinessRevenuePublic](
            items=[BusinessRevenuePublic.from_revenue(r) for r in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    # --- analytics -----------------------------------------------------------------------

    def get_analytics(self, user: User) -> BusinessAnalytics:
        business = self.get_business_for_user(user)
        total_vehicles = self.vehicles.count_for_business(business.id)
        active_vehicles = self.vehicles.count_active_for_business(business.id)
        active_riders = self.rider_assignments.count_active_for_business(business.id)
        total_trips = self.trips.count_for_business(business.id)
        total_revenue = self.revenue.sum_for_business(business.id)
        active_fleet_vehicles = self.fleet_vehicles.count_active_for_business(business.id)

        return BusinessAnalytics(
            total_vehicles=total_vehicles,
            active_vehicles=active_vehicles,
            active_riders=active_riders,
            total_trips=total_trips,
            total_revenue=total_revenue,
            utilization_percent=calculate_utilization_percent(
                active_fleet_vehicles, total_vehicles
            ),
        )
