"""Business (Fleet SaaS) self-service API — every route requires
`require_role(RoleName.BUSINESS)`.

Role-gated rather than permission-gated, matching the investor and rider
modules' choice for the same reason: this route surface must stay
business-exclusive regardless of which permission codes any role
happens to hold in the general RBAC matrix. Role-gating is the
**permission** layer of this module's four-layer authorization model
(authenticated user → business membership → permission → resource
ownership) — see service.py's docstring for the other three.
"""
import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, require_role
from app.core.pagination import Page
from app.modules.businesses.enums import TripStatus
from app.modules.businesses.schemas import (
    BusinessAnalytics,
    BusinessDocumentCreate,
    BusinessDocumentPublic,
    BusinessProfileCreate,
    BusinessProfilePublic,
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
from app.modules.businesses.service import BusinessService
from app.modules.roles.enums import RoleName
from app.modules.users.models import User

router = APIRouter(tags=["business"])

require_business = require_role(RoleName.BUSINESS)


# --- profile -------------------------------------------------------------------


@router.post("/profile", response_model=BusinessProfilePublic, status_code=status.HTTP_201_CREATED)
def create_profile(
    payload: BusinessProfileCreate,
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> BusinessProfilePublic:
    business = BusinessService(db).create_profile(user, payload)
    return BusinessProfilePublic.model_validate(business)


@router.get("/profile", response_model=BusinessProfilePublic)
def get_profile(
    user: User = Depends(require_business), db: Session = Depends(get_db_session)
) -> BusinessProfilePublic:
    business = BusinessService(db).get_business_for_user(user)
    return BusinessProfilePublic.model_validate(business)


@router.patch("/profile", response_model=BusinessProfilePublic)
def update_profile(
    payload: BusinessProfileUpdate,
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> BusinessProfilePublic:
    business = BusinessService(db).update_profile(user, payload)
    return BusinessProfilePublic.model_validate(business)


# --- documents -----------------------------------------------------------------


@router.post(
    "/documents", response_model=BusinessDocumentPublic, status_code=status.HTTP_201_CREATED
)
def submit_document(
    payload: BusinessDocumentCreate,
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> BusinessDocumentPublic:
    document = BusinessService(db).submit_document(user, payload)
    return BusinessDocumentPublic.from_document(document)


@router.get("/documents", response_model=Page[BusinessDocumentPublic])
def list_documents(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> Page[BusinessDocumentPublic]:
    return BusinessService(db).list_documents(user, page=page, page_size=page_size)


# --- fleets ----------------------------------------------------------------------


@router.post("/fleets", response_model=FleetPublic, status_code=status.HTTP_201_CREATED)
def create_fleet(
    payload: FleetCreate,
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> FleetPublic:
    fleet = BusinessService(db).create_fleet(user, payload)
    return FleetPublic.model_validate(fleet)


@router.get("/fleets", response_model=Page[FleetPublic])
def list_fleets(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> Page[FleetPublic]:
    return BusinessService(db).list_fleets(user, page=page, page_size=page_size)


@router.get("/fleets/{fleet_id}", response_model=FleetPublic)
def get_fleet(
    fleet_id: uuid.UUID,
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> FleetPublic:
    fleet = BusinessService(db).get_fleet(user, fleet_id)
    return FleetPublic.model_validate(fleet)


@router.patch("/fleets/{fleet_id}", response_model=FleetPublic)
def update_fleet(
    fleet_id: uuid.UUID,
    payload: FleetUpdate,
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> FleetPublic:
    fleet = BusinessService(db).update_fleet(user, fleet_id, payload)
    return FleetPublic.model_validate(fleet)


# --- vehicles ----------------------------------------------------------------------


@router.post("/vehicles", response_model=VehiclePublic, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: VehicleCreate,
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> VehiclePublic:
    vehicle = BusinessService(db).create_vehicle(user, payload)
    return VehiclePublic.model_validate(vehicle)


@router.get("/vehicles", response_model=Page[VehiclePublic])
def list_vehicles(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> Page[VehiclePublic]:
    return BusinessService(db).list_vehicles(user, page=page, page_size=page_size)


@router.get("/vehicles/{vehicle_id}", response_model=VehiclePublic)
def get_vehicle(
    vehicle_id: uuid.UUID,
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> VehiclePublic:
    vehicle = BusinessService(db).get_vehicle(user, vehicle_id)
    return VehiclePublic.model_validate(vehicle)


@router.patch("/vehicles/{vehicle_id}", response_model=VehiclePublic)
def update_vehicle(
    vehicle_id: uuid.UUID,
    payload: VehicleUpdate,
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> VehiclePublic:
    vehicle = BusinessService(db).update_vehicle(user, vehicle_id, payload)
    return VehiclePublic.model_validate(vehicle)


# --- fleet <-> vehicle assignments -------------------------------------------------


@router.post(
    "/assignments/vehicles", response_model=FleetVehiclePublic, status_code=status.HTTP_201_CREATED
)
def assign_vehicle(
    payload: FleetVehicleAssignCreate,
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> FleetVehiclePublic:
    assignment = BusinessService(db).assign_vehicle(user, payload)
    return FleetVehiclePublic.from_assignment(assignment)


@router.get("/assignments/vehicles", response_model=Page[FleetVehiclePublic])
def list_vehicle_assignments(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> Page[FleetVehiclePublic]:
    return BusinessService(db).list_fleet_vehicle_assignments(user, page=page, page_size=page_size)


@router.post("/assignments/vehicles/{assignment_id}/unassign", response_model=FleetVehiclePublic)
def unassign_vehicle(
    assignment_id: uuid.UUID,
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> FleetVehiclePublic:
    assignment = BusinessService(db).unassign_vehicle(user, assignment_id)
    return FleetVehiclePublic.from_assignment(assignment)


# --- riders ------------------------------------------------------------------------


@router.get("/riders/eligible", response_model=Page[RiderSummaryPublic])
def list_eligible_riders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> Page[RiderSummaryPublic]:
    return BusinessService(db).list_eligible_riders(page=page, page_size=page_size)


@router.post(
    "/riders/{rider_profile_id}/assign",
    response_model=BusinessRiderAssignmentPublic,
    status_code=status.HTTP_201_CREATED,
)
def assign_rider(
    rider_profile_id: uuid.UUID,
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> BusinessRiderAssignmentPublic:
    service = BusinessService(db)
    assignment = service.assign_rider(user, rider_profile_id)
    rider = service.rider_lookup.get_by_id(assignment.rider_profile_id)
    assert rider is not None
    return BusinessRiderAssignmentPublic.from_assignment(assignment, rider)


@router.get("/assignments/riders", response_model=Page[BusinessRiderAssignmentPublic])
def list_rider_assignments(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> Page[BusinessRiderAssignmentPublic]:
    return BusinessService(db).list_rider_assignments(user, page=page, page_size=page_size)


@router.post(
    "/assignments/riders/{assignment_id}/unassign",
    response_model=BusinessRiderAssignmentPublic,
)
def unassign_rider(
    assignment_id: uuid.UUID,
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> BusinessRiderAssignmentPublic:
    service = BusinessService(db)
    assignment = service.unassign_rider(user, assignment_id)
    rider = service.rider_lookup.get_by_id(assignment.rider_profile_id)
    assert rider is not None
    return BusinessRiderAssignmentPublic.from_assignment(assignment, rider)


# --- trips ---------------------------------------------------------------------------


@router.post("/trips", response_model=TripPublic, status_code=status.HTTP_201_CREATED)
def log_trip(
    payload: TripCreate,
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> TripPublic:
    trip = BusinessService(db).log_trip(user, payload)
    return TripPublic.from_trip(trip)


@router.get("/trips", response_model=Page[TripPublic])
def list_trips(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    vehicle_id: uuid.UUID | None = None,
    rider_id: uuid.UUID | None = None,
    trip_status: TripStatus | None = None,
    min_distance: Decimal | None = None,
    max_distance: Decimal | None = None,
    min_revenue: Decimal | None = None,
    max_revenue: Decimal | None = None,
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> Page[TripPublic]:
    return BusinessService(db).list_trips(
        user,
        page=page,
        page_size=page_size,
        vehicle_id=vehicle_id,
        rider_profile_id=rider_id,
        status=trip_status,
        min_distance=min_distance,
        max_distance=max_distance,
        min_revenue=min_revenue,
        max_revenue=max_revenue,
    )


@router.get("/trips/{trip_id}", response_model=TripPublic)
def get_trip(
    trip_id: uuid.UUID,
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> TripPublic:
    trip = BusinessService(db).get_trip(user, trip_id)
    return TripPublic.from_trip(trip)


# --- revenue -----------------------------------------------------------------------


@router.get("/revenue", response_model=Page[BusinessRevenuePublic])
def list_revenue(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_business),
    db: Session = Depends(get_db_session),
) -> Page[BusinessRevenuePublic]:
    return BusinessService(db).list_revenue(user, page=page, page_size=page_size)


# --- analytics -----------------------------------------------------------------------


@router.get("/analytics", response_model=BusinessAnalytics)
def get_analytics(
    user: User = Depends(require_business), db: Session = Depends(get_db_session)
) -> BusinessAnalytics:
    return BusinessService(db).get_analytics(user)
