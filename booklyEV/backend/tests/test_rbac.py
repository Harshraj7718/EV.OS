"""Tests for the require_role / require_permission dependencies.

These mount a small throwaway FastAPI app (not the real `app`) so we can
exercise the real dependency-injection wiring end-to-end over HTTP without
adding permanent test-only routes to the production API surface. DB access
goes through the same `db_session`/`get_db` override as the rest of the
suite.
"""
import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.deps import require_permission, require_role
from app.core.database import get_db
from app.core.exceptions import register_exception_handlers
from app.modules.roles.enums import RoleName
from app.modules.users.enums import UserStatus
from app.modules.users.models import User
from tests.conftest import issue_access_token, make_user_with_role

rbac_app = FastAPI()
register_exception_handlers(rbac_app)


@rbac_app.get("/needs-permission/user-read")
def needs_user_read(user: User = Depends(require_permission("user.read"))) -> dict:
    return {"user_id": str(user.id)}


@rbac_app.get("/needs-permission/investment-create")
def needs_investment_create(user: User = Depends(require_permission("investment.create"))) -> dict:
    return {"user_id": str(user.id)}


@rbac_app.get("/needs-permission/vehicle-book")
def needs_vehicle_book(user: User = Depends(require_permission("vehicle.book"))) -> dict:
    return {"user_id": str(user.id)}


@rbac_app.get("/needs-permission/fleet-create")
def needs_fleet_create(user: User = Depends(require_permission("fleet.create"))) -> dict:
    return {"user_id": str(user.id)}


@rbac_app.get("/needs-permission/analytics-read")
def needs_analytics_read(user: User = Depends(require_permission("analytics.read"))) -> dict:
    return {"user_id": str(user.id)}


@rbac_app.get("/needs-permission/kyc-verify")
def needs_kyc_verify(user: User = Depends(require_permission("kyc.verify"))) -> dict:
    return {"user_id": str(user.id)}


@rbac_app.get("/needs-permission/nonexistent")
def needs_nonexistent_permission(
    user: User = Depends(require_permission("teleportation.activate")),
) -> dict:
    return {"user_id": str(user.id)}  # pragma: no cover — no role should ever reach this


@rbac_app.get("/needs-role/admin-or-super")
def needs_admin_role(
    user: User = Depends(require_role(RoleName.ADMIN, RoleName.SUPER_ADMIN)),
) -> dict:
    return {"user_id": str(user.id)}


@pytest.fixture()
def rbac_client(db_session: Session) -> TestClient:
    def override_get_db():
        yield db_session

    rbac_app.dependency_overrides[get_db] = override_get_db
    with TestClient(rbac_app) as test_client:
        yield test_client
    rbac_app.dependency_overrides.clear()


def _auth_headers(db_session: Session, role_name: RoleName, *, email: str, phone: str) -> dict:
    user = make_user_with_role(db_session, role_name, email=email, phone=phone)
    token = issue_access_token(user)
    return {"Authorization": f"Bearer {token}"}


# --- unauthenticated: always 401, regardless of which dependency guards the route ---


def test_unauthenticated_request_is_401_not_403(rbac_client: TestClient) -> None:
    response = rbac_client.get("/needs-permission/user-read")
    assert response.status_code == 401

    response = rbac_client.get("/needs-role/admin-or-super")
    assert response.status_code == 401


# --- SUPER_ADMIN: has every seeded permission, but not an unseeded one ---


def test_super_admin_allowed_and_denied(rbac_client: TestClient, db_session: Session) -> None:
    headers = _auth_headers(
        db_session, RoleName.SUPER_ADMIN, email="super@example.com", phone="+919800000001"
    )

    allowed = rbac_client.get("/needs-permission/kyc-verify", headers=headers)
    assert allowed.status_code == 200

    allowed_role = rbac_client.get("/needs-role/admin-or-super", headers=headers)
    assert allowed_role.status_code == 200

    # Not a real permission at all — even SUPER_ADMIN can't have what was never seeded.
    denied = rbac_client.get("/needs-permission/nonexistent", headers=headers)
    assert denied.status_code == 403


# --- ADMIN: broad operational access, but not customer-side transactions ---


def test_admin_allowed_and_denied(rbac_client: TestClient, db_session: Session) -> None:
    headers = _auth_headers(
        db_session, RoleName.ADMIN, email="admin@example.com", phone="+919800000002"
    )

    allowed = rbac_client.get("/needs-permission/user-read", headers=headers)
    assert allowed.status_code == 200

    allowed_role = rbac_client.get("/needs-role/admin-or-super", headers=headers)
    assert allowed_role.status_code == 200

    denied = rbac_client.get("/needs-permission/investment-create", headers=headers)
    assert denied.status_code == 403


# --- INVESTOR: can manage investments, can't manage other users ---


def test_investor_allowed_and_denied(rbac_client: TestClient, db_session: Session) -> None:
    headers = _auth_headers(
        db_session, RoleName.INVESTOR, email="investor@example.com", phone="+919800000003"
    )

    allowed = rbac_client.get("/needs-permission/investment-create", headers=headers)
    assert allowed.status_code == 200

    denied = rbac_client.get("/needs-permission/user-read", headers=headers)
    assert denied.status_code == 403

    denied_role = rbac_client.get("/needs-role/admin-or-super", headers=headers)
    assert denied_role.status_code == 403


# --- RIDER: can book vehicles, can't see platform analytics ---


def test_rider_allowed_and_denied(rbac_client: TestClient, db_session: Session) -> None:
    headers = _auth_headers(
        db_session, RoleName.RIDER, email="rider@example.com", phone="+919800000004"
    )

    allowed = rbac_client.get("/needs-permission/vehicle-book", headers=headers)
    assert allowed.status_code == 200

    denied = rbac_client.get("/needs-permission/analytics-read", headers=headers)
    assert denied.status_code == 403

    denied_role = rbac_client.get("/needs-role/admin-or-super", headers=headers)
    assert denied_role.status_code == 403


# --- BUSINESS: can manage their fleet, can't manage investments ---


def test_business_allowed_and_denied(rbac_client: TestClient, db_session: Session) -> None:
    headers = _auth_headers(
        db_session, RoleName.BUSINESS, email="business@example.com", phone="+919800000005"
    )

    allowed = rbac_client.get("/needs-permission/fleet-create", headers=headers)
    assert allowed.status_code == 200

    denied = rbac_client.get("/needs-permission/investment-create", headers=headers)
    assert denied.status_code == 403

    denied_role = rbac_client.get("/needs-role/admin-or-super", headers=headers)
    assert denied_role.status_code == 403


# --- suspended account: authenticates (valid token) but is still rejected ---


def test_suspended_user_is_forbidden_not_unauthorized(
    rbac_client: TestClient, db_session: Session
) -> None:
    user = make_user_with_role(
        db_session,
        RoleName.ADMIN,
        email="suspended-admin@example.com",
        phone="+919800000006",
        status=UserStatus.SUSPENDED,
    )
    token = issue_access_token(user)

    response = rbac_client.get(
        "/needs-permission/user-read", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 403
