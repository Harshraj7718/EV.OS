from datetime import UTC, datetime, timedelta

import jwt
from fastapi.testclient import TestClient

from app.core.config import settings

VALID_PASSWORD = "Passw0rd123"


def _register_payload(*, email: str = "rider@example.com", phone: str = "+919876543210") -> dict:
    return {
        "name": "Test Rider",
        "email": email,
        "phone": phone,
        "password": VALID_PASSWORD,
    }


def _register(client: TestClient, **overrides) -> dict:
    payload = _register_payload(**overrides)
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


# --- registration ---------------------------------------------------------


def test_register_success(client: TestClient) -> None:
    body = _register(client)

    assert body["user"]["email"] == "rider@example.com"
    assert body["user"]["role"] == "RIDER"
    assert body["user"]["status"] == "ACTIVE"
    assert body["user"]["is_verified"] is False
    assert "password" not in body["user"]
    assert "password_hash" not in body["user"]
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["expires_in"] == settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


def test_register_rejects_client_supplied_role(client: TestClient) -> None:
    payload = _register_payload()
    payload["role"] = "ADMIN"  # ignored — RegisterRequest has no such field
    response = client.post("/api/auth/register", json=payload)

    assert response.status_code == 201
    assert response.json()["user"]["role"] == "RIDER"


