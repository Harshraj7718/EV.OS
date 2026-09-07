"""Investor module: every endpoint, and — the core requirement — proof
that Investor A can never reach Investor B's data, even when handed B's
own resource ids to try.
"""
import uuid
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.investors.models import EVAsset
from app.modules.investors.service import InvestorService
from app.modules.roles.enums import RoleName
from app.modules.users.models import User
from tests.conftest import issue_access_token, make_user_with_role

NON_INVESTOR_ROLES = [RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.RIDER, RoleName.BUSINESS]


def _investor_headers(db_session: Session, *, email: str, phone: str) -> tuple[dict, User]:
    user = make_user_with_role(db_session, RoleName.INVESTOR, email=email, phone=phone)
    return {"Authorization": f"Bearer {issue_access_token(user)}"}, user


def _create_asset(db_session: Session, *, asset_code: str) -> EVAsset:
    asset = EVAsset(
        asset_code=asset_code,
        model_name="Test EV",
        price=100000,
        expected_monthly_return=1500,
    )
    db_session.add(asset)
    db_session.flush()
    return asset


def _create_profile(
    client: TestClient, headers: dict, *, legal_name: str = "Test Investor"
) -> dict:
    response = client.post(
        "/api/investor/profile",
        headers=headers,
        json={"legal_name": legal_name, "country": "India"},
    )
    assert response.status_code == 201, response.text
    return response.json()


def _invest(client: TestClient, headers: dict, asset_id: str) -> dict:
    response = client.post(
        "/api/investor/investments", headers=headers, json={"ev_asset_id": asset_id}
    )
    assert response.status_code == 201, response.text
    return response.json()


# --- access control: only INVESTOR reaches this module -----------------------


def test_investor_endpoints_require_authentication(client: TestClient) -> None:
    response = client.get("/api/investor/opportunities")
    assert response.status_code == 401


@pytest.mark.parametrize("role_name", NON_INVESTOR_ROLES)
def test_non_investor_roles_are_denied(
    client: TestClient, db_session: Session, role_name: RoleName
) -> None:
    """Directly verifies 'investor cannot access Rider/Business/Admin
    dashboard' from the other direction: no other role's account can
    reach the investor module's API either.
    """
    user = make_user_with_role(
        db_session,
        role_name,
        email=f"{role_name.value.lower()}-inv@example.com",
        phone="+919922000001",
    )
    headers = {"Authorization": f"Bearer {issue_access_token(user)}"}

    response = client.get("/api/investor/opportunities", headers=headers)

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"


# --- profile -------------------------------------------------------------------


def test_create_profile_success(client: TestClient, db_session: Session) -> None:
    headers, _ = _investor_headers(db_session, email="profile1@example.com", phone="+919922000010")

    body = _create_profile(client, headers, legal_name="Asha Rao")

    assert body["legal_name"] == "Asha Rao"
    assert body["kyc_status"] == "NOT_STARTED"
    assert body["country"] == "India"


def test_create_profile_conflict_if_already_exists(client: TestClient, db_session: Session) -> None:
    headers, _ = _investor_headers(db_session, email="profile2@example.com", phone="+919922000011")
    _create_profile(client, headers)

    response = client.post(
        "/api/investor/profile", headers=headers, json={"legal_name": "Second Attempt"}
    )

    assert response.status_code == 409


def test_get_profile_404_before_creation(client: TestClient, db_session: Session) -> None:
    headers, _ = _investor_headers(db_session, email="profile3@example.com", phone="+919922000012")

    response = client.get("/api/investor/profile", headers=headers)

    assert response.status_code == 404


def test_update_profile_partial(client: TestClient, db_session: Session) -> None:
    headers, _ = _investor_headers(db_session, email="profile4@example.com", phone="+919922000013")
    _create_profile(client, headers, legal_name="Original Name")

    response = client.patch("/api/investor/profile", headers=headers, json={"city": "Bengaluru"})

    assert response.status_code == 200
    body = response.json()
    assert body["city"] == "Bengaluru"
    assert body["legal_name"] == "Original Name"  # untouched


# --- KYC -----------------------------------------------------------------------


def test_submit_kyc_document_moves_status_to_pending(
    client: TestClient, db_session: Session
) -> None:
    headers, _ = _investor_headers(db_session, email="kyc1@example.com", phone="+919922000020")
    _create_profile(client, headers)

    response = client.post(
        "/api/investor/kyc/documents",
        headers=headers,
        json={"document_type": "PAN", "file_reference": "mock://pan-card.pdf"},
    )

    assert response.status_code == 201
    assert response.json()["status"] == "PENDING"

    profile = client.get("/api/investor/profile", headers=headers).json()
    assert profile["kyc_status"] == "PENDING"


