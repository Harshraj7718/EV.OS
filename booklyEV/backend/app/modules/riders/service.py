"""RiderService — every method resolves "which rider" from the
authenticated `User` passed in, via `get_profile_for_user()`. No method
anywhere in this file accepts a `rider_id`/`user_id` parameter from a
caller; the only identifiers callers pass in are resource ids scoped to
*this* already-resolved profile (e.g. `booking_id` for `get_booking`),
and those are always looked up with the profile id as a mandatory filter
(see repository.py). This is what "never trust rider_id from the URL"
means in code — there's structurally no code path where a URL-supplied
rider id could select whose data gets returned.
"""
import uuid
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.core.pagination import Page
from app.modules.investors.enums import EVAssetStatus
from app.modules.riders.enums import BookingStatus, EarningStatus, JobStatus, KycStatus, TripStatus
from app.modules.riders.models import (
    Job,
    KycDocument,
    RiderEarning,
    RiderProfile,
    Trip,
    VehicleBooking,
)
from app.modules.riders.repository import (
    EarningRepository,
    JobRepository,
    KycDocumentRepository,
    RiderProfileRepository,
    TripRepository,
    VehicleBookingRepository,
    VehicleRepository,
)
from app.modules.riders.schemas import (
    BookingCreate,
    BookingPublic,
    EarningPublic,
    EarningsSummary,
    JobPublic,
    KycDocumentCreate,
    KycDocumentPublic,
    RiderProfileCreate,
    RiderProfileUpdate,
    TripPublic,
    VehiclePublic,
)
from app.modules.users.models import User


