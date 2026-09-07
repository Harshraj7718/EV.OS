"""InvestorService — every method resolves "which investor" from the
authenticated `User` passed in, via `get_profile_for_user()`. No method
anywhere in this file accepts an `investor_id` parameter from a caller;
the only identifiers callers pass in are resource ids scoped to *this*
already-resolved profile (e.g. `investment_id` for `get_investment`),
and those are always looked up with the profile id as a mandatory filter
(see repository.py). This is what "never trust investor_id from the URL"
means in code — there's structurally no code path where a URL-supplied
investor id could select whose data gets returned.
"""
import uuid
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.exceptions import AppError, ConflictError, NotFoundError
from app.core.pagination import Page
from app.modules.investors.enums import (
    EarningStatus,
    EVAssetStatus,
    InvestmentStatus,
    KycStatus,
    PayoutStatus,
    TransactionStatus,
    TransactionType,
)
from app.modules.investors.finance import PortfolioTotals, sum_unpaid_earnings, summarize_portfolio
from app.modules.investors.models import (
    Investment,
    InvestorEarning,
    InvestorProfile,
    KycDocument,
    Payout,
)
from app.modules.investors.models import Transaction as TransactionModel
from app.modules.investors.repository import (
    EarningRepository,
    EVAssetRepository,
    InvestmentRepository,
    InvestorProfileRepository,
    KycDocumentRepository,
    PayoutRepository,
    TransactionRepository,
)
from app.modules.investors.schemas import (
    EarningPublic,
    EVAssetPublic,
    InvestmentCreate,
    InvestmentPublic,
    InvestorProfileCreate,
    InvestorProfileUpdate,
    KycDocumentCreate,
    KycDocumentPublic,
    PayoutPublic,
    TransactionPublic,
)
from app.modules.users.models import User


