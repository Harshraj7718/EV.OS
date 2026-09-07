from fastapi.testclient import TestClient


def test_health_check_returns_ok(client: TestClient) -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "booklynk-ev"}


def test_health_check_content_type_is_json(client: TestClient) -> None:
    response = client.get("/api/health")

    assert response.headers["content-type"].startswith("application/json")