def test_register_duplicate_email_rejected(client: TestClient) -> None:
    _register(client, email="dupe@example.com", phone="+919876543211")

    response = client.post(
        "/api/auth/register",
        json=_register_payload(email="dupe@example.com", phone="+919876543212"),
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "conflict"


def test_register_duplicate_phone_rejected(client: TestClient) -> None:
    _register(client, email="first@example.com", phone="+919876543213")

    response = client.post(
        "/api/auth/register",
        json=_register_payload(email="second@example.com", phone="+919876543213"),
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "conflict"


def test_register_rejects_weak_password(client: TestClient) -> None:
    payload = _register_payload(email="weak@example.com", phone="+919876543214")
    payload["password"] = "short1"

    response = client.post("/api/auth/register", json=payload)

    assert response.status_code == 422


def test_register_rejects_invalid_email(client: TestClient) -> None:
    payload = _register_payload(phone="+919876543215")
    payload["email"] = "not-an-email"

    response = client.post("/api/auth/register", json=payload)

    assert response.status_code == 422


def test_register_rejects_invalid_phone(client: TestClient) -> None:
    payload = _register_payload(email="badphone@example.com")
    payload["phone"] = "9876543210"  # missing leading '+'

    response = client.post("/api/auth/register", json=payload)

    assert response.status_code == 422


# --- login -----------------------------------------------------------------


def test_login_success(client: TestClient) -> None:
    _register(client, email="login@example.com", phone="+919876543220")

    response = client.post(
        "/api/auth/login", json={"email": "login@example.com", "password": VALID_PASSWORD}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == "login@example.com"
    assert body["access_token"]
    assert body["refresh_token"]


def test_login_wrong_password(client: TestClient) -> None:
    _register(client, email="wrongpw@example.com", phone="+919876543221")

    response = client.post(
        "/api/auth/login", json={"email": "wrongpw@example.com", "password": "WrongPass1"}
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


def test_login_unknown_email(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login", json={"email": "nobody@example.com", "password": VALID_PASSWORD}
    )

    assert response.status_code == 401


# --- protected endpoint / tokens -------------------------------------------


def test_me_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_me_with_valid_access_token(client: TestClient) -> None:
    tokens = _register(client, email="me@example.com", phone="+919876543230")

    response = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )

    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"


def test_me_with_invalid_token(client: TestClient) -> None:
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-valid-jwt"})

    assert response.status_code == 401


def test_me_with_expired_token(client: TestClient) -> None:
    tokens = _register(client, email="expired@example.com", phone="+919876543231")
    claims = jwt.decode(
        tokens["access_token"], settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
    )
    expired_token = jwt.encode(
        {
            **claims,
            "iat": datetime.now(UTC) - timedelta(hours=2),
            "exp": datetime.now(UTC) - timedelta(hours=1),
        },
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

    response = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"}
    )

    assert response.status_code == 401


def test_me_rejects_refresh_token_as_access_token(client: TestClient) -> None:
    tokens = _register(client, email="wrongtype@example.com", phone="+919876543232")

    response = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {tokens['refresh_token']}"}
    )

    assert response.status_code == 401


# --- refresh -----------------------------------------------------------------


def test_refresh_token_rotates_and_returns_new_pair(client: TestClient) -> None:
    tokens = _register(client, email="refresh@example.com", phone="+919876543240")

    response = client.post("/api/auth/refresh", json={"refresh_token": tokens["refresh_token"]})

    assert response.status_code == 200
    new_tokens = response.json()
    assert new_tokens["access_token"] != tokens["access_token"]
    assert new_tokens["refresh_token"] != tokens["refresh_token"]


def test_refresh_token_reuse_is_rejected(client: TestClient) -> None:
    tokens = _register(client, email="reuse@example.com", phone="+919876543241")

    first = client.post("/api/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert first.status_code == 200

    # Reusing the now-rotated-away refresh token must fail.
    second = client.post("/api/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert second.status_code == 401


def test_refresh_with_invalid_token(client: TestClient) -> None:
    response = client.post("/api/auth/refresh", json={"refresh_token": "garbage"})

    assert response.status_code == 401


def test_refresh_with_access_token_rejected(client: TestClient) -> None:
    tokens = _register(client, email="accessasrefresh@example.com", phone="+919876543242")

    response = client.post("/api/auth/refresh", json={"refresh_token": tokens["access_token"]})

    assert response.status_code == 401


# --- logout ------------------------------------------------------------------


def test_logout_revokes_refresh_token(client: TestClient) -> None:
    tokens = _register(client, email="logout@example.com", phone="+919876543250")

    logout_response = client.post(
        "/api/auth/logout", json={"refresh_token": tokens["refresh_token"]}
    )
    assert logout_response.status_code == 204

    refresh_response = client.post(
        "/api/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert refresh_response.status_code == 401


def test_logout_is_idempotent_for_unknown_token(client: TestClient) -> None:
    response = client.post("/api/auth/logout", json={"refresh_token": "garbage"})

    assert response.status_code == 204


# --- change password -----------------------------------------------------------


def test_change_password_success(client: TestClient) -> None:
    tokens = _register(client, email="changepw@example.com", phone="+919876543260")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    response = client.post(
        "/api/auth/change-password",
        headers=headers,
        json={"current_password": VALID_PASSWORD, "new_password": "NewPassw0rd1"},
    )
    assert response.status_code == 204

    old_login = client.post(
        "/api/auth/login", json={"email": "changepw@example.com", "password": VALID_PASSWORD}
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/api/auth/login", json={"email": "changepw@example.com", "password": "NewPassw0rd1"}
    )
    assert new_login.status_code == 200


def test_change_password_wrong_current_password(client: TestClient) -> None:
    tokens = _register(client, email="wrongcurrent@example.com", phone="+919876543261")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    response = client.post(
        "/api/auth/change-password",
        headers=headers,
        json={"current_password": "NotTheRightPass1", "new_password": "NewPassw0rd1"},
    )

    assert response.status_code == 400


def test_change_password_revokes_existing_refresh_tokens(client: TestClient) -> None:
    tokens = _register(client, email="revokeall@example.com", phone="+919876543262")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    client.post(
        "/api/auth/change-password",
        headers=headers,
        json={"current_password": VALID_PASSWORD, "new_password": "NewPassw0rd1"},
    )

    refresh_response = client.post(
        "/api/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert refresh_response.status_code == 401


def test_change_password_requires_authentication(client: TestClient) -> None:
    response = client.post(
        "/api/auth/change-password",
        json={"current_password": VALID_PASSWORD, "new_password": "NewPassw0rd1"},
    )

    assert response.status_code == 401
