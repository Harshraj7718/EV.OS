"""Consolidated security & RBAC regression suite. See docs/security-audit.md
for the full audit report and authorization matrix this file backs up.

This complements — does not duplicate — the per-module suites
(test_auth.py, test_rbac.py, test_admin.py, test_admin_role.py,
test_investor.py, test_rider.py, test_business.py), which already cover
role/permission matrices and per-module ownership isolation in depth.
This file adds the cross-cutting attack classes those files don't:
JWT-level forgery, a systematic role x module access sweep, request-body
ownership-field injection, and cross-module id type confusion.
"""
import base64
import itertools
import json
import uuid
from datetime import UTC, datetime, timedelta

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.roles.enums import RoleName
from tests.conftest import issue_access_token, make_user_with_role

ALL_ROLES = [
    RoleName.SUPER_ADMIN,
    RoleName.ADMIN,
    RoleName.INVESTOR,
    RoleName.RIDER,
    RoleName.BUSINESS,
]

_contact_counter = itertools.count(1)


def _unique_contact() -> tuple[str, str]:
    n = next(_contact_counter)
    return f"audit{n}@example.com", f"+9199660{n:05d}"


def _headers_for(db_session: Session, role: RoleName) -> dict:
    email, phone = _unique_contact()
    user = make_user_with_role(db_session, role, email=email, phone=phone)
    return {"Authorization": f"Bearer {issue_access_token(user)}"}


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(data: str) -> bytes:
    padded = data + "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(padded)


def _decode_claims(token: str) -> dict:
    _, payload_b64, _ = token.split(".")
    return json.loads(_b64url_decode(payload_b64))


def _tamper_payload(token: str, **overrides: object) -> str:
    """Rewrites claims in an otherwise-real token *without* re-signing —
    the original signature is kept, so this only succeeds if the backend
    fails to actually verify it.
    """
    header_b64, payload_b64, sig_b64 = token.split(".")
    claims = json.loads(_b64url_decode(payload_b64))
    claims.update(overrides)
    new_payload_b64 = _b64url_encode(json.dumps(claims).encode())
    return f"{header_b64}.{new_payload_b64}.{sig_b64}"


def _alg_none_token(claims: dict) -> str:
    header_b64 = _b64url_encode(json.dumps({"alg": "none", "typ": "JWT"}).encode())
    payload_b64 = _b64url_encode(json.dumps(claims).encode())
    return f"{header_b64}.{payload_b64}."


def _access_claims(user_id: str, *, exp_delta: timedelta, extra: dict | None = None) -> dict:
    now = datetime.now(UTC)
    claims = {
        "sub": user_id,
        "type": "access",
        "jti": str(uuid.uuid4()),
        "iat": int((now).timestamp()),
        "exp": int((now + exp_delta).timestamp()),
    }
    if extra:
        claims.update(extra)
    return claims


# =====================================================================
# 1. Authentication bypass
# =====================================================================


def test_no_authorization_header_is_401_everywhere(client: TestClient) -> None:
    paths = (
        "/api/admin/users",
        "/api/investor/opportunities",
        "/api/rider/vehicles",
        "/api/business/fleets",
    )
    for path in paths:
        response = client.get(path)
        assert response.status_code == 401, path


def test_malformed_authorization_header_is_401(client: TestClient) -> None:
    for header_value in ["NotBearer sometoken", "Bearer", "", "Basic dXNlcjpwYXNz"]:
        response = client.get(
            "/api/investor/opportunities", headers={"Authorization": header_value}
        )
        assert response.status_code == 401, header_value


def test_garbage_bearer_token_is_401(client: TestClient) -> None:
    response = client.get(
        "/api/investor/opportunities", headers={"Authorization": "Bearer not.a.jwt"}
    )
    assert response.status_code == 401


# =====================================================================
# 2. JWT manipulation
# =====================================================================


def test_token_forged_with_wrong_secret_is_rejected(
    client: TestClient, db_session: Session
) -> None:
    user = make_user_with_role(
        db_session, RoleName.SUPER_ADMIN, email="forge1@example.com", phone="+919966010001"
    )
    forged = jwt.encode(
        _access_claims(str(user.id), exp_delta=timedelta(minutes=15)),
        "attacker-controlled-secret-not-the-real-one",
        algorithm=settings.JWT_ALGORITHM,
    )
    response = client.get("/api/admin/users", headers={"Authorization": f"Bearer {forged}"})
    assert response.status_code == 401


