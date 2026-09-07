import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

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
from app.modules.riders.models import Job, KycDocument, RiderEarning, Trip, VehicleBooking

# --- profile -----------------------------------------------------------------


class RiderProfileCreate(BaseModel):
    legal_name: str = Field(min_length=2, max_length=150)
    date_of_birth: date | None = None
    driving_license_number: str | None = Field(default=None, max_length=30)
    address_line1: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    country: str = Field(default="India", max_length=100)


class RiderProfileUpdate(BaseModel):
    legal_name: str | None = Field(default=None, min_length=2, max_length=150)
    date_of_birth: date | None = None
    driving_license_number: str | None = Field(default=None, max_length=30)
    address_line1: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    country: str | None = Field(default=None, max_length=100)


class RiderProfilePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    legal_name: str
    date_of_birth: date | None
    driving_license_number: str | None
    address_line1: str | None
    city: str | None
    state: str | None
    postal_code: str | None
    country: str
    kyc_status: KycStatus
    created_at: datetime
    updated_at: datetime


# --- KYC documents -------------------------------------------------------------


class KycDocumentCreate(BaseModel):
    document_type: KycDocumentType
    file_reference: str = Field(min_length=1, max_length=500)


class KycDocumentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    document_type: KycDocumentType
    file_reference: str
    status: KycDocumentStatus
    created_at: datetime

    @classmethod
    def from_document(cls, doc: KycDocument) -> "KycDocumentPublic":
        return cls.model_validate(doc)


# --- vehicles / bookings ---------------------------------------------------------


class VehiclePublic(BaseModel):
    """Deliberately excludes `price`, `expected_monthly_return`, `status`
    (investment status), and `owner_investor_profile_id` — a rider needs
    to identify the vehicle, not see investor-facing financial or
    ownership detail. This is the concrete mechanism behind "rider cannot
    access investor data" as it applies to EV assets.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    asset_code: str
    model_name: str
    registration_number: str | None

    @classmethod
    def from_asset(cls, asset: EVAsset) -> "VehiclePublic":
        return cls.model_validate(asset)


class BookingCreate(BaseModel):
    ev_asset_id: uuid.UUID


class BookingPublic(BaseModel):
    id: uuid.UUID
    status: BookingStatus
    booked_at: datetime | None
    ended_at: datetime | None
    created_at: datetime
    vehicle: VehiclePublic

    @classmethod
    def from_booking(cls, booking: VehicleBooking) -> "BookingPublic":
        return cls(
            id=booking.id,
            status=booking.status,
            booked_at=booking.booked_at,
            ended_at=booking.ended_at,
            created_at=booking.created_at,
            vehicle=VehiclePublic.from_asset(booking.ev_asset),
        )


# --- jobs ------------------------------------------------------------------------


class JobPublic(BaseModel):
    """Never includes `assigned_rider_profile_id` — the open marketplace
    listing must not reveal which other rider (if any) holds a job.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_code: str
    title: str
    description: str | None
    pickup_location: str
    dropoff_location: str
    fare_amount: Decimal
    status: JobStatus
    accepted_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

    @classmethod
    def from_job(cls, job: Job) -> "JobPublic":
        return cls.model_validate(job)


# --- trips -----------------------------------------------------------------------


class TripPublic(BaseModel):
    id: uuid.UUID
    job_code: str
    job_title: str
    pickup_location: str
    dropoff_location: str
    fare_amount: Decimal
    status: TripStatus
    completed_at: datetime
    created_at: datetime

    @classmethod
    def from_trip(cls, trip: Trip) -> "TripPublic":
        return cls(
            id=trip.id,
            job_code=trip.job.job_code,
            job_title=trip.job.title,
            pickup_location=trip.pickup_location,
            dropoff_location=trip.dropoff_location,
            fare_amount=trip.fare_amount,
            status=trip.status,
            completed_at=trip.completed_at,
            created_at=trip.created_at,
        )


# --- earnings ----------------------------------------------------------------------


class EarningPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    trip_id: uuid.UUID
    amount: Decimal
    status: EarningStatus
    paid_at: datetime | None
    created_at: datetime

    @classmethod
    def from_earning(cls, earning: RiderEarning) -> "EarningPublic":
        return cls.model_validate(earning)


class EarningsSummary(BaseModel):
    total_earned: Decimal
    total_paid: Decimal
    trip_count: int


__all__ = [
    "RiderProfileCreate",
    "RiderProfileUpdate",
    "RiderProfilePublic",
    "KycDocumentCreate",
    "KycDocumentPublic",
    "VehiclePublic",
    "BookingCreate",
    "BookingPublic",
    "JobPublic",
    "TripPublic",
    "EarningPublic",
    "EarningsSummary",
]
