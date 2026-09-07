import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

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
from app.modules.businesses.models import (
    BusinessDocument,
    BusinessRevenue,
    BusinessRiderAssignment,
    FleetVehicle,
    Trip,
)
from app.modules.riders.models import RiderProfile

# --- profile -----------------------------------------------------------------


class BusinessProfileCreate(BaseModel):
    business_name: str = Field(min_length=2, max_length=150)
    registration_number: str | None = Field(default=None, max_length=50)
    business_type: str | None = Field(default=None, max_length=100)
    address_line1: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    country: str = Field(default="India", max_length=100)


class BusinessProfileUpdate(BaseModel):
    business_name: str | None = Field(default=None, min_length=2, max_length=150)
    registration_number: str | None = Field(default=None, max_length=50)
    business_type: str | None = Field(default=None, max_length=100)
    address_line1: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    country: str | None = Field(default=None, max_length=100)


class BusinessProfilePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_name: str
    registration_number: str | None
    business_type: str | None
    address_line1: str | None
    city: str | None
    state: str | None
    postal_code: str | None
    country: str
    verification_status: VerificationStatus
    created_at: datetime
    updated_at: datetime


# --- documents -----------------------------------------------------------------


class BusinessDocumentCreate(BaseModel):
    document_type: BusinessDocumentType
    file_reference: str = Field(min_length=1, max_length=500)


class BusinessDocumentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    document_type: BusinessDocumentType
    file_reference: str
    status: BusinessDocumentStatus
    created_at: datetime

    @classmethod
    def from_document(cls, doc: BusinessDocument) -> "BusinessDocumentPublic":
        return cls.model_validate(doc)


# --- fleets ----------------------------------------------------------------------


class FleetCreate(BaseModel):
    fleet_code: str = Field(min_length=2, max_length=50)
    name: str = Field(min_length=2, max_length=150)
    description: str | None = Field(default=None, max_length=2000)


class FleetUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    description: str | None = Field(default=None, max_length=2000)
    status: FleetStatus | None = None


class FleetPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    fleet_code: str
    name: str
    description: str | None
    status: FleetStatus
    created_at: datetime
    updated_at: datetime


# --- vehicles ----------------------------------------------------------------------


class VehicleCreate(BaseModel):
    registration_number: str = Field(min_length=2, max_length=50)
    model_name: str = Field(min_length=1, max_length=150)


class VehicleUpdate(BaseModel):
    model_name: str | None = Field(default=None, min_length=1, max_length=150)
    status: VehicleStatus | None = None


class VehiclePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    registration_number: str
    model_name: str
    status: VehicleStatus
    created_at: datetime
    updated_at: datetime


# --- fleet <-> vehicle assignments ------------------------------------------------


class FleetVehicleAssignCreate(BaseModel):
    fleet_id: uuid.UUID
    vehicle_id: uuid.UUID


class FleetVehiclePublic(BaseModel):
    id: uuid.UUID
    status: FleetVehicleStatus
    assigned_at: datetime
    unassigned_at: datetime | None
    fleet_id: uuid.UUID
    fleet_name: str
    vehicle: VehiclePublic

    @classmethod
    def from_assignment(cls, assignment: FleetVehicle) -> "FleetVehiclePublic":
        return cls(
            id=assignment.id,
            status=assignment.status,
            assigned_at=assignment.assigned_at,
            unassigned_at=assignment.unassigned_at,
            fleet_id=assignment.fleet_id,
            fleet_name=assignment.fleet.name,
            vehicle=VehiclePublic.model_validate(assignment.vehicle),
        )


# --- riders ------------------------------------------------------------------------


class RiderSummaryPublic(BaseModel):
    """Deliberately minimal — a business browsing eligible riders or its
    own roster never sees a rider's DOB, address, driving license number,
    or documents. Just enough to make a recruiting/roster decision.
    """

    id: uuid.UUID
    legal_name: str
    city: str | None
    kyc_status: str

    @classmethod
    def from_rider_profile(cls, rider: RiderProfile) -> "RiderSummaryPublic":
        return cls(
            id=rider.id,
            legal_name=rider.legal_name,
            city=rider.city,
            kyc_status=rider.kyc_status.value,
        )


class BusinessRiderAssignmentPublic(BaseModel):
    id: uuid.UUID
    status: RiderAssignmentStatus
    assigned_at: datetime
    unassigned_at: datetime | None
    rider: RiderSummaryPublic

    @classmethod
    def from_assignment(
        cls, assignment: BusinessRiderAssignment, rider: RiderProfile
    ) -> "BusinessRiderAssignmentPublic":
        return cls(
            id=assignment.id,
            status=assignment.status,
            assigned_at=assignment.assigned_at,
            unassigned_at=assignment.unassigned_at,
            rider=RiderSummaryPublic.from_rider_profile(rider),
        )


# --- trips ---------------------------------------------------------------------------


class TripCreate(BaseModel):
    fleet_vehicle_id: uuid.UUID
    rider_assignment_id: uuid.UUID
    pickup_location: str = Field(min_length=1, max_length=255)
    dropoff_location: str = Field(min_length=1, max_length=255)
    distance_km: Decimal = Field(gt=0)
    revenue_amount: Decimal = Field(ge=0)


class TripPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    fleet_id: uuid.UUID
    vehicle_id: uuid.UUID
    rider_profile_id: uuid.UUID
    pickup_location: str
    dropoff_location: str
    distance_km: Decimal
    revenue_amount: Decimal
    status: TripStatus
    completed_at: datetime
    created_at: datetime

    @classmethod
    def from_trip(cls, trip: Trip) -> "TripPublic":
        return cls.model_validate(trip)


# --- revenue -----------------------------------------------------------------------


class BusinessRevenuePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    trip_id: uuid.UUID
    amount: Decimal
    recognized_at: datetime

    @classmethod
    def from_revenue(cls, revenue: BusinessRevenue) -> "BusinessRevenuePublic":
        return cls.model_validate(revenue)


# --- analytics -----------------------------------------------------------------------


class BusinessAnalytics(BaseModel):
    total_vehicles: int
    active_vehicles: int
    active_riders: int
    total_trips: int
    total_revenue: Decimal
    utilization_percent: Decimal


__all__ = [
    "BusinessProfileCreate",
    "BusinessProfileUpdate",
    "BusinessProfilePublic",
    "BusinessDocumentCreate",
    "BusinessDocumentPublic",
    "FleetCreate",
    "FleetUpdate",
    "FleetPublic",
    "VehicleCreate",
    "VehicleUpdate",
    "VehiclePublic",
    "FleetVehicleAssignCreate",
    "FleetVehiclePublic",
    "RiderSummaryPublic",
    "BusinessRiderAssignmentPublic",
    "TripCreate",
    "TripPublic",
    "BusinessRevenuePublic",
    "BusinessAnalytics",
]
