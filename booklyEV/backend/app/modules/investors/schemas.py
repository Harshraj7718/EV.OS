import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.modules.investors.enums import (
    EarningStatus,
    EVAssetStatus,
    InvestmentStatus,
    KycDocumentStatus,
    KycDocumentType,
    KycStatus,
    PayoutStatus,
    TransactionStatus,
    TransactionType,
)
from app.modules.investors.models import (
    EVAsset,
    Investment,
    InvestorEarning,
    KycDocument,
    Payout,
)
from app.modules.investors.models import Transaction as TransactionModel

# --- profile -----------------------------------------------------------------


class InvestorProfileCreate(BaseModel):
    legal_name: str = Field(min_length=2, max_length=150)
    pan_number: str | None = Field(default=None, max_length=20)
    date_of_birth: date | None = None
    address_line1: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    country: str = Field(default="India", max_length=100)


class InvestorProfileUpdate(BaseModel):
    legal_name: str | None = Field(default=None, min_length=2, max_length=150)
    pan_number: str | None = Field(default=None, max_length=20)
    date_of_birth: date | None = None
    address_line1: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    country: str | None = Field(default=None, max_length=100)


class InvestorProfilePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    legal_name: str
    pan_number: str | None
    date_of_birth: date | None
    address_line1: str | None
    city: str | None
    state: str | None
    postal_code: str | None
    country: str
    kyc_status: KycStatus
    created_at: datetime
    updated_at: datetime


# --- KYC documents -------------------------------------------------------------


class KycDocumentCreate(BaseModel):
    document_type: KycDocumentType
    file_reference: str = Field(min_length=1, max_length=500)


class KycDocumentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    document_type: KycDocumentType
    file_reference: str
    status: KycDocumentStatus
    created_at: datetime

    @classmethod
    def from_document(cls, doc: KycDocument) -> "KycDocumentPublic":
        return cls.model_validate(doc)


# --- EV assets / investment opportunities ---------------------------------------


class EVAssetPublic(BaseModel):
    id: uuid.UUID
    asset_code: str
    model_name: str
    registration_number: str | None
    price: Decimal
    expected_monthly_return: Decimal
    status: EVAssetStatus
    description: str | None
    is_owned_by_me: bool
    created_at: datetime

    @classmethod
    def from_asset(cls, asset: EVAsset, *, is_owned_by_me: bool) -> "EVAssetPublic":
        return cls(
            id=asset.id,
            asset_code=asset.asset_code,
            model_name=asset.model_name,
            registration_number=asset.registration_number,
            price=asset.price,
            expected_monthly_return=asset.expected_monthly_return,
            status=asset.status,
            description=asset.description,
            is_owned_by_me=is_owned_by_me,
            created_at=asset.created_at,
        )


# --- investments ----------------------------------------------------------------


class InvestmentCreate(BaseModel):
    ev_asset_id: uuid.UUID


class InvestmentPublic(BaseModel):
    id: uuid.UUID
    amount: Decimal
    status: InvestmentStatus
    invested_at: datetime | None
    created_at: datetime
    asset: EVAssetPublic

    @classmethod
    def from_investment(cls, investment: Investment) -> "InvestmentPublic":
        return cls(
            id=investment.id,
            amount=investment.amount,
            status=investment.status,
            invested_at=investment.invested_at,
            created_at=investment.created_at,
            asset=EVAssetPublic.from_asset(investment.ev_asset, is_owned_by_me=True),
        )


# --- earnings ------------------------------------------------------------------


class EarningPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    investment_id: uuid.UUID
    amount: Decimal
    period_start: date
    period_end: date
    status: EarningStatus
    created_at: datetime

    @classmethod
    def from_earning(cls, earning: InvestorEarning) -> "EarningPublic":
        return cls.model_validate(earning)


# --- payouts -------------------------------------------------------------------


class PayoutPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    amount: Decimal
    status: PayoutStatus
    payout_method: str
    processed_at: datetime | None
    created_at: datetime

    @classmethod
    def from_payout(cls, payout: Payout) -> "PayoutPublic":
        return cls.model_validate(payout)


# --- transactions ----------------------------------------------------------------


class TransactionPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: TransactionType
    amount: Decimal
    status: TransactionStatus
    reference_type: str
    reference_id: uuid.UUID
    description: str
    created_at: datetime

    @classmethod
    def from_transaction(cls, transaction: TransactionModel) -> "TransactionPublic":
        return cls.model_validate(transaction)


# --- portfolio -----------------------------------------------------------------


class PortfolioSummary(BaseModel):
    total_invested: Decimal
    assets_owned: int
    total_earnings: Decimal
    total_earnings_paid: Decimal
    unpaid_earnings_balance: Decimal
    total_payouts: Decimal
    roi_percent: Decimal


__all__ = [
    "InvestorProfileCreate",
    "InvestorProfileUpdate",
    "InvestorProfilePublic",
    "KycDocumentCreate",
    "KycDocumentPublic",
    "EVAssetPublic",
    "InvestmentCreate",
    "InvestmentPublic",
    "EarningPublic",
    "PayoutPublic",
    "TransactionPublic",
    "PortfolioSummary",
]
