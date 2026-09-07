"""Every list/get method that touches an investor-owned table takes
`investor_profile_id` as a required filter — not optional, not
inferred from anything else. That's the structural enforcement behind
"every query must enforce ownership": there is no method here capable of
returning another investor's row by accident.
"""
import uuid
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.investors.enums import EarningStatus, EVAssetStatus, InvestmentStatus, PayoutStatus
from app.modules.investors.models import (
    EVAsset,
    Investment,
    InvestorEarning,
    InvestorProfile,
    KycDocument,
    Payout,
)
from app.modules.investors.models import Transaction as TransactionModel


def _offset(page: int, page_size: int) -> int:
    return (page - 1) * page_size


class InvestorProfileRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_user_id(self, user_id: uuid.UUID) -> InvestorProfile | None:
        stmt = select(InvestorProfile).where(InvestorProfile.user_id == user_id)
        return self.db.scalar(stmt)

    def create(self, profile: InvestorProfile) -> InvestorProfile:
        self.db.add(profile)
        self.db.flush()
        return profile


class EVAssetRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, asset_id: uuid.UUID) -> EVAsset | None:
        return self.db.get(EVAsset, asset_id)

    def list_available(self, *, page: int, page_size: int) -> tuple[list[EVAsset], int]:
        is_available = EVAsset.status == EVAssetStatus.AVAILABLE
        total = self.db.scalar(select(func.count()).select_from(EVAsset).where(is_available)) or 0
        stmt = (
            select(EVAsset)
            .where(is_available)
            .order_by(EVAsset.created_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total

    def list_owned_by(
        self, investor_profile_id: uuid.UUID, *, page: int, page_size: int
    ) -> tuple[list[EVAsset], int]:
        is_owner = EVAsset.owner_investor_profile_id == investor_profile_id
        total = self.db.scalar(select(func.count()).select_from(EVAsset).where(is_owner)) or 0
        stmt = (
            select(EVAsset)
            .where(is_owner)
            .order_by(EVAsset.created_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total

    def count_owned_by(self, investor_profile_id: uuid.UUID) -> int:
        is_owner = EVAsset.owner_investor_profile_id == investor_profile_id
        return self.db.scalar(select(func.count()).select_from(EVAsset).where(is_owner)) or 0


class InvestmentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, investment: Investment) -> Investment:
        self.db.add(investment)
        self.db.flush()
        return investment

    def list_for_investor(
        self, investor_profile_id: uuid.UUID, *, page: int, page_size: int
    ) -> tuple[list[Investment], int]:
        is_owner = Investment.investor_profile_id == investor_profile_id
        total = self.db.scalar(select(func.count()).select_from(Investment).where(is_owner)) or 0
        stmt = (
            select(Investment)
            .where(is_owner)
            .order_by(Investment.created_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total

    def get_owned(
        self, investment_id: uuid.UUID, investor_profile_id: uuid.UUID
    ) -> Investment | None:
        """The core ownership gate for a single investment: `id` alone is
        never enough, the row must also belong to this investor. Returns
        None either way (not found vs. not yours are indistinguishable to
        the caller) so a 404 never leaks whether the id exists at all.
        """
        stmt = select(Investment).where(
            Investment.id == investment_id, Investment.investor_profile_id == investor_profile_id
        )
        return self.db.scalar(stmt)

    def sum_active_amount(self, investor_profile_id: uuid.UUID) -> Decimal:
        stmt = select(func.coalesce(func.sum(Investment.amount), 0)).where(
            Investment.investor_profile_id == investor_profile_id,
            Investment.status == InvestmentStatus.ACTIVE,
        )
        return Decimal(self.db.scalar(stmt) or 0)


class EarningRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, earning: InvestorEarning) -> InvestorEarning:
        self.db.add(earning)
        self.db.flush()
        return earning

    def list_for_investor(
        self, investor_profile_id: uuid.UUID, *, page: int, page_size: int
    ) -> tuple[list[InvestorEarning], int]:
        is_owner = InvestorEarning.investor_profile_id == investor_profile_id
        count_stmt = select(func.count()).select_from(InvestorEarning).where(is_owner)
        total = self.db.scalar(count_stmt) or 0
        stmt = (
            select(InvestorEarning)
            .where(is_owner)
            .order_by(InvestorEarning.period_start.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total

    def list_unpaid(self, investor_profile_id: uuid.UUID) -> list[InvestorEarning]:
        stmt = select(InvestorEarning).where(
            InvestorEarning.investor_profile_id == investor_profile_id,
            InvestorEarning.status == EarningStatus.ACCRUED,
        )
        return list(self.db.scalars(stmt))

    def sum_by_status(self, investor_profile_id: uuid.UUID) -> dict[EarningStatus, Decimal]:
        stmt = (
            select(InvestorEarning.status, func.coalesce(func.sum(InvestorEarning.amount), 0))
            .where(InvestorEarning.investor_profile_id == investor_profile_id)
            .group_by(InvestorEarning.status)
        )
        return {status: Decimal(total) for status, total in self.db.execute(stmt).all()}


class PayoutRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, payout: Payout) -> Payout:
        self.db.add(payout)
        self.db.flush()
        return payout

    def list_for_investor(
        self, investor_profile_id: uuid.UUID, *, page: int, page_size: int
    ) -> tuple[list[Payout], int]:
        is_owner = Payout.investor_profile_id == investor_profile_id
        total = self.db.scalar(select(func.count()).select_from(Payout).where(is_owner)) or 0
        stmt = (
            select(Payout)
            .where(is_owner)
            .order_by(Payout.created_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total

    def sum_completed(self, investor_profile_id: uuid.UUID) -> Decimal:
        stmt = select(func.coalesce(func.sum(Payout.amount), 0)).where(
            Payout.investor_profile_id == investor_profile_id,
            Payout.status == PayoutStatus.COMPLETED,
        )
        return Decimal(self.db.scalar(stmt) or 0)


class TransactionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, transaction: TransactionModel) -> TransactionModel:
        self.db.add(transaction)
        self.db.flush()
        return transaction

    def list_for_investor(
        self, investor_profile_id: uuid.UUID, *, page: int, page_size: int
    ) -> tuple[list[TransactionModel], int]:
        is_owner = TransactionModel.investor_profile_id == investor_profile_id
        count_stmt = select(func.count()).select_from(TransactionModel).where(is_owner)
        total = self.db.scalar(count_stmt) or 0
        stmt = (
            select(TransactionModel)
            .where(is_owner)
            .order_by(TransactionModel.created_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total


class KycDocumentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, document: KycDocument) -> KycDocument:
        self.db.add(document)
        self.db.flush()
        return document

    def list_for_investor(
        self, investor_profile_id: uuid.UUID, *, page: int, page_size: int
    ) -> tuple[list[KycDocument], int]:
        is_owner = KycDocument.investor_profile_id == investor_profile_id
        total = self.db.scalar(select(func.count()).select_from(KycDocument).where(is_owner)) or 0
        stmt = (
            select(KycDocument)
            .where(is_owner)
            .order_by(KycDocument.created_at.desc())
            .offset(_offset(page, page_size))
            .limit(page_size)
        )
        return list(self.db.scalars(stmt)), total
