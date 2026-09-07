"""Investor self-service API — every route requires `require_role(RoleName.INVESTOR)`.

Role-gated rather than permission-gated deliberately: this is a
stakeholder-exclusive module (mirrors how the SUPER_ADMIN panel is
role-gated for its own exclusive surface — see docs/admin.md). Several of
the general RBAC permissions this module's actions relate to
(`payment.read`, `kyc.read`, ...) are also held by RIDER, which is fine
for the general matrix but would be the wrong gate here — an investor
profile is only ever reachable by its owning user regardless, but keeping
the route surface role-exclusive avoids a RIDER account ever reaching
`/api/investor/*` at all, matching "investor cannot access ... other
dashboards" understood the other way around too.
"""
import dataclasses
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, require_role
from app.core.pagination import Page
from app.modules.investors.schemas import (
    EarningPublic,
    EVAssetPublic,
    InvestmentCreate,
    InvestmentPublic,
    InvestorProfileCreate,
    InvestorProfilePublic,
    InvestorProfileUpdate,
    KycDocumentCreate,
    KycDocumentPublic,
    PayoutPublic,
    PortfolioSummary,
    TransactionPublic,
)
from app.modules.investors.service import InvestorService
from app.modules.roles.enums import RoleName
from app.modules.users.models import User

router = APIRouter(tags=["investor"])

require_investor = require_role(RoleName.INVESTOR)


# --- profile -------------------------------------------------------------------


@router.post("/profile", response_model=InvestorProfilePublic, status_code=status.HTTP_201_CREATED)
def create_profile(
    payload: InvestorProfileCreate,
    user: User = Depends(require_investor),
    db: Session = Depends(get_db_session),
) -> InvestorProfilePublic:
    profile = InvestorService(db).create_profile(user, payload)
    return InvestorProfilePublic.model_validate(profile)


@router.get("/profile", response_model=InvestorProfilePublic)
def get_profile(
    user: User = Depends(require_investor), db: Session = Depends(get_db_session)
) -> InvestorProfilePublic:
    profile = InvestorService(db).get_profile_for_user(user)
    return InvestorProfilePublic.model_validate(profile)


@router.patch("/profile", response_model=InvestorProfilePublic)
def update_profile(
    payload: InvestorProfileUpdate,
    user: User = Depends(require_investor),
    db: Session = Depends(get_db_session),
) -> InvestorProfilePublic:
    profile = InvestorService(db).update_profile(user, payload)
    return InvestorProfilePublic.model_validate(profile)


# --- KYC ---------------------------------------------------------------------------


@router.post(
    "/kyc/documents", response_model=KycDocumentPublic, status_code=status.HTTP_201_CREATED
)
def submit_kyc_document(
    payload: KycDocumentCreate,
    user: User = Depends(require_investor),
    db: Session = Depends(get_db_session),
) -> KycDocumentPublic:
    document = InvestorService(db).submit_kyc_document(user, payload)
    return KycDocumentPublic.from_document(document)


@router.get("/kyc/documents", response_model=Page[KycDocumentPublic])
def list_kyc_documents(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_investor),
    db: Session = Depends(get_db_session),
) -> Page[KycDocumentPublic]:
    return InvestorService(db).list_kyc_documents(user, page=page, page_size=page_size)


# --- investment opportunities & owned assets --------------------------------------


@router.get("/opportunities", response_model=Page[EVAssetPublic])
def list_opportunities(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_investor),
    db: Session = Depends(get_db_session),
) -> Page[EVAssetPublic]:
    return InvestorService(db).list_opportunities(page=page, page_size=page_size)


@router.get("/assets", response_model=Page[EVAssetPublic])
def list_owned_assets(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_investor),
    db: Session = Depends(get_db_session),
) -> Page[EVAssetPublic]:
    return InvestorService(db).list_owned_assets(user, page=page, page_size=page_size)


# --- investments ---------------------------------------------------------------------


@router.post("/investments", response_model=InvestmentPublic, status_code=status.HTTP_201_CREATED)
def invest(
    payload: InvestmentCreate,
    user: User = Depends(require_investor),
    db: Session = Depends(get_db_session),
) -> InvestmentPublic:
    investment = InvestorService(db).invest(user, payload)
    return InvestmentPublic.from_investment(investment)


@router.get("/investments", response_model=Page[InvestmentPublic])
def list_investments(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_investor),
    db: Session = Depends(get_db_session),
) -> Page[InvestmentPublic]:
    return InvestorService(db).list_investments(user, page=page, page_size=page_size)


@router.get("/investments/{investment_id}", response_model=InvestmentPublic)
def get_investment(
    investment_id: uuid.UUID,
    user: User = Depends(require_investor),
    db: Session = Depends(get_db_session),
) -> InvestmentPublic:
    investment = InvestorService(db).get_investment(user, investment_id)
    return InvestmentPublic.from_investment(investment)


# --- portfolio & earnings ------------------------------------------------------------


@router.get("/portfolio", response_model=PortfolioSummary)
def get_portfolio(
    user: User = Depends(require_investor), db: Session = Depends(get_db_session)
) -> PortfolioSummary:
    totals = InvestorService(db).get_portfolio_summary(user)
    return PortfolioSummary(**dataclasses.asdict(totals))


@router.get("/earnings", response_model=Page[EarningPublic])
def list_earnings(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_investor),
    db: Session = Depends(get_db_session),
) -> Page[EarningPublic]:
    return InvestorService(db).list_earnings(user, page=page, page_size=page_size)


# --- payouts -------------------------------------------------------------------------


@router.post("/payouts", response_model=PayoutPublic, status_code=status.HTTP_201_CREATED)
def request_payout(
    user: User = Depends(require_investor), db: Session = Depends(get_db_session)
) -> PayoutPublic:
    payout = InvestorService(db).request_payout(user)
    return PayoutPublic.from_payout(payout)


@router.get("/payouts", response_model=Page[PayoutPublic])
def list_payouts(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_investor),
    db: Session = Depends(get_db_session),
) -> Page[PayoutPublic]:
    return InvestorService(db).list_payouts(user, page=page, page_size=page_size)


# --- transactions ----------------------------------------------------------------------


@router.get("/transactions", response_model=Page[TransactionPublic])
def list_transactions(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_investor),
    db: Session = Depends(get_db_session),
) -> Page[TransactionPublic]:
    return InvestorService(db).list_transactions(user, page=page, page_size=page_size)