class RiderService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.profiles = RiderProfileRepository(db)
        self.vehicles = VehicleRepository(db)
        self.bookings = VehicleBookingRepository(db)
        self.jobs = JobRepository(db)
        self.trips = TripRepository(db)
        self.earnings = EarningRepository(db)
        self.kyc_documents = KycDocumentRepository(db)

    # --- identity resolution ---------------------------------------------------

    def get_profile_for_user(self, user: User) -> RiderProfile:
        profile = self.profiles.get_by_user_id(user.id)
        if profile is None:
            raise NotFoundError("Rider profile not found. Create one first.")
        return profile

    # --- profile -----------------------------------------------------------------

    def create_profile(self, user: User, payload: RiderProfileCreate) -> RiderProfile:
        if self.profiles.get_by_user_id(user.id) is not None:
            raise ConflictError("Rider profile already exists.")

        profile = RiderProfile(user_id=user.id, **payload.model_dump())
        self.profiles.create(profile)
        self.db.commit()
        return profile

    def update_profile(self, user: User, payload: RiderProfileUpdate) -> RiderProfile:
        profile = self.get_profile_for_user(user)
        changes = payload.model_dump(exclude_unset=True)
        for field, value in changes.items():
            setattr(profile, field, value)
        if changes:
            self.db.commit()
        return profile

    # --- KYC -----------------------------------------------------------------------

    def submit_kyc_document(self, user: User, payload: KycDocumentCreate) -> KycDocument:
        profile = self.get_profile_for_user(user)
        document = KycDocument(
            rider_profile_id=profile.id,
            document_type=payload.document_type,
            file_reference=payload.file_reference,
        )
        self.kyc_documents.create(document)
        if profile.kyc_status == KycStatus.NOT_STARTED:
            profile.kyc_status = KycStatus.PENDING
        self.db.commit()
        return document

    def list_kyc_documents(
        self, user: User, *, page: int, page_size: int
    ) -> Page[KycDocumentPublic]:
        profile = self.get_profile_for_user(user)
        items, total = self.kyc_documents.list_for_rider(profile.id, page=page, page_size=page_size)
        return Page[KycDocumentPublic](
            items=[KycDocumentPublic.from_document(d) for d in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    # --- vehicles & bookings -----------------------------------------------------

    def list_available_vehicles(self, *, page: int, page_size: int) -> Page[VehiclePublic]:
        items, total = self.vehicles.list_available_for_booking(page=page, page_size=page_size)
        return Page[VehiclePublic](
            items=[VehiclePublic.from_asset(a) for a in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def book_vehicle(self, user: User, payload: BookingCreate) -> VehicleBooking:
        profile = self.get_profile_for_user(user)

        if self.bookings.get_active_for_rider(profile.id) is not None:
            raise ConflictError(
                "You already have an active vehicle booking. Return it before booking another."
            )

        # The asset id came from the request body — it is looked up, not
        # trusted. Its *current* deployment/booking state is re-checked
        # here regardless of what the available-vehicles list showed the
        # client a moment ago.
        asset = self.vehicles.get_by_id(payload.ev_asset_id)
        if asset is None:
            raise NotFoundError("Vehicle not found.")
        if asset.status != EVAssetStatus.ALLOCATED:
            raise ConflictError("This vehicle is not currently deployed and available for booking.")
        if self.vehicles.is_currently_booked(asset.id):
            raise ConflictError("This vehicle is currently booked by another rider.")

        booking = VehicleBooking(
            rider_profile_id=profile.id, ev_asset_id=asset.id, status=BookingStatus.PENDING
        )
        self.bookings.create(booking)

        # --- MOCK booking settlement ---------------------------------------
        # No real dispatch/handover process is connected in this phase;
        # settlement is simulated synchronously so the module is fully
        # exercisable end-to-end. See docs/rider.md.
        booking.status = BookingStatus.ACTIVE
        booking.booked_at = datetime.now(UTC)
        self.db.commit()
        return booking

    def list_bookings(
        self, user: User, *, page: int, page_size: int
    ) -> Page[BookingPublic]:
        profile = self.get_profile_for_user(user)
        items, total = self.bookings.list_for_rider(profile.id, page=page, page_size=page_size)
        return Page[BookingPublic](
            items=[BookingPublic.from_booking(b) for b in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_booking(self, user: User, booking_id: uuid.UUID) -> VehicleBooking:
        profile = self.get_profile_for_user(user)
        booking = self.bookings.get_owned(booking_id, profile.id)
        if booking is None:
            raise NotFoundError("Booking not found.")
        return booking

    def get_current_vehicle(self, user: User) -> VehicleBooking:
        profile = self.get_profile_for_user(user)
        booking = self.bookings.get_active_for_rider(profile.id)
        if booking is None:
            raise NotFoundError("No active vehicle booking.")
        return booking

    def return_current_vehicle(self, user: User) -> VehicleBooking:
        profile = self.get_profile_for_user(user)
        booking = self.bookings.get_active_for_rider(profile.id)
        if booking is None:
            raise NotFoundError("No active vehicle booking to return.")
        booking.status = BookingStatus.COMPLETED
        booking.ended_at = datetime.now(UTC)
        self.db.commit()
        return booking

    # --- trips ---------------------------------------------------------------------

    def list_trips(self, user: User, *, page: int, page_size: int) -> Page[TripPublic]:
        profile = self.get_profile_for_user(user)
        items, total = self.trips.list_for_rider(profile.id, page=page, page_size=page_size)
        return Page[TripPublic](
            items=[TripPublic.from_trip(t) for t in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    # --- job marketplace -------------------------------------------------------------

    def list_open_jobs(self, *, page: int, page_size: int) -> Page[JobPublic]:
        items, total = self.jobs.list_open(page=page, page_size=page_size)
        return Page[JobPublic](
            items=[JobPublic.from_job(j) for j in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def list_my_jobs(self, user: User, *, page: int, page_size: int) -> Page[JobPublic]:
        profile = self.get_profile_for_user(user)
        items, total = self.jobs.list_for_rider(profile.id, page=page, page_size=page_size)
        return Page[JobPublic](
            items=[JobPublic.from_job(j) for j in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def accept_job(self, user: User, job_id: uuid.UUID) -> Job:
        profile = self.get_profile_for_user(user)

        if self.bookings.get_active_for_rider(profile.id) is None:
            raise ConflictError("You need an active vehicle booking to accept a job.")

        job = self.jobs.get_by_id(job_id)
        if job is None:
            raise NotFoundError("Job not found.")
        if job.status != JobStatus.OPEN:
            raise ConflictError("This job is no longer available.")

        job.status = JobStatus.ACCEPTED
        job.assigned_rider_profile_id = profile.id
        job.accepted_at = datetime.now(UTC)
        self.db.commit()
        return job

    def complete_job(self, user: User, job_id: uuid.UUID) -> Job:
        profile = self.get_profile_for_user(user)

        job = self.jobs.get_owned(job_id, profile.id)
        if job is None:
            raise NotFoundError("Job not found.")
        if job.status != JobStatus.ACCEPTED:
            raise ConflictError("Only an accepted job can be completed.")

        active_booking = self.bookings.get_active_for_rider(profile.id)
        if active_booking is None:
            raise ConflictError("You need an active vehicle booking to complete a job.")

        now = datetime.now(UTC)
        job.status = JobStatus.COMPLETED
        job.completed_at = now

        trip = Trip(
            rider_profile_id=profile.id,
            job_id=job.id,
            vehicle_booking_id=active_booking.id,
            pickup_location=job.pickup_location,
            dropoff_location=job.dropoff_location,
            fare_amount=job.fare_amount,
            status=TripStatus.COMPLETED,
            completed_at=now,
        )
        self.trips.create(trip)

        # --- MOCK earning settlement ----------------------------------------
        # Unlike the investor module's periodic passive accrual, a rider's
        # income is realized the moment a job is completed — no separate
        # payout request exists. See docs/rider.md.
        earning = RiderEarning(
            rider_profile_id=profile.id,
            trip_id=trip.id,
            amount=job.fare_amount,
            status=EarningStatus.ACCRUED,
        )
        self.earnings.create(earning)
        earning.status = EarningStatus.PAID
        earning.paid_at = now

        self.db.commit()
        return job

    # --- earnings & payments -----------------------------------------------------------

    def list_earnings(self, user: User, *, page: int, page_size: int) -> Page[EarningPublic]:
        profile = self.get_profile_for_user(user)
        items, total = self.earnings.list_for_rider(profile.id, page=page, page_size=page_size)
        return Page[EarningPublic](
            items=[EarningPublic.from_earning(e) for e in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_earnings_summary(self, user: User) -> EarningsSummary:
        profile = self.get_profile_for_user(user)
        total_earned, total_paid, trip_count = self.earnings.summary_for_rider(profile.id)
        return EarningsSummary(
            total_earned=total_earned, total_paid=total_paid, trip_count=trip_count
        )

    def list_payments(self, user: User, *, page: int, page_size: int) -> Page[EarningPublic]:
        profile = self.get_profile_for_user(user)
        items, total = self.earnings.list_paid_for_rider(profile.id, page=page, page_size=page_size)
        return Page[EarningPublic](
            items=[EarningPublic.from_earning(e) for e in items],
            total=total,
            page=page,
            page_size=page_size,
        )
