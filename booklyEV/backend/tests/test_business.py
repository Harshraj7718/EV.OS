"""Business (Fleet SaaS) module: every endpoint, and — the core
requirement — comprehensive proof that this is a genuinely multi-tenant
system. Business A must never reach Business B's fleets, vehicles,
riders, or trips, even when handed B's own resource ids to try.
"""
import uuid
from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.modules.businesses.enums import FleetVehicleStatus
from app.modules.businesses.models import FleetVehicle
from app.modules.businesses.repository import BusinessProfileRepository
from app.modules.riders.models import RiderProfile
from app.modules.roles.enums import RoleName
from app.modules.users.models import User
from tests.conftest import issue_access_token, make_user_with_role

NON_BUSINESS_ROLES = [RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.INVESTOR, RoleName.RIDER]


def _business_headers(db_session: Session, *, email: str, phone: str) -> tuple[dict, User]:
    user = make_user_with_role(db_session, RoleName.BUSINESS, email=email, phone=phone)
    return {"Authorization": f"Bearer {issue_access_token(user)}"}, user


def _create_rider_profile(db_session: Session, *, email: str, phone: str) -> RiderProfile:
    user = make_user_with_role(db_session, RoleName.RIDER, email=email, phone=phone)
    rider = RiderProfile(user_id=user.id, legal_name=f"Rider {email}")
    db_session.add(rider)
    db_session.flush()
    return rider


def _create_profile(
    client: TestClient, headers: dict, *, business_name: str = "Test Business"
) -> dict:
    response = client.post(
        "/api/business/profile", headers=headers, json={"business_name": business_name}
    )
    assert response.status_code == 201, response.text
    return response.json()


def _create_fleet(
    client: TestClient, headers: dict, *, fleet_code: str, name: str = "Fleet"
) -> dict:
    response = client.post(
        "/api/business/fleets", headers=headers, json={"fleet_code": fleet_code, "name": name}
    )
    assert response.status_code == 201, response.text
    return response.json()


def _create_vehicle(client: TestClient, headers: dict, *, registration_number: str) -> dict:
    response = client.post(
        "/api/business/vehicles",
        headers=headers,
        json={"registration_number": registration_number, "model_name": "Test EV"},
    )
    assert response.status_code == 201, response.text
    return response.json()


def _assign_vehicle(client: TestClient, headers: dict, *, fleet_id: str, vehicle_id: str) -> dict:
    response = client.post(
        "/api/business/assignments/vehicles",
        headers=headers,
        json={"fleet_id": fleet_id, "vehicle_id": vehicle_id},
    )
    assert response.status_code == 201, response.text
    return response.json()


