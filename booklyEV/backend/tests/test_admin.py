import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.roles.enums import RoleName
from tests.conftest import TEST_PASSWORD, issue_access_token, make_user_with_role

NON_SUPER_ADMIN_ROLES = [RoleName.ADMIN, RoleName.INVESTOR, RoleName.RIDER, RoleName.BUSINESS]


def _headers_for(db_session: Session, role_name: RoleName, *, email: str, phone: str) -> dict:
    user = make_user_with_role(db_session, role_name, email=email, phone=phone)
    token = issue_access_token(user)
    return {"Authorization": f"Bearer {token}"}


def _super_admin_headers(
    db_session: Session, *, email: str = "super1@example.com", phone: str = "+919900000001"
) -> dict:
    return _headers_for(db_session, RoleName.SUPER_ADMIN, email=email, phone=phone)


# --- access control: the core requirement -----------------------------------


def test_admin_endpoints_require_authentication(client: TestClient) -> None:
    response = client.get("/api/admin/users")
    assert response.status_code == 401


@pytest.mark.parametrize("role_name", NON_SUPER_ADMIN_ROLES)
def test_non_super_admin_roles_are_denied_on_super_admin_exclusive_routes(
    client: TestClient, db_session: Session, role_name: RoleName
) -> None:
    """GET /users is now permission-gated (ADMIN can reach it — see
    test_admin_role.py) but /settings stays SUPER_ADMIN-exclusive
    regardless of role, so it's the right probe for "is anyone other
    than SUPER_ADMIN locked out of this route" including ADMIN itself.
    """
    headers = _headers_for(
        db_session, role_name, email=f"{role_name.value.lower()}@example.com", phone="+919900000010"
    )

    response = client.get("/api/admin/settings", headers=headers)

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"


