"""ADMIN operational role: every granted capability, every explicit
restriction, and adversarial privilege-escalation attempts.

See docs/admin.md ("ADMIN operational role") for the full capability
list this file verifies against.
"""
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.roles.enums import RoleName
from tests.conftest import issue_access_token, make_user_with_role

ADMIN_PERMISSION_CODES = {
    "user.read",
    "user.update",
    "user.suspend",
    "vehicle.read",
    "vehicle.update",
    "fleet.read",
    "trip.read",
    "trip.update",
    "payment.read",
    "analytics.read",
    "kyc.read",
    "kyc.verify",
}


def _headers_for(db_session: Session, role_name: RoleName, *, email: str, phone: str) -> dict:
    user = make_user_with_role(db_session, role_name, email=email, phone=phone)
    return {"Authorization": f"Bearer {issue_access_token(user)}"}, user


def _admin_headers(db_session: Session, *, email: str, phone: str) -> dict:
    headers, _ = _headers_for(db_session, RoleName.ADMIN, email=email, phone=phone)
    return headers


# --- exact permission set: "test every permission" --------------------------


def test_admin_permission_set_matches_the_operational_spec(
    client: TestClient, db_session: Session
) -> None:
    headers, _ = _headers_for(
        db_session, RoleName.SUPER_ADMIN, email="verifier@example.com", phone="+919911100001"
    )

    matrix = client.get("/api/admin/rbac/matrix", headers=headers).json()["matrix"]

    assert set(matrix["ADMIN"]) == ADMIN_PERMISSION_CODES


# --- allowed: every capability ADMIN was granted -----------------------------


def test_admin_can_view_users(client: TestClient, db_session: Session) -> None:
    headers = _admin_headers(db_session, email="ops1@example.com", phone="+919911100010")
    response = client.get("/api/admin/users", headers=headers)
    assert response.status_code == 200