class InvestorService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.profiles = InvestorProfileRepository(db)
        self.assets = EVAssetRepository(db)
        self.investments = InvestmentRepository(db)
        self.earnings = EarningRepository(db)
        self.payouts = PayoutRepository(db)
        self.transactions = TransactionRepository(db)
        self.kyc_documents = KycDocumentRepository(db)

    # --- identity resolution ---------------------------------------------------

    def get_profile_for_user(self, user: User) -> InvestorProfile:
        profile = self.profiles.get_by_user_id(user.id)
        if profile is None:
            raise NotFoundError("Investor profile not found. Create one first.")
        return profile

    # --- profile -----------------------------------------------------------------

    def create_profile(self, user: User, payload: InvestorProfileCreate) -> InvestorProfile:
        if self.profiles.get_by_user_id(user.id) is not None:
            raise ConflictError("Investor profile already exists.")

        profile = InvestorProfile(user_id=user.id, **payload.model_dump())
        self.profiles.create(profile)
        self.db.commit()
        return profile

    def update_profile(self, user: User, payload: InvestorProfileUpdate) -> InvestorProfile:
        profile = self.get_profile_for_user(user)
        changes = payload.model_dump(exclude_unset=True)
        for field, value in changes.items():
            setattr(profile, field, value)
        if changes:
            self.db.commit()
        return profile

    # --- KYC -----------------------------------------------------------------------

    def submit_kyc_document(self, user: User, payload: KycDocumentCreate) -> KycDocument:
        profile = self.get_profile_for_user(user)
        document = KycDocument(
            investor_profile_id=profile.id,
            document_type=payload.document_type,
            file_reference=payload.file_reference,
        )
        self.kyc_documents.create(document)
        if profile.kyc_status == KycStatus.NOT_STARTED:
            profile.kyc_status = KycStatus.PENDING
        self.db.commit()
        return document

    def list_kyc_documents(
        self, user: User, *, page: int, page_size: int
    ) -> Page[KycDocumentPublic]:
        profile = self.get_profile_for_user(user)
        items, total = self.kyc_documents.list_for_investor(
            profile.id, page=page, page_size=page_size
        )
        return Page[KycDocumentPublic](
            items=[KycDocumentPublic.from_document(d) for d in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    # --- investment opportunities & owned assets ------------------------------------

    def list_opportunities(self, *, page: int, page_size: int) -> Page[EVAssetPublic]:
        items, total = self.assets.list_available(page=page, page_size=page_size)
        return Page[EVAssetPublic](
            items=[EVAssetPublic.from_asset(a, is_owned_by_me=False) for a in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def list_owned_assets(self, user: User, *, page: int, page_size: int) -> Page[EVAssetPublic]:
        profile = self.get_profile_for_user(user)
        items, total = self.assets.list_owned_by(profile.id, page=page, page_size=page_size)
        return Page[EVAssetPublic](
            items=[EVAssetPublic.from_asset(a, is_owned_by_me=True) for a in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    # --- investing -------------------------------------------------------------------

    def invest(self, user: User, payload: InvestmentCreate) -> Investment:
        profile = self.get_profile_for_user(user)

        # The asset id came from the request body — it is looked up, not
        # trusted. Its *current* status is re-checked here regardless of
        # what the opportunities list showed the client a moment ago.
        asset = self.assets.get_by_id(payload.ev_asset_id)
        if asset is None:
            raise NotFoundError("EV asset not found.")
        if asset.status != EVAssetStatus.AVAILABLE:
            raise ConflictError("This EV asset is no longer available for investment.")

        investment = Investment(
            investor_profile_id=profile.id,
            ev_asset_id=asset.id,
            amount=asset.price,
            status=InvestmentStatus.PENDING,
        )
        self.investments.create(investment)

        # --- MOCK payment settlement -------------------------------------
        # No real payment gateway is connected in this phase. A real
        # integration would leave the investment PENDING until an async
        # webhook confirms payment; here settlement is simulated
        # synchronously and unconditionally so the module is fully
        # exercisable end-to-end. See docs/investor.md.
        now = datetime.now(UTC)
        investment.status = InvestmentStatus.ACTIVE
        investment.invested_at = now
        asset.status = EVAssetStatus.ALLOCATED
        asset.owner_investor_profile_id = profile.id

        self.transactions.create(
            TransactionModel(
                investor_profile_id=profile.id,
                type=TransactionType.INVESTMENT,
                amount=asset.price,
                status=TransactionStatus.COMPLETED,
                reference_type="investment",
                reference_id=investment.id,
                description=(
                    f"Investment in {asset.asset_code} ({asset.model_name}) — mock settlement"
                ),
            )
        )
        self.db.commit()
        return investment

    def list_investments(self, user: User, *, page: int, page_size: int) -> Page[InvestmentPublic]:
        profile = self.get_profile_for_user(user)
        items, total = self.investments.list_for_investor(
            profile.id, page=page, page_size=page_size
        )
        return Page[InvestmentPublic](
            items=[InvestmentPublic.from_investment(i) for i in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_investment(self, user: User, investment_id: uuid.UUID) -> Investment:
        profile = self.get_profile_for_user(user)
        investment = self.investments.get_owned(investment_id, profile.id)
        if investment is None:
            raise NotFoundError("Investment not found.")
        return investment

    # --- portfolio -------------------------------------------------------------------

    def get_portfolio_summary(self, user: User) -> PortfolioTotals:
        profile = self.get_profile_for_user(user)
        total_invested = self.investments.sum_active_amount(profile.id)
        assets_owned = self.assets.count_owned_by(profile.id)
        earnings_by_status = self.earnings.sum_by_status(profile.id)
        total_payouts = self.payouts.sum_completed(profile.id)
        return summarize_portfolio(
            total_invested=total_invested,
            assets_owned=assets_owned,
            accrued_earnings=earnings_by_status.get(EarningStatus.ACCRUED, Decimal("0")),
            paid_earnings=earnings_by_status.get(EarningStatus.PAID, Decimal("0")),
            total_payouts=total_payouts,
        )

    def list_earnings(self, user: User, *, page: int, page_size: int) -> Page[EarningPublic]:
        profile = self.get_profile_for_user(user)
        items, total = self.earnings.list_for_investor(profile.id, page=page, page_size=page_size)
        return Page[EarningPublic](
            items=[EarningPublic.from_earning(e) for e in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    # --- payouts ---------------------------------------------------------------------

    def request_payout(self, user: User) -> Payout:
        profile = self.get_profile_for_user(user)
        unpaid = self.earnings.list_unpaid(profile.id)
        total = sum_unpaid_earnings([e.amount for e in unpaid])
        if total <= 0:
            raise AppError("No accrued earnings available to pay out.")

        payout = Payout(investor_profile_id=profile.id, amount=total, status=PayoutStatus.PENDING)
        self.payouts.create(payout)

        # --- MOCK payout settlement (see invest() for the same caveat) ---
        now = datetime.now(UTC)
        payout.status = PayoutStatus.COMPLETED
        payout.processed_at = now
        for earning in unpaid:
            earning.status = EarningStatus.PAID
            earning.paid_out_id = payout.id

        self.transactions.create(
            TransactionModel(
                investor_profile_id=profile.id,
                type=TransactionType.PAYOUT,
                amount=total,
                status=TransactionStatus.COMPLETED,
                reference_type="payout",
                reference_id=payout.id,
                description="Payout of accrued earnings — mock settlement",
            )
        )
        self.db.commit()
        return payout

    def list_payouts(self, user: User, *, page: int, page_size: int) -> Page[PayoutPublic]:
        profile = self.get_profile_for_user(user)
        items, total = self.payouts.list_for_investor(profile.id, page=page, page_size=page_size)
        return Page[PayoutPublic](
            items=[PayoutPublic.from_payout(p) for p in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    # --- transactions ------------------------------------------------------------------

    def list_transactions(
        self, user: User, *, page: int, page_size: int
    ) -> Page[TransactionPublic]:
        profile = self.get_profile_for_user(user)
        items, total = self.transactions.list_for_investor(
            profile.id, page=page, page_size=page_size
        )
        return Page[TransactionPublic](
            items=[TransactionPublic.from_transaction(t) for t in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    # --- dev-only: earning accrual ------------------------------------------------------

    def accrue_earning_dev(
        self,
        investment: Investment,
        *,
        amount: Decimal,
        period_start,
        period_end,
    ) -> InvestorEarning:
        """NOT exposed via any API endpoint. Earnings must be system-
        generated (e.g. a monthly accrual job, once one exists), never
        investor-triggered — an endpoint here would let an investor
        fabricate their own income. Callable only from a dev/seed script;
        see app/modules/investors/dev_seed.py.
        """
        earning = InvestorEarning(
            investor_profile_id=investment.investor_profile_id,
            investment_id=investment.id,
            amount=amount,
            period_start=period_start,
            period_end=period_end,
        )
        self.earnings.create(earning)
        self.transactions.create(
            TransactionModel(
                investor_profile_id=investment.investor_profile_id,
                type=TransactionType.EARNING_CREDIT,
                amount=amount,
                status=TransactionStatus.COMPLETED,
                reference_type="earning",
                reference_id=earning.id,
                description=f"Earning accrued for {period_start} to {period_end} — dev/mock",
            )
        )
        self.db.commit()
        return earning
