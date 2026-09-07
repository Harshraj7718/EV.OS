"""Rider self-service API — every route requires `require_role(RoleName.RIDER)`.

Role-gated rather than permission-gated, matching the investor module's
choice for the same reason: several relevant RBAC permission codes
(`vehicle.book`, `payment.read`, `kyc.read`, `kyc.submit`) are shared
across stakeholder roles for the general matrix, but this route surface
must stay rider-exclusive regardless — an INVESTOR account holding
`payment.read` must never reach `/api/rider/*`. See docs/rider.md.
"""
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, require_role
from app.core.pagination import Page
from app.modules.riders.schemas import (
    BookingCreate,
    BookingPublic,
    EarningPublic,
    EarningsSummary,
    JobPublic,
    KycDocumentCreate,
    KycDocumentPublic,
    RiderProfileCreate,
    RiderProfilePublic,
    RiderProfileUpdate,
    TripPublic,
    VehiclePublic,
)
from app.modules.riders.service import RiderService
from app.modules.roles.enums import RoleName
from app.modules.users.models import User

router = APIRouter(tags=["rider"])

require_rider = require_role(RoleName.RIDER)


# --- profile -------------------------------------------------------------------


@router.post("/profile", response_model=RiderProfilePublic, status_code=status.HTTP_201_CREATED)
def create_profile(
    payload: RiderProfileCreate,
    user: User = Depends(require_rider),
    db: Session = Depends(get_db_session),
) -> RiderProfilePublic:
    profile = RiderService(db).create_profile(user, payload)
    return RiderProfilePublic.model_validate(profile)


@router.get("/profile", response_model=RiderProfilePublic)
def get_profile(
    user: User = Depends(require_rider), db: Session = Depends(get_db_session)
) -> RiderProfilePublic:
    profile = RiderService(db).get_profile_for_user(user)
    return RiderProfilePublic.model_validate(profile)


@router.patch("/profile", response_model=RiderProfilePublic)
def update_profile(
    payload: RiderProfileUpdate,
    user: User = Depends(require_rider),
    db: Session = Depends(get_db_session),
) -> RiderProfilePublic:
    profile = RiderService(db).update_profile(user, payload)
    return RiderProfilePublic.model_validate(profile)


# --- KYC ---------------------------------------------------------------------------


@router.post(
    "/kyc/documents", response_model=KycDocumentPublic, status_code=status.HTTP_201_CREATED
)
def submit_kyc_document(
    payload: KycDocumentCreate,
    user: User = Depends(require_rider),
    db: Session = Depends(get_db_session),
) -> KycDocumentPublic:
    document = RiderService(db).submit_kyc_document(user, payload)
    return KycDocumentPublic.from_document(document)


@router.get("/kyc/documents", response_model=Page[KycDocumentPublic])
def list_kyc_documents(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_rider),
    db: Session = Depends(get_db_session),
) -> Page[KycDocumentPublic]:
    return RiderService(db).list_kyc_documents(user, page=page, page_size=page_size)


# --- vehicles & bookings ------------------------------------------------------------


@router.get("/vehicles", response_model=Page[VehiclePublic])
def list_available_vehicles(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _: User = Depends(require_rider),
    db: Session = Depends(get_db_session),
) -> Page[VehiclePublic]:
    return RiderService(db).list_available_vehicles(page=page, page_size=page_size)


@router.post("/bookings", response_model=BookingPublic, status_code=status.HTTP_201_CREATED)
def book_vehicle(
    payload: BookingCreate,
    user: User = Depends(require_rider),
    db: Session = Depends(get_db_session),
) -> BookingPublic:
    booking = RiderService(db).book_vehicle(user, payload)
    return BookingPublic.from_booking(booking)


@router.get("/bookings", response_model=Page[BookingPublic])
def list_bookings(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_rider),
    db: Session = Depends(get_db_session),
) -> Page[BookingPublic]:
    return RiderService(db).list_bookings(user, page=page, page_size=page_size)


@router.get("/bookings/{booking_id}", response_model=BookingPublic)
def get_booking(
    booking_id: uuid.UUID,
    user: User = Depends(require_rider),
    db: Session = Depends(get_db_session),
) -> BookingPublic:
    booking = RiderService(db).get_booking(user, booking_id)
    return BookingPublic.from_booking(booking)


@router.get("/current-vehicle", response_model=BookingPublic)
def get_current_vehicle(
    user: User = Depends(require_rider), db: Session = Depends(get_db_session)
) -> BookingPublic:
    booking = RiderService(db).get_current_vehicle(user)
    return BookingPublic.from_booking(booking)


@router.post("/current-vehicle/return", response_model=BookingPublic)
def return_current_vehicle(
    user: User = Depends(require_rider), db: Session = Depends(get_db_session)
) -> BookingPublic:
    booking = RiderService(db).return_current_vehicle(user)
    return BookingPublic.from_booking(booking)


# --- trips ---------------------------------------------------------------------------


@router.get("/trips", response_model=Page[TripPublic])
def list_trips(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_rider),
    db: Session = Depends(get_db_session),
) -> Page[TripPublic]:
    return RiderService(db).list_trips(user, page=page, page_size=page_size)


# --- job marketplace -------------------------------------------------------------------


@router.get("/jobs/marketplace", response_model=Page[JobPublic])
def list_open_jobs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _: User = Depends(require_rider),
    db: Session = Depends(get_db_session),
) -> Page[JobPublic]:
    return RiderService(db).list_open_jobs(page=page, page_size=page_size)


@router.get("/jobs/mine", response_model=Page[JobPublic])
def list_my_jobs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_rider),
    db: Session = Depends(get_db_session),
) -> Page[JobPublic]:
    return RiderService(db).list_my_jobs(user, page=page, page_size=page_size)


@router.post("/jobs/{job_id}/accept", response_model=JobPublic)
def accept_job(
    job_id: uuid.UUID,
    user: User = Depends(require_rider),
    db: Session = Depends(get_db_session),
) -> JobPublic:
    job = RiderService(db).accept_job(user, job_id)
    return JobPublic.from_job(job)


@router.post("/jobs/{job_id}/complete", response_model=JobPublic)
def complete_job(
    job_id: uuid.UUID,
    user: User = Depends(require_rider),
    db: Session = Depends(get_db_session),
) -> JobPublic:
    job = RiderService(db).complete_job(user, job_id)
    return JobPublic.from_job(job)


# --- earnings & payments -----------------------------------------------------------------


@router.get("/earnings", response_model=Page[EarningPublic])
def list_earnings(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_rider),
    db: Session = Depends(get_db_session),
) -> Page[EarningPublic]:
    return RiderService(db).list_earnings(user, page=page, page_size=page_size)


@router.get("/earnings/summary", response_model=EarningsSummary)
def get_earnings_summary(
    user: User = Depends(require_rider), db: Session = Depends(get_db_session)
) -> EarningsSummary:
    return RiderService(db).get_earnings_summary(user)


@router.get("/payments", response_model=Page[EarningPublic])
def list_payments(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_rider),
    db: Session = Depends(get_db_session),
) -> Page[EarningPublic]:
    return RiderService(db).list_payments(user, page=page, page_size=page_size)