def test_token_with_tampered_payload_is_rejected(client: TestClient, db_session: Session) -> None:
    """A real token for a RIDER, with the `sub` claim swapped to a
    SUPER_ADMIN's id post-signing — same original signature — must be
    rejected outright (signature no longer matches the payload).
    """
    rider = make_user_with_role(
        db_session, RoleName.RIDER, email="forge2@example.com", phone="+919966010002"
    )
    admin = make_user_with_role(
        db_session, RoleName.SUPER_ADMIN, email="forge3@example.com", phone="+919966010003"
    )
    real_token = issue_access_token(rider)
    tampered = _tamper_payload(real_token, sub=str(admin.id))

    response = client.get("/api/admin/users", headers={"Authorization": f"Bearer {tampered}"})
    assert response.status_code == 401


def test_token_with_alg_none_is_rejected(client: TestClient, db_session: Session) -> None:
    user = make_user_with_role(
        db_session, RoleName.SUPER_ADMIN, email="forge4@example.com", phone="+919966010004"
    )
    token = _alg_none_token(_access_claims(str(user.id), exp_delta=timedelta(minutes=15)))

    response = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_embedded_role_claim_is_never_trusted_over_the_database(
    client: TestClient, db_session: Session
) -> None:
    """The access token's `role` claim is informational only (see
    core/security.py). A RIDER whose *token* claims `role: SUPER_ADMIN`
    must still be treated as a RIDER, because authorization always
    re-derives the role from `user.role` in the database, never from the
    token payload. Signed with the real secret (a legitimate token from
    the app's own issuance path with a doctored extra claim), so this
    isolates "is the role claim trusted" from "is the signature checked".
    """
    rider = make_user_with_role(
        db_session, RoleName.RIDER, email="roleclaim1@example.com", phone="+919966010005"
    )
    claims = _access_claims(
        str(rider.id), exp_delta=timedelta(minutes=15), extra={"role": "SUPER_ADMIN"}
    )
    token = jwt.encode(claims, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    response = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403  # real role (RIDER) governs, not the claim

    own_data = client.get("/api/rider/vehicles", headers={"Authorization": f"Bearer {token}"})
    assert own_data.status_code == 200  # still works as an ordinary RIDER


# =====================================================================
# 3. Expired tokens
# =====================================================================


def test_expired_access_token_rejected(client: TestClient, db_session: Session) -> None:
    user = make_user_with_role(
        db_session, RoleName.BUSINESS, email="expired1@example.com", phone="+919966010006"
    )
    expired = jwt.encode(
        _access_claims(str(user.id), exp_delta=timedelta(minutes=-1)),
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    response = client.get("/api/business/fleets", headers={"Authorization": f"Bearer {expired}"})
    assert response.status_code == 401


# =====================================================================
# 4. Refresh token abuse
# =====================================================================


def test_refresh_token_cannot_authenticate_as_bearer_access_token(
    client: TestClient, db_session: Session
) -> None:
    register = client.post(
        "/api/auth/register",
        json={
            "name": "Refresh Abuse",
            "email": "refreshabuse@example.com",
            "phone": "+919966010007",
            "password": "Passw0rd123",
        },
    )
    assert register.status_code == 201
    refresh_token = register.json()["refresh_token"]

    response = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {refresh_token}"}
    )
    assert response.status_code == 401


def test_revoked_refresh_token_rejected_on_refresh(client: TestClient) -> None:
    register = client.post(
        "/api/auth/register",
        json={
            "name": "Revoke Abuse",
            "email": "revokeabuse@example.com",
            "phone": "+919966010008",
            "password": "Passw0rd123",
        },
    )
    refresh_token = register.json()["refresh_token"]

    logout = client.post("/api/auth/logout", json={"refresh_token": refresh_token})
    assert logout.status_code == 204

    reuse = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert reuse.status_code == 401


# =====================================================================
# 5. Role / permission manipulation via request body
# =====================================================================


def test_investor_profile_update_ignores_injected_privilege_fields(
    client: TestClient, db_session: Session
) -> None:
    headers = _headers_for(db_session, RoleName.INVESTOR)
    client.post("/api/investor/profile", headers=headers, json={"legal_name": "Real Name"})

    response = client.patch(
        "/api/investor/profile",
        headers=headers,
        json={"city": "Pune", "kyc_status": "VERIFIED", "id": str(uuid.uuid4())},
    )
    assert response.status_code == 200
    assert response.json()["kyc_status"] == "NOT_STARTED"  # untouched by the injected field


def test_rider_profile_update_ignores_injected_privilege_fields(
    client: TestClient, db_session: Session
) -> None:
    headers = _headers_for(db_session, RoleName.RIDER)
    client.post("/api/rider/profile", headers=headers, json={"legal_name": "Real Name"})

    response = client.patch(
        "/api/rider/profile",
        headers=headers,
        json={"city": "Pune", "kyc_status": "VERIFIED"},
    )
    assert response.status_code == 200
    assert response.json()["kyc_status"] == "NOT_STARTED"


def test_business_profile_update_ignores_injected_verification_status(
    client: TestClient, db_session: Session
) -> None:
    headers = _headers_for(db_session, RoleName.BUSINESS)
    client.post("/api/business/profile", headers=headers, json={"business_name": "Real Biz"})

    response = client.patch(
        "/api/business/profile",
        headers=headers,
        json={"city": "Pune", "verification_status": "VERIFIED"},
    )
    assert response.status_code == 200
    assert response.json()["verification_status"] == "NOT_STARTED"


def test_register_payload_role_field_is_ignored(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Escalation Attempt",
            "email": "escalate1@example.com",
            "phone": "+919966010009",
            "password": "Passw0rd123",
            "role": "SUPER_ADMIN",
        },
    )
    assert response.status_code == 201
    assert response.json()["user"]["role"] == "RIDER"


