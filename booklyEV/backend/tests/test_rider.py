"""Rider module: every endpoint, and — the core requirement — proof that
Rider A can never reach Rider B's profile/trips/bookings/earnings/
payments/documents/jobs, even when handed B's own resource ids to try.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.investors.enums import EVAssetStatus
from app.modules.investors.models import EVAsset
from app.modules.riders.models import Job
from app.modules.roles.enums import RoleName
from app.modules.users.models import User
from tests.conftest import issue_access_token, make_user_with_role

NON_RIDER_ROLES = [RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.INVESTOR, RoleName.BUSINESS]


def _rider_headers(db_session: Session, *, email: str, phone: str) -> tuple[dict, User]:
    user = make_user_with_role(db_session, RoleName.RIDER, email=email, phone=phone)
    return {"Authorization": f"Bearer {issue_access_token(user)}"}, user


def _create_deployed_vehicle(db_session: Session, *, asset_code: str) -> EVAsset:
    """A vehicle already owned/deployed by an investor — the state a
    rider needs to be able to book it. Investment ownership fields are
    set directly here only because this is test setup, never via any
    rider-facing code path.
    """
    asset = EVAsset(
        asset_code=asset_code,
        model_name="Test EV",
        price=100000,
        expected_monthly_return=1500,
        status=EVAssetStatus.ALLOCATED,
    )
    db_session.add(asset)
    db_session.flush()
    return asset


def _create_open_job(db_session: Session, *, job_code: str, fare_amount: int = 200) -> Job:
    job = Job(
        job_code=job_code,
        title="Test job",
        pickup_location="Origin",
        dropoff_location="Destination",
        fare_amount=fare_amount,
    )
    db_session.add(job)
    db_session.flush()
    return job


def _create_profile(client: TestClient, headers: dict, *, legal_name: str = "Test Rider") -> dict:
    response = client.post("/api/rider/profile", headers=headers, json={"legal_name": legal_name})
    assert response.status_code == 201, response.text
    return response.json()


def _book_vehicle(client: TestClient, headers: dict, ev_asset_id: str) -> dict:
    response = client.post(
        "/api/rider/bookings", headers=headers, json={"ev_asset_id": ev_asset_id}
    )
    assert response.status_code == 201, response.text
    return response.json()


# --- access control: only RIDER reaches this module -----------------------


def test_rider_endpoints_require_authentication(client: TestClient) -> None:
    response = client.get("/api/rider/vehicles")
    assert response.status_code == 401


@pytest.mark.parametrize("role_name", NON_RIDER_ROLES)
def test_non_rider_roles_are_denied(
    client: TestClient, db_session: Session, role_name: RoleName
) -> None:
    user = make_user_with_role(
        db_session,
        role_name,
        email=f"{role_name.value.lower()}-rdr@example.com",
        phone="+919933000001",
    )
    headers = {"Authorization": f"Bearer {issue_access_token(user)}"}

    response = client.get("/api/rider/vehicles", headers=headers)

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"


# --- profile -------------------------------------------------------------------


def test_create_profile_success(client: TestClient, db_session: Session) -> None:
    headers, _ = _rider_headers(db_session, email="profile1@example.com", phone="+919933000010")

    body = _create_profile(client, headers, legal_name="Asha Rao")

    assert body["legal_name"] == "Asha Rao"
    assert body["kyc_status"] == "NOT_STARTED"
    assert body["country"] == "India"


def test_create_profile_conflict_if_already_exists(client: TestClient, db_session: Session) -> None:
    headers, _ = _rider_headers(db_session, email="profile2@example.com", phone="+919933000011")
    _create_profile(client, headers)

    response = client.post("/api/rider/profile", headers=headers, json={"legal_name": "Second"})

    assert response.status_code == 409


def test_get_profile_404_before_creation(client: TestClient, db_session: Session) -> None:
    headers, _ = _rider_headers(db_session, email="profile3@example.com", phone="+919933000012")

    response = client.get("/api/rider/profile", headers=headers)

    assert response.status_code == 404


def test_update_profile_partial(client: TestClient, db_session: Session) -> None:
    headers, _ = _rider_headers(db_session, email="profile4@example.com", phone="+919933000013")
    _create_profile(client, headers, legal_name="Original Name")

    response = client.patch("/api/rider/profile", headers=headers, json={"city": "Pune"})

    assert response.status_code == 200
    body = response.json()
    assert body["city"] == "Pune"
    assert body["legal_name"] == "Original Name"


# --- KYC -----------------------------------------------------------------------


def test_submit_kyc_document_moves_status_to_pending(
    client: TestClient, db_session: Session
) -> None:
    headers, _ = _rider_headers(db_session, email="kyc1@example.com", phone="+919933000020")
    _create_profile(client, headers)

    response = client.post(
        "/api/rider/kyc/documents",
        headers=headers,
        json={"document_type": "DRIVING_LICENSE", "file_reference": "mock://dl.pdf"},
    )

    assert response.status_code == 201
    assert response.json()["status"] == "PENDING"

    profile = client.get("/api/rider/profile", headers=headers).json()
    assert profile["kyc_status"] == "PENDING"


def test_list_kyc_documents_only_shows_own(client: TestClient, db_session: Session) -> None:
    headers_a, _ = _rider_headers(db_session, email="kyc-a@example.com", phone="+919933000021")
    headers_b, _ = _rider_headers(db_session, email="kyc-b@example.com", phone="+919933000022")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    client.post(
        "/api/rider/kyc/documents",
        headers=headers_a,
        json={"document_type": "AADHAAR", "file_reference": "mock://a.pdf"},
    )

    b_docs = client.get("/api/rider/kyc/documents", headers=headers_b).json()

    assert b_docs["total"] == 0


# --- vehicles & bookings ---------------------------------------------------------


def test_list_available_vehicles_shows_deployed_unbooked_only(
    client: TestClient, db_session: Session
) -> None:
    headers, _ = _rider_headers(db_session, email="veh1@example.com", phone="+919933000030")
    _create_deployed_vehicle(db_session, asset_code="TEST-VEH-1")
    not_deployed = EVAsset(
        asset_code="TEST-VEH-2",
        model_name="Not deployed",
        price=100000,
        expected_monthly_return=1500,
    )
    db_session.add(not_deployed)
    db_session.flush()

    response = client.get("/api/rider/vehicles", headers=headers)

    assert response.status_code == 200
    codes = [v["asset_code"] for v in response.json()["items"]]
    assert "TEST-VEH-1" in codes
    assert "TEST-VEH-2" not in codes


def test_vehicle_public_hides_investor_fields(client: TestClient, db_session: Session) -> None:
    headers, _ = _rider_headers(db_session, email="veh2@example.com", phone="+919933000031")
    _create_deployed_vehicle(db_session, asset_code="TEST-VEH-3")

    response = client.get("/api/rider/vehicles", headers=headers)

    vehicle = next(v for v in response.json()["items"] if v["asset_code"] == "TEST-VEH-3")
    assert "price" not in vehicle
    assert "owner_investor_profile_id" not in vehicle
    assert "status" not in vehicle


def test_book_vehicle_success(client: TestClient, db_session: Session) -> None:
    headers, _ = _rider_headers(db_session, email="book1@example.com", phone="+919933000040")
    _create_profile(client, headers)
    asset = _create_deployed_vehicle(db_session, asset_code="TEST-BOOK-1")

    booking = _book_vehicle(client, headers, str(asset.id))

    assert booking["status"] == "ACTIVE"
    assert booking["vehicle"]["asset_code"] == "TEST-BOOK-1"

    current = client.get("/api/rider/current-vehicle", headers=headers)
    assert current.status_code == 200
    assert current.json()["vehicle"]["asset_code"] == "TEST-BOOK-1"


def test_book_second_vehicle_while_active_conflicts(
    client: TestClient, db_session: Session
) -> None:
    headers, _ = _rider_headers(db_session, email="book2@example.com", phone="+919933000041")
    _create_profile(client, headers)
    asset_a = _create_deployed_vehicle(db_session, asset_code="TEST-BOOK-2A")
    asset_b = _create_deployed_vehicle(db_session, asset_code="TEST-BOOK-2B")
    _book_vehicle(client, headers, str(asset_a.id))

    response = client.post(
        "/api/rider/bookings", headers=headers, json={"ev_asset_id": str(asset_b.id)}
    )

    assert response.status_code == 409


def test_book_already_booked_vehicle_conflicts(client: TestClient, db_session: Session) -> None:
    headers_a, _ = _rider_headers(db_session, email="book-a@example.com", phone="+919933000042")
    headers_b, _ = _rider_headers(db_session, email="book-b@example.com", phone="+919933000043")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    asset = _create_deployed_vehicle(db_session, asset_code="TEST-BOOK-3")
    _book_vehicle(client, headers_a, str(asset.id))

    response = client.post(
        "/api/rider/bookings", headers=headers_b, json={"ev_asset_id": str(asset.id)}
    )

    assert response.status_code == 409


def test_book_undeployed_vehicle_conflicts(client: TestClient, db_session: Session) -> None:
    headers, _ = _rider_headers(db_session, email="book4@example.com", phone="+919933000044")
    _create_profile(client, headers)
    asset = EVAsset(
        asset_code="TEST-BOOK-4",
        model_name="Undeployed",
        price=100000,
        expected_monthly_return=1500,
    )
    db_session.add(asset)
    db_session.flush()

    response = client.post(
        "/api/rider/bookings", headers=headers, json={"ev_asset_id": str(asset.id)}
    )

    assert response.status_code == 409


def test_book_nonexistent_vehicle_404(client: TestClient, db_session: Session) -> None:
    headers, _ = _rider_headers(db_session, email="book5@example.com", phone="+919933000045")
    _create_profile(client, headers)

    response = client.post(
        "/api/rider/bookings",
        headers=headers,
        json={"ev_asset_id": "00000000-0000-0000-0000-000000000000"},
    )

    assert response.status_code == 404


def test_current_vehicle_404_when_none_active(client: TestClient, db_session: Session) -> None:
    headers, _ = _rider_headers(db_session, email="cv1@example.com", phone="+919933000046")
    _create_profile(client, headers)

    response = client.get("/api/rider/current-vehicle", headers=headers)

    assert response.status_code == 404


def test_return_current_vehicle_frees_it_for_booking(
    client: TestClient, db_session: Session
) -> None:
    headers, _ = _rider_headers(db_session, email="ret1@example.com", phone="+919933000047")
    _create_profile(client, headers)
    asset = _create_deployed_vehicle(db_session, asset_code="TEST-RET-1")
    _book_vehicle(client, headers, str(asset.id))

    response = client.post("/api/rider/current-vehicle/return", headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "COMPLETED"

    assert client.get("/api/rider/current-vehicle", headers=headers).status_code == 404

    rebook = client.post(
        "/api/rider/bookings", headers=headers, json={"ev_asset_id": str(asset.id)}
    )
    assert rebook.status_code == 201


# --- ownership isolation: the core requirement ----------------------------------


def test_rider_a_cannot_view_rider_bs_booking_by_id(
    client: TestClient, db_session: Session
) -> None:
    headers_a, _ = _rider_headers(db_session, email="iso-a@example.com", phone="+919933000050")
    headers_b, _ = _rider_headers(db_session, email="iso-b@example.com", phone="+919933000051")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    asset = _create_deployed_vehicle(db_session, asset_code="TEST-ISO-1")
    booking_a = _book_vehicle(client, headers_a, str(asset.id))

    response = client.get(f"/api/rider/bookings/{booking_a['id']}", headers=headers_b)

    assert response.status_code == 404


def test_rider_a_cannot_see_rider_bs_bookings_in_list(
    client: TestClient, db_session: Session
) -> None:
    headers_a, _ = _rider_headers(db_session, email="iso-c@example.com", phone="+919933000052")
    headers_b, _ = _rider_headers(db_session, email="iso-d@example.com", phone="+919933000053")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    asset = _create_deployed_vehicle(db_session, asset_code="TEST-ISO-2")
    _book_vehicle(client, headers_a, str(asset.id))

    b_bookings = client.get("/api/rider/bookings", headers=headers_b).json()

    assert b_bookings["total"] == 0


def test_rider_a_cannot_see_rider_bs_trips_jobs_earnings_payments(
    client: TestClient, db_session: Session
) -> None:
    headers_a, _ = _rider_headers(db_session, email="iso-e@example.com", phone="+919933000054")
    headers_b, _ = _rider_headers(db_session, email="iso-f@example.com", phone="+919933000055")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    asset = _create_deployed_vehicle(db_session, asset_code="TEST-ISO-3")
    _book_vehicle(client, headers_a, str(asset.id))
    job = _create_open_job(db_session, job_code="TEST-JOB-ISO-1")
    client.post(f"/api/rider/jobs/{job.id}/accept", headers=headers_a)
    client.post(f"/api/rider/jobs/{job.id}/complete", headers=headers_a)

    assert client.get("/api/rider/trips", headers=headers_b).json()["total"] == 0
    assert client.get("/api/rider/earnings", headers=headers_b).json()["total"] == 0
    assert client.get("/api/rider/payments", headers=headers_b).json()["total"] == 0
    assert client.get("/api/rider/jobs/mine", headers=headers_b).json()["total"] == 0

    assert client.get("/api/rider/trips", headers=headers_a).json()["total"] == 1
    assert client.get("/api/rider/earnings", headers=headers_a).json()["total"] == 1
    assert client.get("/api/rider/payments", headers=headers_a).json()["total"] == 1
    assert client.get("/api/rider/jobs/mine", headers=headers_a).json()["total"] == 1


def test_rider_a_cannot_complete_rider_bs_accepted_job(
    client: TestClient, db_session: Session
) -> None:
    headers_a, _ = _rider_headers(db_session, email="iso-g@example.com", phone="+919933000056")
    headers_b, _ = _rider_headers(db_session, email="iso-h@example.com", phone="+919933000057")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    asset_a = _create_deployed_vehicle(db_session, asset_code="TEST-ISO-4A")
    asset_b = _create_deployed_vehicle(db_session, asset_code="TEST-ISO-4B")
    _book_vehicle(client, headers_a, str(asset_a.id))
    _book_vehicle(client, headers_b, str(asset_b.id))
    job = _create_open_job(db_session, job_code="TEST-JOB-ISO-2")
    client.post(f"/api/rider/jobs/{job.id}/accept", headers=headers_a)

    response = client.post(f"/api/rider/jobs/{job.id}/complete", headers=headers_b)

    assert response.status_code == 404


# --- job marketplace -------------------------------------------------------------


def test_list_open_jobs_shows_seeded_or_dev_jobs(client: TestClient, db_session: Session) -> None:
    headers, _ = _rider_headers(db_session, email="job1@example.com", phone="+919933000060")
    _create_open_job(db_session, job_code="TEST-JOB-1")

    response = client.get("/api/rider/jobs/marketplace", headers=headers)

    codes = [j["job_code"] for j in response.json()["items"]]
    assert "TEST-JOB-1" in codes


def test_accept_job_requires_active_booking(client: TestClient, db_session: Session) -> None:
    headers, _ = _rider_headers(db_session, email="job2@example.com", phone="+919933000061")
    _create_profile(client, headers)
    job = _create_open_job(db_session, job_code="TEST-JOB-2")

    response = client.post(f"/api/rider/jobs/{job.id}/accept", headers=headers)

    assert response.status_code == 409


def test_accept_already_accepted_job_conflicts(client: TestClient, db_session: Session) -> None:
    headers_a, _ = _rider_headers(db_session, email="job-a@example.com", phone="+919933000062")
    headers_b, _ = _rider_headers(db_session, email="job-b@example.com", phone="+919933000063")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    asset_a = _create_deployed_vehicle(db_session, asset_code="TEST-JOB-3A")
    asset_b = _create_deployed_vehicle(db_session, asset_code="TEST-JOB-3B")
    _book_vehicle(client, headers_a, str(asset_a.id))
    _book_vehicle(client, headers_b, str(asset_b.id))
    job = _create_open_job(db_session, job_code="TEST-JOB-3")
    client.post(f"/api/rider/jobs/{job.id}/accept", headers=headers_a)

    response = client.post(f"/api/rider/jobs/{job.id}/accept", headers=headers_b)

    assert response.status_code == 409


def test_accept_nonexistent_job_404(client: TestClient, db_session: Session) -> None:
    headers, _ = _rider_headers(db_session, email="job4@example.com", phone="+919933000064")
    _create_profile(client, headers)
    asset = _create_deployed_vehicle(db_session, asset_code="TEST-JOB-4")
    _book_vehicle(client, headers, str(asset.id))

    response = client.post(
        "/api/rider/jobs/00000000-0000-0000-0000-000000000000/accept", headers=headers
    )

    assert response.status_code == 404


def test_accept_then_complete_job_creates_trip_and_earning(
    client: TestClient, db_session: Session
) -> None:
    headers, _ = _rider_headers(db_session, email="job5@example.com", phone="+919933000065")
    _create_profile(client, headers)
    asset = _create_deployed_vehicle(db_session, asset_code="TEST-JOB-5")
    _book_vehicle(client, headers, str(asset.id))
    job = _create_open_job(db_session, job_code="TEST-JOB-5", fare_amount=350)

    accepted = client.post(f"/api/rider/jobs/{job.id}/accept", headers=headers)
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "ACCEPTED"

    completed = client.post(f"/api/rider/jobs/{job.id}/complete", headers=headers)
    assert completed.status_code == 200
    assert completed.json()["status"] == "COMPLETED"

    trips = client.get("/api/rider/trips", headers=headers).json()
    assert trips["total"] == 1
    assert float(trips["items"][0]["fare_amount"]) == 350.0

    earnings = client.get("/api/rider/earnings", headers=headers).json()
    assert earnings["total"] == 1
    assert earnings["items"][0]["status"] == "PAID"

    payments = client.get("/api/rider/payments", headers=headers).json()
    assert payments["total"] == 1

    summary = client.get("/api/rider/earnings/summary", headers=headers).json()
    assert float(summary["total_earned"]) == 350.0
    assert float(summary["total_paid"]) == 350.0
    assert summary["trip_count"] == 1


def test_complete_job_without_accepting_first_404(client: TestClient, db_session: Session) -> None:
    headers, _ = _rider_headers(db_session, email="job6@example.com", phone="+919933000066")
    _create_profile(client, headers)
    job = _create_open_job(db_session, job_code="TEST-JOB-6")

    response = client.post(f"/api/rider/jobs/{job.id}/complete", headers=headers)

    assert response.status_code == 404


def test_job_assigned_rider_not_leaked_in_marketplace(
    client: TestClient, db_session: Session
) -> None:
    headers, _ = _rider_headers(db_session, email="job7@example.com", phone="+919933000067")
    _create_profile(client, headers)
    asset = _create_deployed_vehicle(db_session, asset_code="TEST-JOB-7")
    _book_vehicle(client, headers, str(asset.id))
    job = _create_open_job(db_session, job_code="TEST-JOB-7")
    client.post(f"/api/rider/jobs/{job.id}/accept", headers=headers)

    mine = client.get("/api/rider/jobs/mine", headers=headers).json()
    assert "assigned_rider_profile_id" not in mine["items"][0]