def test_admin_can_update_a_non_super_admin_user(client: TestClient, db_session: Session) -> None:
    headers = _admin_headers(db_session, email="ops2@example.com", phone="+919911100011")
    target = make_user_with_role(
        db_session, RoleName.RIDER, email="rider-target@example.com", phone="+919911100012"
    )

    response = client.patch(
        f"/api/admin/users/{target.id}", headers=headers, json={"name": "Updated Name"}
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"


def test_admin_can_suspend_a_non_super_admin_user(client: TestClient, db_session: Session) -> None:
    headers = _admin_headers(db_session, email="ops3@example.com", phone="+919911100013")
    target = make_user_with_role(
        db_session, RoleName.RIDER, email="rider-suspend@example.com", phone="+919911100014"
    )

    response = client.post(f"/api/admin/users/{target.id}/suspend", headers=headers)

    assert response.status_code == 200
    assert response.json()["status"] == "SUSPENDED"


def test_admin_can_suspend_another_admin(client: TestClient, db_session: Session) -> None:
    """The SUPER_ADMIN-target guard is scoped to SUPER_ADMIN only —
    ADMIN managing another ADMIN account is a legitimate ops action
    (e.g. offboarding), not a restricted one.
    """
    headers = _admin_headers(db_session, email="ops4@example.com", phone="+919911100015")
    other_admin = make_user_with_role(
        db_session, RoleName.ADMIN, email="other-admin@example.com", phone="+919911100016"
    )

    response = client.post(f"/api/admin/users/{other_admin.id}/suspend", headers=headers)

    assert response.status_code == 200


def test_admin_can_view_investors_riders_businesses(
    client: TestClient, db_session: Session
) -> None:
    headers = _admin_headers(db_session, email="ops5@example.com", phone="+919911100017")

    for path in ("/api/admin/investors", "/api/admin/riders", "/api/admin/businesses"):
        response = client.get(path, headers=headers)
        assert response.status_code == 200, path


def test_admin_can_view_analytics(client: TestClient, db_session: Session) -> None:
    headers = _admin_headers(db_session, email="ops6@example.com", phone="+919911100018")
    response = client.get("/api/admin/analytics/overview", headers=headers)
    assert response.status_code == 200


# --- denied: everything explicitly out of scope ------------------------------


def test_admin_cannot_create_users(client: TestClient, db_session: Session) -> None:
    headers = _admin_headers(db_session, email="ops7@example.com", phone="+919911100020")

    response = client.post(
        "/api/admin/users",
        headers=headers,
        json={
            "name": "New Rider",
            "email": "created-by-admin@example.com",
            "phone": "+919911100021",
            "password": "Passw0rd123",
            "role": "RIDER",
        },
    )

    assert response.status_code == 403


def test_admin_cannot_activate_users(client: TestClient, db_session: Session) -> None:
    headers = _admin_headers(db_session, email="ops8@example.com", phone="+919911100022")
    target = make_user_with_role(
        db_session, RoleName.RIDER, email="to-activate@example.com", phone="+919911100023"
    )

    response = client.post(f"/api/admin/users/{target.id}/activate", headers=headers)

    assert response.status_code == 403


def test_admin_cannot_view_or_modify_rbac(client: TestClient, db_session: Session) -> None:
    headers = _admin_headers(db_session, email="ops9@example.com", phone="+919911100024")

    assert client.get("/api/admin/roles", headers=headers).status_code == 403
    assert client.get("/api/admin/permissions", headers=headers).status_code == 403
    assert client.get("/api/admin/rbac/matrix", headers=headers).status_code == 403
    assert (
        client.post(
            "/api/admin/rbac/roles/RIDER/permissions/analytics.read", headers=headers
        ).status_code
        == 403
    )
    assert (
        client.delete(
            "/api/admin/rbac/roles/RIDER/permissions/vehicle.read", headers=headers
        ).status_code
        == 403
    )


def test_admin_cannot_view_audit_logs(client: TestClient, db_session: Session) -> None:
    headers = _admin_headers(db_session, email="ops10@example.com", phone="+919911100025")
    response = client.get("/api/admin/audit-logs", headers=headers)
    assert response.status_code == 403


def test_admin_cannot_view_settings(client: TestClient, db_session: Session) -> None:
    """'Access security secrets' — Settings is out of ADMIN's scope even
    though the payload itself contains no secrets; the restriction is on
    the surface, not just the data.
    """
    headers = _admin_headers(db_session, email="ops11@example.com", phone="+919911100026")
    response = client.get("/api/admin/settings", headers=headers)
    assert response.status_code == 403


# --- privilege escalation attempts -------------------------------------------


def test_admin_cannot_update_a_super_admin_account(client: TestClient, db_session: Session) -> None:
    headers = _admin_headers(db_session, email="esc1@example.com", phone="+919911100030")
    super_admin_target = make_user_with_role(
        db_session, RoleName.SUPER_ADMIN, email="target-super@example.com", phone="+919911100031"
    )

    response = client.patch(
        f"/api/admin/users/{super_admin_target.id}", headers=headers, json={"name": "Hijacked"}
    )

    assert response.status_code == 403


def test_admin_cannot_suspend_a_super_admin_account(
    client: TestClient, db_session: Session
) -> None:
    headers = _admin_headers(db_session, email="esc2@example.com", phone="+919911100032")
    super_admin_target = make_user_with_role(
        db_session, RoleName.SUPER_ADMIN, email="target-super2@example.com", phone="+919911100033"
    )

    response = client.post(
        f"/api/admin/users/{super_admin_target.id}/suspend", headers=headers
    )

    assert response.status_code == 403


def test_admin_cannot_assign_super_admin_role_to_self(
    client: TestClient, db_session: Session
) -> None:
    headers, admin_user = _headers_for(
        db_session, RoleName.ADMIN, email="esc3@example.com", phone="+919911100034"
    )

    response = client.post(
        f"/api/admin/users/{admin_user.id}/role", headers=headers, json={"role": "SUPER_ADMIN"}
    )

    assert response.status_code == 403


def test_admin_cannot_assign_super_admin_role_to_another_user(
    client: TestClient, db_session: Session
) -> None:
    headers = _admin_headers(db_session, email="esc4@example.com", phone="+919911100035")
    other = make_user_with_role(
        db_session, RoleName.RIDER, email="escalation-victim@example.com", phone="+919911100036"
    )

    response = client.post(
        f"/api/admin/users/{other.id}/role", headers=headers, json={"role": "SUPER_ADMIN"}
    )

    assert response.status_code == 403
    # Confirm the attempt had zero effect — not just rejected in transit.
    unchanged = client.get(
        f"/api/admin/users/{other.id}",
        headers=_admin_headers(db_session, email="verify-esc4@example.com", phone="+919911100037"),
    )
    assert unchanged.json()["role"] == "RIDER"


def test_admin_cannot_create_a_super_admin_account(client: TestClient, db_session: Session) -> None:
    headers = _admin_headers(db_session, email="esc5@example.com", phone="+919911100038")

    response = client.post(
        "/api/admin/users",
        headers=headers,
        json={
            "name": "Backdoor Super Admin",
            "email": "backdoor@example.com",
            "phone": "+919911100039",
            "password": "Passw0rd123",
            "role": "SUPER_ADMIN",
        },
    )

    assert response.status_code == 403


def test_admin_cannot_grant_itself_additional_permissions(
    client: TestClient, db_session: Session
) -> None:
    """The RBAC endpoints are SUPER_ADMIN-only, so ADMIN can't grant its
    own role a permission it currently lacks (e.g. user.create) to widen
    its own access.
    """
    headers = _admin_headers(db_session, email="esc6@example.com", phone="+919911100040")

    response = client.post(
        "/api/admin/rbac/roles/ADMIN/permissions/user.create", headers=headers
    )

    assert response.status_code == 403

    verify_headers, _ = _headers_for(
        db_session, RoleName.SUPER_ADMIN, email="verify-esc6@example.com", phone="+919911100041"
    )
    matrix = client.get("/api/admin/rbac/matrix", headers=verify_headers).json()["matrix"]
    assert "user.create" not in matrix["ADMIN"]