def test_super_admin_is_allowed(client: TestClient, db_session: Session) -> None:
    headers = _super_admin_headers(db_session)

    response = client.get("/api/admin/users", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert "items" in body and "total" in body


# --- user management -----------------------------------------------------------


def test_super_admin_can_create_user_with_any_role(client: TestClient, db_session: Session) -> None:
    headers = _super_admin_headers(db_session)

    response = client.post(
        "/api/admin/users",
        headers=headers,
        json={
            "name": "New Business Owner",
            "email": "newbiz@example.com",
            "phone": "+919900000020",
            "password": TEST_PASSWORD,
            "role": "BUSINESS",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["role"] == "BUSINESS"
    assert "password" not in body
    assert "password_hash" not in body


def test_create_user_duplicate_email_conflict(client: TestClient, db_session: Session) -> None:
    headers = _super_admin_headers(db_session)
    payload = {
        "name": "Dupe",
        "email": "dupe-admin@example.com",
        "phone": "+919900000021",
        "password": TEST_PASSWORD,
        "role": "RIDER",
    }
    first = client.post("/api/admin/users", headers=headers, json=payload)
    assert first.status_code == 201

    payload["phone"] = "+919900000022"
    second = client.post("/api/admin/users", headers=headers, json=payload)
    assert second.status_code == 409


def test_create_user_rejects_invalid_phone(client: TestClient, db_session: Session) -> None:
    headers = _super_admin_headers(db_session)

    response = client.post(
        "/api/admin/users",
        headers=headers,
        json={
            "name": "Bad Phone",
            "email": "badphone-admin@example.com",
            "phone": "9900000023",
            "password": TEST_PASSWORD,
            "role": "RIDER",
        },
    )

    assert response.status_code == 422


def test_suspend_and_activate_user(client: TestClient, db_session: Session) -> None:
    headers = _super_admin_headers(db_session)
    target = make_user_with_role(
        db_session, RoleName.RIDER, email="target@example.com", phone="+919900000030"
    )

    suspend = client.post(f"/api/admin/users/{target.id}/suspend", headers=headers)
    assert suspend.status_code == 200
    assert suspend.json()["status"] == "SUSPENDED"

    activate = client.post(f"/api/admin/users/{target.id}/activate", headers=headers)
    assert activate.status_code == 200
    assert activate.json()["status"] == "ACTIVE"


def test_assign_role_changes_user_role(client: TestClient, db_session: Session) -> None:
    headers = _super_admin_headers(db_session)
    target = make_user_with_role(
        db_session, RoleName.RIDER, email="promote@example.com", phone="+919900000031"
    )

    response = client.post(
        f"/api/admin/users/{target.id}/role", headers=headers, json={"role": "BUSINESS"}
    )

    assert response.status_code == 200
    assert response.json()["role"] == "BUSINESS"


# --- last-SUPER_ADMIN guard --------------------------------------------------


def test_cannot_suspend_the_last_active_super_admin(
    client: TestClient, db_session: Session
) -> None:
    actor = make_user_with_role(
        db_session, RoleName.SUPER_ADMIN, email="onlysuper@example.com", phone="+919900000040"
    )
    headers = {"Authorization": f"Bearer {issue_access_token(actor)}"}

    response = client.post(f"/api/admin/users/{actor.id}/suspend", headers=headers)

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "last_super_admin"


def test_cannot_reassign_role_of_last_active_super_admin(
    client: TestClient, db_session: Session
) -> None:
    actor = make_user_with_role(
        db_session, RoleName.SUPER_ADMIN, email="onlysuper2@example.com", phone="+919900000041"
    )
    headers = {"Authorization": f"Bearer {issue_access_token(actor)}"}

    response = client.post(
        f"/api/admin/users/{actor.id}/role", headers=headers, json={"role": "ADMIN"}
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "last_super_admin"


def test_can_suspend_a_super_admin_when_not_the_last_one(
    client: TestClient, db_session: Session
) -> None:
    actor = make_user_with_role(
        db_session, RoleName.SUPER_ADMIN, email="super-a@example.com", phone="+919900000042"
    )
    other = make_user_with_role(
        db_session, RoleName.SUPER_ADMIN, email="super-b@example.com", phone="+919900000043"
    )
    headers = {"Authorization": f"Bearer {issue_access_token(actor)}"}

    response = client.post(f"/api/admin/users/{other.id}/suspend", headers=headers)

    assert response.status_code == 200
    assert response.json()["status"] == "SUSPENDED"


# --- audit logging --------------------------------------------------------------


def test_sensitive_actions_are_audit_logged(client: TestClient, db_session: Session) -> None:
    headers = _super_admin_headers(db_session, email="auditor@example.com", phone="+919900000050")
    target = make_user_with_role(
        db_session, RoleName.RIDER, email="audited@example.com", phone="+919900000051"
    )

    client.post(f"/api/admin/users/{target.id}/suspend", headers=headers)

    logs = client.get("/api/admin/audit-logs", headers=headers, params={"action": "user.suspend"})
    assert logs.status_code == 200
    body = logs.json()
    assert body["total"] >= 1
    entry = body["items"][0]
    assert entry["action"] == "user.suspend"
    assert entry["target_type"] == "user"
    assert entry["target_id"] == str(target.id)


# --- roles & permissions matrix -----------------------------------------------


def test_rbac_matrix_reflects_seeded_counts(client: TestClient, db_session: Session) -> None:
    headers = _super_admin_headers(
        db_session, email="matrix-viewer@example.com", phone="+919900000060"
    )

    response = client.get("/api/admin/rbac/matrix", headers=headers)

    assert response.status_code == 200
    matrix = response.json()["matrix"]
    assert len(matrix["SUPER_ADMIN"]) == 22
    assert len(matrix["ADMIN"]) == 12
    assert len(matrix["INVESTOR"]) == 10
    assert len(matrix["RIDER"]) == 9
    assert len(matrix["BUSINESS"]) == 15


def test_rbac_grant_and_revoke_permission(client: TestClient, db_session: Session) -> None:
    headers = _super_admin_headers(
        db_session, email="matrix-editor@example.com", phone="+919900000061"
    )

    grant = client.post("/api/admin/rbac/roles/RIDER/permissions/analytics.read", headers=headers)
    assert grant.status_code == 204

    matrix_after_grant = client.get("/api/admin/rbac/matrix", headers=headers).json()["matrix"]
    assert "analytics.read" in matrix_after_grant["RIDER"]

    revoke = client.delete(
        "/api/admin/rbac/roles/RIDER/permissions/analytics.read", headers=headers
    )
    assert revoke.status_code == 204

    matrix_after_revoke = client.get("/api/admin/rbac/matrix", headers=headers).json()["matrix"]
    assert "analytics.read" not in matrix_after_revoke["RIDER"]


def test_rbac_cannot_edit_super_admin_matrix(client: TestClient, db_session: Session) -> None:
    headers = _super_admin_headers(
        db_session, email="matrix-guard@example.com", phone="+919900000062"
    )

    response = client.post(
        "/api/admin/rbac/roles/SUPER_ADMIN/permissions/kyc.verify", headers=headers
    )

    assert response.status_code == 400


# --- stakeholder filtered views -----------------------------------------------


def test_investor_rider_business_views_are_filtered(
    client: TestClient, db_session: Session
) -> None:
    headers = _super_admin_headers(db_session, email="views@example.com", phone="+919900000070")
    make_user_with_role(
        db_session, RoleName.INVESTOR, email="only-investor@example.com", phone="+919900000071"
    )
    make_user_with_role(
        db_session, RoleName.RIDER, email="only-rider@example.com", phone="+919900000072"
    )

    investors = client.get("/api/admin/investors", headers=headers).json()
    assert all(item["role"] == "INVESTOR" for item in investors["items"])
    assert any(item["email"] == "only-investor@example.com" for item in investors["items"])
    assert not any(item["email"] == "only-rider@example.com" for item in investors["items"])


# --- analytics & settings -------------------------------------------------------


def test_analytics_overview_reflects_real_data(client: TestClient, db_session: Session) -> None:
    headers = _super_admin_headers(
        db_session, email="analytics-viewer@example.com", phone="+919900000080"
    )
    make_user_with_role(
        db_session, RoleName.RIDER, email="counted-rider@example.com", phone="+919900000081"
    )

    response = client.get("/api/admin/analytics/overview", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total_users"] >= 2  # actor + the rider just created
    assert body["users_by_role"]["RIDER"] >= 1
    assert body["total_permissions"] == 22


def test_settings_endpoint_never_exposes_secrets(client: TestClient, db_session: Session) -> None:
    headers = _super_admin_headers(
        db_session, email="settings-viewer@example.com", phone="+919900000090"
    )

    response = client.get("/api/admin/settings", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert "secret_key" not in body
    assert "database_url" not in body
    assert body["app_name"] == "booklynk-ev"