# =====================================================================
# 6. Permission manipulation
# =====================================================================


@pytest.mark.parametrize(
    "role", [RoleName.ADMIN, RoleName.INVESTOR, RoleName.RIDER, RoleName.BUSINESS]
)
def test_non_super_admin_cannot_grant_permissions(
    client: TestClient, db_session: Session, role: RoleName
) -> None:
    headers = _headers_for(db_session, role)
    response = client.post(
        "/api/admin/rbac/roles/RIDER/permissions/user.read", headers=headers
    )
    assert response.status_code == 403


def test_super_admin_matrix_is_immutable(client: TestClient, db_session: Session) -> None:
    headers = _headers_for(db_session, RoleName.SUPER_ADMIN)
    response = client.post(
        "/api/admin/rbac/roles/SUPER_ADMIN/permissions/user.read", headers=headers
    )
    assert response.status_code == 400


# =====================================================================
# 7. Request body ownership manipulation
# =====================================================================


def test_fleet_create_ignores_injected_business_profile_id(
    client: TestClient, db_session: Session
) -> None:
    headers_a = _headers_for(db_session, RoleName.BUSINESS)
    headers_b = _headers_for(db_session, RoleName.BUSINESS)
    client.post("/api/business/profile", headers=headers_a, json={"business_name": "Biz A"})
    client.post("/api/business/profile", headers=headers_b, json={"business_name": "Biz B"})

    foreign_business_id = str(uuid.uuid4())
    create = client.post(
        "/api/business/fleets",
        headers=headers_a,
        json={
            "fleet_code": "AUDIT-FLEET-1",
            "name": "Injected Ownership Test",
            "business_profile_id": foreign_business_id,
        },
    )
    assert create.status_code == 201

    # Only visible to A's own list — the injected id had no effect.
    a_fleets = client.get("/api/business/fleets", headers=headers_a).json()
    assert any(f["fleet_code"] == "AUDIT-FLEET-1" for f in a_fleets["items"])
    b_fleets = client.get("/api/business/fleets", headers=headers_b).json()
    assert not any(f["fleet_code"] == "AUDIT-FLEET-1" for f in b_fleets["items"])


def test_investment_create_ignores_injected_investor_profile_id(
    client: TestClient, db_session: Session
) -> None:
    from app.modules.investors.models import EVAsset

    headers_a = _headers_for(db_session, RoleName.INVESTOR)
    headers_b = _headers_for(db_session, RoleName.INVESTOR)
    client.post("/api/investor/profile", headers=headers_a, json={"legal_name": "Investor A"})
    client.post("/api/investor/profile", headers=headers_b, json={"legal_name": "Investor B"})

    asset = EVAsset(
        asset_code="AUDIT-EV-1", model_name="Audit EV", price=100000, expected_monthly_return=1000
    )
    db_session.add(asset)
    db_session.flush()

    response = client.post(
        "/api/investor/investments",
        headers=headers_a,
        json={"ev_asset_id": str(asset.id), "investor_profile_id": str(uuid.uuid4())},
    )
    assert response.status_code == 201

    a_investments = client.get("/api/investor/investments", headers=headers_a).json()
    assert a_investments["total"] == 1
    b_investments = client.get("/api/investor/investments", headers=headers_b).json()
    assert b_investments["total"] == 0