def test_list_kyc_documents_only_shows_own(client: TestClient, db_session: Session) -> None:
    headers_a, _ = _investor_headers(db_session, email="kyc-a@example.com", phone="+919922000021")
    headers_b, _ = _investor_headers(db_session, email="kyc-b@example.com", phone="+919922000022")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    client.post(
        "/api/investor/kyc/documents",
        headers=headers_a,
        json={"document_type": "AADHAAR", "file_reference": "mock://a.pdf"},
    )

    b_docs = client.get("/api/investor/kyc/documents", headers=headers_b).json()

    assert b_docs["total"] == 0


# --- investment opportunities & investing --------------------------------------


def test_list_opportunities_shows_seeded_or_dev_assets(
    client: TestClient, db_session: Session
) -> None:
    headers, _ = _investor_headers(db_session, email="opp1@example.com", phone="+919922000030")
    _create_asset(db_session, asset_code="TEST-OPP-1")

    response = client.get("/api/investor/opportunities", headers=headers)

    assert response.status_code == 200
    codes = [item["asset_code"] for item in response.json()["items"]]
    assert "TEST-OPP-1" in codes


def test_invest_success_allocates_asset_and_creates_transaction(
    client: TestClient, db_session: Session
) -> None:
    headers, _ = _investor_headers(db_session, email="invest1@example.com", phone="+919922000040")
    _create_profile(client, headers)
    asset = _create_asset(db_session, asset_code="TEST-INV-1")

    investment = _invest(client, headers, str(asset.id))

    assert investment["status"] == "ACTIVE"
    assert investment["asset"]["status"] == "ALLOCATED"
    assert investment["asset"]["is_owned_by_me"] is True

    owned = client.get("/api/investor/assets", headers=headers).json()
    assert any(a["asset_code"] == "TEST-INV-1" for a in owned["items"])

    transactions = client.get("/api/investor/transactions", headers=headers).json()
    assert any(t["type"] == "INVESTMENT" for t in transactions["items"])


def test_invest_in_already_allocated_asset_conflicts(
    client: TestClient, db_session: Session
) -> None:
    headers_a, _ = _investor_headers(
        db_session, email="invest-a@example.com", phone="+919922000041"
    )
    headers_b, _ = _investor_headers(
        db_session, email="invest-b@example.com", phone="+919922000042"
    )
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    asset = _create_asset(db_session, asset_code="TEST-INV-2")
    _invest(client, headers_a, str(asset.id))

    response = client.post(
        "/api/investor/investments", headers=headers_b, json={"ev_asset_id": str(asset.id)}
    )

    assert response.status_code == 409


def test_invest_in_nonexistent_asset_404(client: TestClient, db_session: Session) -> None:
    headers, _ = _investor_headers(db_session, email="invest2@example.com", phone="+919922000043")
    _create_profile(client, headers)

    response = client.post(
        "/api/investor/investments",
        headers=headers,
        json={"ev_asset_id": "00000000-0000-0000-0000-000000000000"},
    )

    assert response.status_code == 404


def test_invest_amount_is_server_derived_from_asset_price_not_client_supplied(
    client: TestClient, db_session: Session
) -> None:
    """InvestmentCreate has no `amount` field at all — the request body
    can't influence how much the investment is recorded as.
    """
    headers, _ = _investor_headers(db_session, email="invest3@example.com", phone="+919922000044")
    _create_profile(client, headers)
    asset = _create_asset(db_session, asset_code="TEST-INV-3")

    investment = _invest(client, headers, str(asset.id))

    assert float(investment["amount"]) == float(asset.price)


# --- ownership isolation: the core requirement ----------------------------------


def test_investor_a_cannot_view_investor_bs_investment_by_id(
    client: TestClient, db_session: Session
) -> None:
    headers_a, _ = _investor_headers(db_session, email="iso-a@example.com", phone="+919922000050")
    headers_b, _ = _investor_headers(db_session, email="iso-b@example.com", phone="+919922000051")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    asset = _create_asset(db_session, asset_code="TEST-ISO-1")
    investment_a = _invest(client, headers_a, str(asset.id))

    # B tries to fetch A's investment by its real id — spoofing the id in
    # the URL is exactly the attack this must block.
    response = client.get(f"/api/investor/investments/{investment_a['id']}", headers=headers_b)

    assert response.status_code == 404


def test_investor_a_cannot_see_investor_bs_investments_in_list(
    client: TestClient, db_session: Session
) -> None:
    headers_a, _ = _investor_headers(db_session, email="iso-c@example.com", phone="+919922000052")
    headers_b, _ = _investor_headers(db_session, email="iso-d@example.com", phone="+919922000053")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    asset = _create_asset(db_session, asset_code="TEST-ISO-2")
    _invest(client, headers_a, str(asset.id))

    b_investments = client.get("/api/investor/investments", headers=headers_b).json()

    assert b_investments["total"] == 0