def _assign_rider(client: TestClient, headers: dict, *, rider_profile_id: str) -> dict:
    response = client.post(f"/api/business/riders/{rider_profile_id}/assign", headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def _set_up_active_fleet_vehicle_and_rider(
    client: TestClient, db_session: Session, headers: dict, *, suffix: str
) -> tuple[dict, dict, dict]:
    """Returns (fleet_vehicle_assignment, rider_assignment, rider_profile_dict)."""
    fleet = _create_fleet(client, headers, fleet_code=f"FLEET-{suffix}")
    vehicle = _create_vehicle(client, headers, registration_number=f"REG-{suffix}")
    assignment = _assign_vehicle(client, headers, fleet_id=fleet["id"], vehicle_id=vehicle["id"])
    rider = _create_rider_profile(
        db_session, email=f"rider-{suffix}@example.com", phone=f"+9198810{suffix}"
    )
    rider_assignment = _assign_rider(client, headers, rider_profile_id=str(rider.id))
    return assignment, rider_assignment, {"id": str(rider.id)}


# --- access control: only BUSINESS reaches this module -----------------------


def test_business_endpoints_require_authentication(client: TestClient) -> None:
    response = client.get("/api/business/fleets")
    assert response.status_code == 401


@pytest.mark.parametrize("role_name", NON_BUSINESS_ROLES)
def test_non_business_roles_are_denied(
    client: TestClient, db_session: Session, role_name: RoleName
) -> None:
    user = make_user_with_role(
        db_session,
        role_name,
        email=f"{role_name.value.lower()}-biz@example.com",
        phone="+919944000001",
    )
    headers = {"Authorization": f"Bearer {issue_access_token(user)}"}

    response = client.get("/api/business/fleets", headers=headers)

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"


# --- profile -------------------------------------------------------------------


def test_create_profile_success(client: TestClient, db_session: Session) -> None:
    headers, _ = _business_headers(db_session, email="profile1@example.com", phone="+919944000010")

    body = _create_profile(client, headers, business_name="Acme Fleet Co")

    assert body["business_name"] == "Acme Fleet Co"
    assert body["verification_status"] == "NOT_STARTED"
    assert body["country"] == "India"


def test_create_profile_conflict_if_already_exists(client: TestClient, db_session: Session) -> None:
    headers, _ = _business_headers(db_session, email="profile2@example.com", phone="+919944000011")
    _create_profile(client, headers)

    response = client.post(
        "/api/business/profile", headers=headers, json={"business_name": "Second"}
    )

    assert response.status_code == 409


def test_get_profile_404_before_creation(client: TestClient, db_session: Session) -> None:
    headers, _ = _business_headers(db_session, email="profile3@example.com", phone="+919944000012")

    response = client.get("/api/business/profile", headers=headers)

    assert response.status_code == 404


def test_update_profile_partial(client: TestClient, db_session: Session) -> None:
    headers, _ = _business_headers(db_session, email="profile4@example.com", phone="+919944000013")
    _create_profile(client, headers, business_name="Original Co")

    response = client.patch("/api/business/profile", headers=headers, json={"city": "Bengaluru"})

    assert response.status_code == 200
    body = response.json()
    assert body["city"] == "Bengaluru"
    assert body["business_name"] == "Original Co"


# --- documents -----------------------------------------------------------------


def test_submit_document_moves_verification_to_pending(
    client: TestClient, db_session: Session
) -> None:
    headers, _ = _business_headers(db_session, email="doc1@example.com", phone="+919944000020")
    _create_profile(client, headers)

    response = client.post(
        "/api/business/documents",
        headers=headers,
        json={"document_type": "REGISTRATION_CERTIFICATE", "file_reference": "mock://cert.pdf"},
    )

    assert response.status_code == 201
    assert response.json()["status"] == "PENDING"

    profile = client.get("/api/business/profile", headers=headers).json()
    assert profile["verification_status"] == "PENDING"


def test_list_documents_only_shows_own(client: TestClient, db_session: Session) -> None:
    headers_a, _ = _business_headers(db_session, email="doc-a@example.com", phone="+919944000021")
    headers_b, _ = _business_headers(db_session, email="doc-b@example.com", phone="+919944000022")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    client.post(
        "/api/business/documents",
        headers=headers_a,
        json={"document_type": "TAX_ID", "file_reference": "mock://a.pdf"},
    )

    b_docs = client.get("/api/business/documents", headers=headers_b).json()

    assert b_docs["total"] == 0


# --- fleets ----------------------------------------------------------------------


def test_create_fleet_success(client: TestClient, db_session: Session) -> None:
    headers, _ = _business_headers(db_session, email="fleet1@example.com", phone="+919944000030")
    _create_profile(client, headers)

    fleet = _create_fleet(client, headers, fleet_code="FL-1", name="Bengaluru Fleet")

    assert fleet["fleet_code"] == "FL-1"
    assert fleet["status"] == "ACTIVE"


def test_create_fleet_duplicate_code_conflicts(client: TestClient, db_session: Session) -> None:
    headers_a, _ = _business_headers(db_session, email="fleet-a@example.com", phone="+919944000031")
    headers_b, _ = _business_headers(db_session, email="fleet-b@example.com", phone="+919944000032")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    _create_fleet(client, headers_a, fleet_code="FL-DUP")

    response = client.post(
        "/api/business/fleets", headers=headers_b, json={"fleet_code": "FL-DUP", "name": "Dup"}
    )

    assert response.status_code == 409


def test_list_fleets_only_shows_own(client: TestClient, db_session: Session) -> None:
    headers_a, _ = _business_headers(db_session, email="fleet-c@example.com", phone="+919944000033")
    headers_b, _ = _business_headers(db_session, email="fleet-d@example.com", phone="+919944000034")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    _create_fleet(client, headers_a, fleet_code="FL-C1")

    b_fleets = client.get("/api/business/fleets", headers=headers_b).json()

    assert b_fleets["total"] == 0


def test_business_a_can_view_own_fleet(client: TestClient, db_session: Session) -> None:
    """Business A -> Business A fleet = allowed."""
    headers_a, _ = _business_headers(db_session, email="fleet-e@example.com", phone="+919944000035")
    _create_profile(client, headers_a)
    fleet = _create_fleet(client, headers_a, fleet_code="FL-E1")

    response = client.get(f"/api/business/fleets/{fleet['id']}", headers=headers_a)

    assert response.status_code == 200
    assert response.json()["id"] == fleet["id"]


def test_business_a_cannot_view_business_bs_fleet(client: TestClient, db_session: Session) -> None:
    """Business A -> Business B fleet = forbidden."""
    headers_a, _ = _business_headers(db_session, email="fleet-f@example.com", phone="+919944000036")
    headers_b, _ = _business_headers(db_session, email="fleet-g@example.com", phone="+919944000037")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    fleet_b = _create_fleet(client, headers_b, fleet_code="FL-G1")

    response = client.get(f"/api/business/fleets/{fleet_b['id']}", headers=headers_a)

    assert response.status_code == 404


def test_update_own_fleet_status_toggle(client: TestClient, db_session: Session) -> None:
    headers, _ = _business_headers(db_session, email="fleet-h@example.com", phone="+919944000038")
    _create_profile(client, headers)
    fleet = _create_fleet(client, headers, fleet_code="FL-H1")

    response = client.patch(
        f"/api/business/fleets/{fleet['id']}", headers=headers, json={"status": "INACTIVE"}
    )

    assert response.status_code == 200
    assert response.json()["status"] == "INACTIVE"


def test_update_business_bs_fleet_404(client: TestClient, db_session: Session) -> None:
    headers_a, _ = _business_headers(db_session, email="fleet-i@example.com", phone="+919944000039")
    headers_b, _ = _business_headers(db_session, email="fleet-j@example.com", phone="+919944000040")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    fleet_b = _create_fleet(client, headers_b, fleet_code="FL-J1")

    response = client.patch(
        f"/api/business/fleets/{fleet_b['id']}", headers=headers_a, json={"name": "Hijacked"}
    )

    assert response.status_code == 404


# --- vehicles ----------------------------------------------------------------------


def test_create_vehicle_success(client: TestClient, db_session: Session) -> None:
    headers, _ = _business_headers(db_session, email="veh1@example.com", phone="+919944000050")
    _create_profile(client, headers)

    vehicle = _create_vehicle(client, headers, registration_number="KA-01-AA-0001")

    assert vehicle["registration_number"] == "KA-01-AA-0001"
    assert vehicle["status"] == "ACTIVE"


def test_create_vehicle_duplicate_registration_conflicts(
    client: TestClient, db_session: Session
) -> None:
    headers_a, _ = _business_headers(db_session, email="veh-a@example.com", phone="+919944000051")
    headers_b, _ = _business_headers(db_session, email="veh-b@example.com", phone="+919944000052")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    _create_vehicle(client, headers_a, registration_number="KA-01-BB-0002")

    response = client.post(
        "/api/business/vehicles",
        headers=headers_b,
        json={"registration_number": "KA-01-BB-0002", "model_name": "Other"},
    )

    assert response.status_code == 409


def test_list_vehicles_only_shows_own(client: TestClient, db_session: Session) -> None:
    headers_a, _ = _business_headers(db_session, email="veh-c@example.com", phone="+919944000053")
    headers_b, _ = _business_headers(db_session, email="veh-d@example.com", phone="+919944000054")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    _create_vehicle(client, headers_a, registration_number="KA-01-CC-0003")

    b_vehicles = client.get("/api/business/vehicles", headers=headers_b).json()

    assert b_vehicles["total"] == 0


def test_business_a_cannot_view_business_bs_vehicle(
    client: TestClient, db_session: Session
) -> None:
    """Business A -> Business B vehicle = forbidden."""
    headers_a, _ = _business_headers(db_session, email="veh-e@example.com", phone="+919944000055")
    headers_b, _ = _business_headers(db_session, email="veh-f@example.com", phone="+919944000056")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    vehicle_b = _create_vehicle(client, headers_b, registration_number="KA-01-DD-0004")

    response = client.get(f"/api/business/vehicles/{vehicle_b['id']}", headers=headers_a)

    assert response.status_code == 404


def test_update_vehicle_status(client: TestClient, db_session: Session) -> None:
    headers, _ = _business_headers(db_session, email="veh-g@example.com", phone="+919944000057")
    _create_profile(client, headers)
    vehicle = _create_vehicle(client, headers, registration_number="KA-01-EE-0005")

    response = client.patch(
        f"/api/business/vehicles/{vehicle['id']}", headers=headers, json={"status": "MAINTENANCE"}
    )

    assert response.status_code == 200
    assert response.json()["status"] == "MAINTENANCE"


# --- fleet <-> vehicle assignments -------------------------------------------------


def test_assign_vehicle_success(client: TestClient, db_session: Session) -> None:
    headers, _ = _business_headers(db_session, email="fv1@example.com", phone="+919944000060")
    _create_profile(client, headers)
    fleet = _create_fleet(client, headers, fleet_code="FV-FL-1")
    vehicle = _create_vehicle(client, headers, registration_number="KA-02-AA-0001")

    assignment = _assign_vehicle(client, headers, fleet_id=fleet["id"], vehicle_id=vehicle["id"])

    assert assignment["status"] == "ACTIVE"
    assert assignment["vehicle"]["id"] == vehicle["id"]


def test_assign_business_bs_vehicle_to_own_fleet_404(
    client: TestClient, db_session: Session
) -> None:
    """Business A -> Business B vehicle = forbidden, in the assignment context."""
    headers_a, _ = _business_headers(db_session, email="fv-a@example.com", phone="+919944000061")
    headers_b, _ = _business_headers(db_session, email="fv-b@example.com", phone="+919944000062")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    fleet_a = _create_fleet(client, headers_a, fleet_code="FV-FL-A")
    vehicle_b = _create_vehicle(client, headers_b, registration_number="KA-02-BB-0002")

    response = client.post(
        "/api/business/assignments/vehicles",
        headers=headers_a,
        json={"fleet_id": fleet_a["id"], "vehicle_id": vehicle_b["id"]},
    )

    assert response.status_code == 404


def test_assign_own_vehicle_to_business_bs_fleet_404(
    client: TestClient, db_session: Session
) -> None:
    """Business A -> Business B fleet = forbidden, in the assignment context."""
    headers_a, _ = _business_headers(db_session, email="fv-c@example.com", phone="+919944000063")
    headers_b, _ = _business_headers(db_session, email="fv-d@example.com", phone="+919944000064")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    fleet_b = _create_fleet(client, headers_b, fleet_code="FV-FL-B")
    vehicle_a = _create_vehicle(client, headers_a, registration_number="KA-02-CC-0003")

    response = client.post(
        "/api/business/assignments/vehicles",
        headers=headers_a,
        json={"fleet_id": fleet_b["id"], "vehicle_id": vehicle_a["id"]},
    )

    assert response.status_code == 404


def test_assign_already_active_vehicle_conflicts(client: TestClient, db_session: Session) -> None:
    headers, _ = _business_headers(db_session, email="fv-e@example.com", phone="+919944000065")
    _create_profile(client, headers)
    fleet1 = _create_fleet(client, headers, fleet_code="FV-FL-E1")
    fleet2 = _create_fleet(client, headers, fleet_code="FV-FL-E2")
    vehicle = _create_vehicle(client, headers, registration_number="KA-02-DD-0004")
    _assign_vehicle(client, headers, fleet_id=fleet1["id"], vehicle_id=vehicle["id"])

    response = client.post(
        "/api/business/assignments/vehicles",
        headers=headers,
        json={"fleet_id": fleet2["id"], "vehicle_id": vehicle["id"]},
    )

    assert response.status_code == 409


def test_assign_vehicle_to_inactive_fleet_conflicts(
    client: TestClient, db_session: Session
) -> None:
    headers, _ = _business_headers(db_session, email="fv-f@example.com", phone="+919944000066")
    _create_profile(client, headers)
    fleet = _create_fleet(client, headers, fleet_code="FV-FL-F")
    client.patch(
        f"/api/business/fleets/{fleet['id']}", headers=headers, json={"status": "INACTIVE"}
    )
    vehicle = _create_vehicle(client, headers, registration_number="KA-02-EE-0005")

    response = client.post(
        "/api/business/assignments/vehicles",
        headers=headers,
        json={"fleet_id": fleet["id"], "vehicle_id": vehicle["id"]},
    )

    assert response.status_code == 409


def test_unassign_vehicle_frees_it_for_reassignment(
    client: TestClient, db_session: Session
) -> None:
    headers, _ = _business_headers(db_session, email="fv-g@example.com", phone="+919944000067")
    _create_profile(client, headers)
    fleet1 = _create_fleet(client, headers, fleet_code="FV-FL-G1")
    fleet2 = _create_fleet(client, headers, fleet_code="FV-FL-G2")
    vehicle = _create_vehicle(client, headers, registration_number="KA-02-FF-0006")
    assignment = _assign_vehicle(client, headers, fleet_id=fleet1["id"], vehicle_id=vehicle["id"])

    unassign = client.post(
        f"/api/business/assignments/vehicles/{assignment['id']}/unassign", headers=headers
    )
    assert unassign.status_code == 200
    assert unassign.json()["status"] == "INACTIVE"

    reassign = client.post(
        "/api/business/assignments/vehicles",
        headers=headers,
        json={"fleet_id": fleet2["id"], "vehicle_id": vehicle["id"]},
    )
    assert reassign.status_code == 201


def test_unassign_business_bs_assignment_404(client: TestClient, db_session: Session) -> None:
    headers_a, _ = _business_headers(db_session, email="fv-h@example.com", phone="+919944000068")
    headers_b, _ = _business_headers(db_session, email="fv-i@example.com", phone="+919944000069")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    fleet_b = _create_fleet(client, headers_b, fleet_code="FV-FL-I")
    vehicle_b = _create_vehicle(client, headers_b, registration_number="KA-02-GG-0007")
    assignment_b = _assign_vehicle(
        client, headers_b, fleet_id=fleet_b["id"], vehicle_id=vehicle_b["id"]
    )

    response = client.post(
        f"/api/business/assignments/vehicles/{assignment_b['id']}/unassign", headers=headers_a
    )

    assert response.status_code == 404


def test_db_level_constraint_blocks_two_active_assignments_for_same_vehicle(
    client: TestClient, db_session: Session
) -> None:
    """Proves the partial unique index is real, not just a service-layer
    check — bypasses BusinessService entirely and inserts directly via
    the ORM.
    """
    headers, business_user = _business_headers(
        db_session, email="fv-db@example.com", phone="+919944000070"
    )
    _create_profile(client, headers)
    fleet1 = _create_fleet(client, headers, fleet_code="FV-DB-1")
    fleet2 = _create_fleet(client, headers, fleet_code="FV-DB-2")
    vehicle = _create_vehicle(client, headers, registration_number="KA-02-HH-0008")

    business = BusinessProfileRepository(db_session).get_by_user_id(business_user.id)
    assert business is not None

    now = datetime.now(UTC)
    first = FleetVehicle(
        business_profile_id=business.id,
        fleet_id=uuid.UUID(fleet1["id"]),
        vehicle_id=uuid.UUID(vehicle["id"]),
        status=FleetVehicleStatus.ACTIVE,
        assigned_at=now,
    )
    db_session.add(first)
    db_session.flush()

    second = FleetVehicle(
        business_profile_id=business.id,
        fleet_id=uuid.UUID(fleet2["id"]),
        vehicle_id=uuid.UUID(vehicle["id"]),
        status=FleetVehicleStatus.ACTIVE,
        assigned_at=now,
    )
    db_session.add(second)
    with pytest.raises(IntegrityError):
        db_session.flush()
    db_session.rollback()


# --- riders ------------------------------------------------------------------------


def test_list_eligible_riders_excludes_assigned(client: TestClient, db_session: Session) -> None:
    headers, _ = _business_headers(db_session, email="rid1@example.com", phone="+919944000080")
    _create_profile(client, headers)
    rider = _create_rider_profile(db_session, email="eligible1@example.com", phone="+919955000001")

    before = client.get("/api/business/riders/eligible", headers=headers).json()
    assert str(rider.id) in [r["id"] for r in before["items"]]

    _assign_rider(client, headers, rider_profile_id=str(rider.id))

    after = client.get("/api/business/riders/eligible", headers=headers).json()
    assert str(rider.id) not in [r["id"] for r in after["items"]]


def test_eligible_riders_never_exposes_private_fields(
    client: TestClient, db_session: Session
) -> None:
    headers, _ = _business_headers(db_session, email="rid2@example.com", phone="+919944000081")
    _create_profile(client, headers)
    _create_rider_profile(db_session, email="eligible2@example.com", phone="+919955000002")

    response = client.get("/api/business/riders/eligible", headers=headers).json()

    rider_row = response["items"][0]
    assert "date_of_birth" not in rider_row
    assert "driving_license_number" not in rider_row
    assert "address_line1" not in rider_row


def test_assign_rider_success(client: TestClient, db_session: Session) -> None:
    headers, _ = _business_headers(db_session, email="rid3@example.com", phone="+919944000082")
    _create_profile(client, headers)
    rider = _create_rider_profile(db_session, email="eligible3@example.com", phone="+919955000003")

    assignment = _assign_rider(client, headers, rider_profile_id=str(rider.id))

    assert assignment["status"] == "ACTIVE"
    assert assignment["rider"]["id"] == str(rider.id)


def test_assign_already_assigned_rider_conflicts(client: TestClient, db_session: Session) -> None:
    headers_a, _ = _business_headers(db_session, email="rid-a@example.com", phone="+919944000083")
    headers_b, _ = _business_headers(db_session, email="rid-b@example.com", phone="+919944000084")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    rider = _create_rider_profile(db_session, email="eligible4@example.com", phone="+919955000004")
    _assign_rider(client, headers_a, rider_profile_id=str(rider.id))

    response = client.post(f"/api/business/riders/{rider.id}/assign", headers=headers_b)

    assert response.status_code == 409


def test_list_rider_assignments_only_shows_own(client: TestClient, db_session: Session) -> None:
    headers_a, _ = _business_headers(db_session, email="rid-c@example.com", phone="+919944000085")
    headers_b, _ = _business_headers(db_session, email="rid-d@example.com", phone="+919944000086")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    rider = _create_rider_profile(db_session, email="eligible5@example.com", phone="+919955000005")
    _assign_rider(client, headers_a, rider_profile_id=str(rider.id))

    b_assignments = client.get("/api/business/assignments/riders", headers=headers_b).json()

    assert b_assignments["total"] == 0


def test_unassign_rider_frees_for_reassignment(client: TestClient, db_session: Session) -> None:
    headers, _ = _business_headers(db_session, email="rid-e@example.com", phone="+919944000087")
    _create_profile(client, headers)
    rider = _create_rider_profile(db_session, email="eligible6@example.com", phone="+919955000006")
    assignment = _assign_rider(client, headers, rider_profile_id=str(rider.id))

    unassign = client.post(
        f"/api/business/assignments/riders/{assignment['id']}/unassign", headers=headers
    )
    assert unassign.status_code == 200
    assert unassign.json()["status"] == "INACTIVE"

    reassign = client.post(f"/api/business/riders/{rider.id}/assign", headers=headers)
    assert reassign.status_code == 201


def test_business_a_cannot_unassign_business_bs_rider_assignment(
    client: TestClient, db_session: Session
) -> None:
    """Business A -> Business B rider = forbidden."""
    headers_a, _ = _business_headers(db_session, email="rid-f@example.com", phone="+919944000088")
    headers_b, _ = _business_headers(db_session, email="rid-g@example.com", phone="+919944000089")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    rider = _create_rider_profile(db_session, email="eligible7@example.com", phone="+919955000007")
    assignment_b = _assign_rider(client, headers_b, rider_profile_id=str(rider.id))

    response = client.post(
        f"/api/business/assignments/riders/{assignment_b['id']}/unassign", headers=headers_a
    )

    assert response.status_code == 404


# --- trips ---------------------------------------------------------------------------


def test_log_trip_success_creates_revenue(client: TestClient, db_session: Session) -> None:
    headers, _ = _business_headers(db_session, email="trip1@example.com", phone="+919944000090")
    _create_profile(client, headers)
    fleet_vehicle, rider_assignment, _ = _set_up_active_fleet_vehicle_and_rider(
        client, db_session, headers, suffix="T1"
    )

    response = client.post(
        "/api/business/trips",
        headers=headers,
        json={
            "fleet_vehicle_id": fleet_vehicle["id"],
            "rider_assignment_id": rider_assignment["id"],
            "pickup_location": "Origin",
            "dropoff_location": "Destination",
            "distance_km": "12.5",
            "revenue_amount": "450.00",
        },
    )

    assert response.status_code == 201
    trip = response.json()
    assert trip["status"] == "COMPLETED"
    assert float(trip["revenue_amount"]) == 450.0

    revenue = client.get("/api/business/revenue", headers=headers).json()
    assert revenue["total"] == 1
    assert float(revenue["items"][0]["amount"]) == 450.0


def test_log_trip_with_business_bs_fleet_vehicle_404(
    client: TestClient, db_session: Session
) -> None:
    headers_a, _ = _business_headers(db_session, email="trip-a@example.com", phone="+919944000091")
    headers_b, _ = _business_headers(db_session, email="trip-b@example.com", phone="+919944000092")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    fleet_vehicle_b, _, _ = _set_up_active_fleet_vehicle_and_rider(
        client, db_session, headers_b, suffix="TB1"
    )
    _, rider_assignment_a, _ = _set_up_active_fleet_vehicle_and_rider(
        client, db_session, headers_a, suffix="TA1"
    )

    response = client.post(
        "/api/business/trips",
        headers=headers_a,
        json={
            "fleet_vehicle_id": fleet_vehicle_b["id"],
            "rider_assignment_id": rider_assignment_a["id"],
            "pickup_location": "Origin",
            "dropoff_location": "Destination",
            "distance_km": "5.0",
            "revenue_amount": "100.00",
        },
    )

    assert response.status_code == 404


def test_log_trip_with_business_bs_rider_assignment_404(
    client: TestClient, db_session: Session
) -> None:
    headers_a, _ = _business_headers(db_session, email="trip-c@example.com", phone="+919944000093")
    headers_b, _ = _business_headers(db_session, email="trip-d@example.com", phone="+919944000094")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    fleet_vehicle_a, _, _ = _set_up_active_fleet_vehicle_and_rider(
        client, db_session, headers_a, suffix="TA2"
    )
    _, rider_assignment_b, _ = _set_up_active_fleet_vehicle_and_rider(
        client, db_session, headers_b, suffix="TB2"
    )

    response = client.post(
        "/api/business/trips",
        headers=headers_a,
        json={
            "fleet_vehicle_id": fleet_vehicle_a["id"],
            "rider_assignment_id": rider_assignment_b["id"],
            "pickup_location": "Origin",
            "dropoff_location": "Destination",
            "distance_km": "5.0",
            "revenue_amount": "100.00",
        },
    )

    assert response.status_code == 404


def test_log_trip_inactive_vehicle_assignment_conflicts(
    client: TestClient, db_session: Session
) -> None:
    headers, _ = _business_headers(db_session, email="trip-e@example.com", phone="+919944000095")
    _create_profile(client, headers)
    fleet_vehicle, rider_assignment, _ = _set_up_active_fleet_vehicle_and_rider(
        client, db_session, headers, suffix="TE1"
    )
    client.post(
        f"/api/business/assignments/vehicles/{fleet_vehicle['id']}/unassign", headers=headers
    )

    response = client.post(
        "/api/business/trips",
        headers=headers,
        json={
            "fleet_vehicle_id": fleet_vehicle["id"],
            "rider_assignment_id": rider_assignment["id"],
            "pickup_location": "Origin",
            "dropoff_location": "Destination",
            "distance_km": "5.0",
            "revenue_amount": "100.00",
        },
    )

    assert response.status_code == 409


def test_business_a_cannot_view_business_bs_trip(client: TestClient, db_session: Session) -> None:
    """Business A -> Business B trip = forbidden."""
    headers_a, _ = _business_headers(db_session, email="trip-f@example.com", phone="+919944000096")
    headers_b, _ = _business_headers(db_session, email="trip-g@example.com", phone="+919944000097")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    fleet_vehicle_b, rider_assignment_b, _ = _set_up_active_fleet_vehicle_and_rider(
        client, db_session, headers_b, suffix="TG1"
    )
    trip_b = client.post(
        "/api/business/trips",
        headers=headers_b,
        json={
            "fleet_vehicle_id": fleet_vehicle_b["id"],
            "rider_assignment_id": rider_assignment_b["id"],
            "pickup_location": "Origin",
            "dropoff_location": "Destination",
            "distance_km": "5.0",
            "revenue_amount": "100.00",
        },
    ).json()

    response = client.get(f"/api/business/trips/{trip_b['id']}", headers=headers_a)

    assert response.status_code == 404


def test_list_trips_filters(client: TestClient, db_session: Session) -> None:
    headers, _ = _business_headers(db_session, email="trip-h@example.com", phone="+919944000098")
    _create_profile(client, headers)
    fleet_vehicle, rider_assignment, _ = _set_up_active_fleet_vehicle_and_rider(
        client, db_session, headers, suffix="TH1"
    )
    trip = client.post(
        "/api/business/trips",
        headers=headers,
        json={
            "fleet_vehicle_id": fleet_vehicle["id"],
            "rider_assignment_id": rider_assignment["id"],
            "pickup_location": "Origin",
            "dropoff_location": "Destination",
            "distance_km": "20.0",
            "revenue_amount": "500.00",
        },
    ).json()

    by_vehicle = client.get(
        "/api/business/trips", headers=headers, params={"vehicle_id": trip["vehicle_id"]}
    ).json()
    assert by_vehicle["total"] == 1

    by_rider = client.get(
        "/api/business/trips", headers=headers, params={"rider_id": trip["rider_profile_id"]}
    ).json()
    assert by_rider["total"] == 1

    by_status = client.get(
        "/api/business/trips", headers=headers, params={"trip_status": "CANCELLED"}
    ).json()
    assert by_status["total"] == 0

    by_distance = client.get(
        "/api/business/trips", headers=headers, params={"min_distance": "25"}
    ).json()
    assert by_distance["total"] == 0

    by_revenue = client.get(
        "/api/business/trips", headers=headers, params={"min_revenue": "100", "max_revenue": "1000"}
    ).json()
    assert by_revenue["total"] == 1


# --- revenue -----------------------------------------------------------------------


def test_list_revenue_only_shows_own(client: TestClient, db_session: Session) -> None:
    headers_a, _ = _business_headers(db_session, email="rev-a@example.com", phone="+919944000099")
    headers_b, _ = _business_headers(db_session, email="rev-b@example.com", phone="+919944000100")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    fleet_vehicle_a, rider_assignment_a, _ = _set_up_active_fleet_vehicle_and_rider(
        client, db_session, headers_a, suffix="RA1"
    )
    client.post(
        "/api/business/trips",
        headers=headers_a,
        json={
            "fleet_vehicle_id": fleet_vehicle_a["id"],
            "rider_assignment_id": rider_assignment_a["id"],
            "pickup_location": "Origin",
            "dropoff_location": "Destination",
            "distance_km": "5.0",
            "revenue_amount": "200.00",
        },
    )

    b_revenue = client.get("/api/business/revenue", headers=headers_b).json()

    assert b_revenue["total"] == 0


# --- analytics -----------------------------------------------------------------------


def test_analytics_totals_accurate(client: TestClient, db_session: Session) -> None:
    headers, _ = _business_headers(db_session, email="an1@example.com", phone="+919944000101")
    _create_profile(client, headers)
    fleet_vehicle, rider_assignment, _ = _set_up_active_fleet_vehicle_and_rider(
        client, db_session, headers, suffix="AN1"
    )
    # A second, unassigned vehicle to prove utilization isn't just 100%.
    _create_vehicle(client, headers, registration_number="KA-03-ZZ-0001")
    client.post(
        "/api/business/trips",
        headers=headers,
        json={
            "fleet_vehicle_id": fleet_vehicle["id"],
            "rider_assignment_id": rider_assignment["id"],
            "pickup_location": "Origin",
            "dropoff_location": "Destination",
            "distance_km": "10.0",
            "revenue_amount": "300.00",
        },
    )

    analytics = client.get("/api/business/analytics", headers=headers).json()

    assert analytics["total_vehicles"] == 2
    assert analytics["active_vehicles"] == 2
    assert analytics["active_riders"] == 1
    assert analytics["total_trips"] == 1
    assert float(analytics["total_revenue"]) == 300.0
    assert float(analytics["utilization_percent"]) == 50.0