def test_booking_create_ignores_injected_rider_profile_id(
    client: TestClient, db_session: Session
) -> None:
    from app.modules.investors.enums import EVAssetStatus
    from app.modules.investors.models import EVAsset

    headers_a = _headers_for(db_session, RoleName.RIDER)
    headers_b = _headers_for(db_session, RoleName.RIDER)
    client.post("/api/rider/profile", headers=headers_a, json={"legal_name": "Rider A"})
    client.post("/api/rider/profile", headers=headers_b, json={"legal_name": "Rider B"})

    vehicle = EVAsset(
        asset_code="AUDIT-EV-2",
        model_name="Audit EV 2",
        price=100000,
        expected_monthly_return=1000,
        status=EVAssetStatus.ALLOCATED,
    )
    db_session.add(vehicle)
    db_session.flush()

    response = client.post(
        "/api/rider/bookings",
        headers=headers_a,
        json={"ev_asset_id": str(vehicle.id), "rider_profile_id": str(uuid.uuid4())},
    )
    assert response.status_code == 201

    a_bookings = client.get("/api/rider/bookings", headers=headers_a).json()
    assert a_bookings["total"] == 1
    b_bookings = client.get("/api/rider/bookings", headers=headers_b).json()
    assert b_bookings["total"] == 0


# =====================================================================
# 8. URL ID manipulation / cross-module type confusion
# =====================================================================


def test_investor_ev_asset_id_rejected_as_business_vehicle_id(
    client: TestClient, db_session: Session
) -> None:
    """A real, valid UUID from a *different table entirely* (the investor
    module's EVAsset) must not be type-confused with a business Vehicle
    id — same shape (UUID), wrong table, must 404 not 500.
    """
    from app.modules.investors.models import EVAsset

    asset = EVAsset(
        asset_code="AUDIT-EV-3", model_name="Audit EV 3", price=100000, expected_monthly_return=1000
    )
    db_session.add(asset)
    db_session.flush()

    headers = _headers_for(db_session, RoleName.BUSINESS)
    client.post("/api/business/profile", headers=headers, json={"business_name": "Audit Co"})

    response = client.get(f"/api/business/vehicles/{asset.id}", headers=headers)
    assert response.status_code == 404


@pytest.mark.parametrize(
    "path_template",
    [
        "/api/investor/investments/{id}",
        "/api/rider/bookings/{id}",
        "/api/business/fleets/{id}",
        "/api/business/vehicles/{id}",
        "/api/business/trips/{id}",
    ],
)
def test_random_uuid_on_get_by_id_is_404_not_500(
    client: TestClient, db_session: Session, path_template: str
) -> None:
    role = RoleName.BUSINESS if "business" in path_template else (
        RoleName.RIDER if "rider" in path_template else RoleName.INVESTOR
    )
    headers = _headers_for(db_session, role)
    if role == RoleName.BUSINESS:
        client.post("/api/business/profile", headers=headers, json={"business_name": "X"})
    elif role == RoleName.RIDER:
        client.post("/api/rider/profile", headers=headers, json={"legal_name": "X"})
    else:
        client.post("/api/investor/profile", headers=headers, json={"legal_name": "X"})

    response = client.get(path_template.format(id=uuid.uuid4()), headers=headers)
    assert response.status_code == 404


# =====================================================================
# 9. Systematic role x module access matrix (privilege escalation sweep)
# =====================================================================

_CANARY_ENDPOINTS: dict[str, tuple[str, set[RoleName]]] = {
    "admin": ("/api/admin/users", {RoleName.SUPER_ADMIN, RoleName.ADMIN}),
    "investor": ("/api/investor/opportunities", {RoleName.INVESTOR}),
    "rider": ("/api/rider/vehicles", {RoleName.RIDER}),
    "business": ("/api/business/fleets", {RoleName.BUSINESS}),
}


@pytest.mark.parametrize("role", ALL_ROLES)
def test_role_module_access_matrix(client: TestClient, db_session: Session, role: RoleName) -> None:
    headers = _headers_for(db_session, role)
    if role == RoleName.BUSINESS:
        # Unlike the investor/rider canaries (shared, profile-less browse
        # endpoints by design), every /api/business/* route resolves the
        # caller's own profile first — create one so the "allowed" branch
        # below gets a real 200 instead of a 404 "no profile yet".
        client.post("/api/business/profile", headers=headers, json={"business_name": "Matrix Co"})
    for module, (path, allowed_roles) in _CANARY_ENDPOINTS.items():
        response = client.get(path, headers=headers)
        if role in allowed_roles:
            assert response.status_code == 200, f"{role} should reach {module} ({path})"
        else:
            assert response.status_code == 403, f"{role} should be denied {module} ({path})"