def test_investor_a_cannot_see_investor_bs_transactions_or_earnings_or_payouts(
    client: TestClient, db_session: Session
) -> None:
    headers_a, _ = _investor_headers(db_session, email="iso-e@example.com", phone="+919922000054")
    headers_b, _ = _investor_headers(db_session, email="iso-f@example.com", phone="+919922000055")
    profile_a = _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    asset = _create_asset(db_session, asset_code="TEST-ISO-3")
    investment_a = _invest(client, headers_a, str(asset.id))

    # Accrue an earning and pay it out for A only (dev/system path).
    service = InvestorService(db_session)
    investment_row = service.investments.get_owned(
        uuid.UUID(investment_a["id"]), uuid.UUID(profile_a["id"])
    )
    service.accrue_earning_dev(
        investment_row, amount=1500, period_start=date(2026, 1, 1), period_end=date(2026, 1, 31)
    )
    client.post("/api/investor/payouts", headers=headers_a)

    assert client.get("/api/investor/earnings", headers=headers_b).json()["total"] == 0
    assert client.get("/api/investor/payouts", headers=headers_b).json()["total"] == 0
    assert client.get("/api/investor/transactions", headers=headers_b).json()["total"] == 0

    # And confirm A really does have them (the isolation is scoped, not global breakage).
    assert client.get("/api/investor/earnings", headers=headers_a).json()["total"] == 1
    assert client.get("/api/investor/payouts", headers=headers_a).json()["total"] == 1


def test_asset_ownership_cannot_be_changed_by_an_investor(
    client: TestClient, db_session: Session
) -> None:
    """There is no endpoint that accepts an asset id and an owner — the
    only way `owner_investor_profile_id` is ever set is inside
    InvestorService.invest() itself, server-side, for the authenticated
    caller. This confirms an asset already owned by A cannot be invested
    in (and thus not reassigned) by B.
    """
    headers_a, _ = _investor_headers(db_session, email="own-a@example.com", phone="+919922000060")
    headers_b, _ = _investor_headers(db_session, email="own-b@example.com", phone="+919922000061")
    _create_profile(client, headers_a)
    _create_profile(client, headers_b)
    asset = _create_asset(db_session, asset_code="TEST-OWN-1")
    _invest(client, headers_a, str(asset.id))

    response = client.post(
        "/api/investor/investments", headers=headers_b, json={"ev_asset_id": str(asset.id)}
    )
    assert response.status_code == 409

    b_owned = client.get("/api/investor/assets", headers=headers_b).json()
    assert not any(a["asset_code"] == "TEST-OWN-1" for a in b_owned["items"])


# --- portfolio -------------------------------------------------------------------


def test_portfolio_summary_reflects_real_investment(
    client: TestClient, db_session: Session
) -> None:
    headers, _ = _investor_headers(
        db_session, email="portfolio1@example.com", phone="+919922000070"
    )
    _create_profile(client, headers)
    asset = _create_asset(db_session, asset_code="TEST-PORT-1")
    _invest(client, headers, str(asset.id))

    summary = client.get("/api/investor/portfolio", headers=headers).json()

    assert float(summary["total_invested"]) == float(asset.price)
    assert summary["assets_owned"] == 1
    assert float(summary["unpaid_earnings_balance"]) == 0.0


# --- payouts ---------------------------------------------------------------------


def test_request_payout_with_no_earnings_fails(client: TestClient, db_session: Session) -> None:
    headers, _ = _investor_headers(db_session, email="payout1@example.com", phone="+919922000080")
    _create_profile(client, headers)

    response = client.post("/api/investor/payouts", headers=headers)

    assert response.status_code == 400


def test_request_payout_pays_out_accrued_earnings(client: TestClient, db_session: Session) -> None:
    headers, _ = _investor_headers(db_session, email="payout2@example.com", phone="+919922000081")
    profile = _create_profile(client, headers)
    asset = _create_asset(db_session, asset_code="TEST-PAYOUT-1")
    investment = _invest(client, headers, str(asset.id))

    service = InvestorService(db_session)
    investment_row = service.investments.get_owned(
        uuid.UUID(investment["id"]), uuid.UUID(profile["id"])
    )
    service.accrue_earning_dev(
        investment_row, amount=1500, period_start=date(2026, 1, 1), period_end=date(2026, 1, 31)
    )

    response = client.post("/api/investor/payouts", headers=headers)

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "COMPLETED"
    assert float(body["amount"]) == 1500.0

    earnings = client.get("/api/investor/earnings", headers=headers).json()
    assert all(e["status"] == "PAID" for e in earnings["items"])

    # Nothing left to pay out a second time.
    second = client.post("/api/investor/payouts", headers=headers)
    assert second.status_code == 400
