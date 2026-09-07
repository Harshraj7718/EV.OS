"""Seed the EV asset catalog — real investment-opportunity inventory, not
test data (same spirit as roles/permissions seeding). Idempotent, keyed
by `asset_code`. Investments/earnings/payouts are never seeded here —
those must come from real investor actions, so history stays honest.
"""
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.modules.investors.models import EVAsset

EV_ASSET_DEFINITIONS: list[dict] = [
    {
        "asset_code": "EV-BLR-0001",
        "model_name": "Tata Nexon EV",
        "price": Decimal("1200000.00"),
        "expected_monthly_return": Decimal("18000.00"),
        "description": "Compact SUV deployed with a ride-hailing fleet partner in Bengaluru.",
    },
    {
        "asset_code": "EV-DEL-0002",
        "model_name": "MG ZS EV",
        "price": Decimal("1800000.00"),
        "expected_monthly_return": Decimal("26000.00"),
        "description": "Mid-size SUV deployed with a corporate leasing partner in Delhi NCR.",
    },
    {
        "asset_code": "EV-MUM-0003",
        "model_name": "Tata Tiago EV",
        "price": Decimal("900000.00"),
        "expected_monthly_return": Decimal("13500.00"),
        "description": "Entry hatchback deployed with a last-mile delivery fleet in Mumbai.",
    },
    {
        "asset_code": "EV-HYD-0004",
        "model_name": "Mahindra XUV400",
        "price": Decimal("1550000.00"),
        "expected_monthly_return": Decimal("22000.00"),
        "description": "Mid-size SUV deployed with a ride-hailing fleet partner in Hyderabad.",
    },
    {
        "asset_code": "EV-PUN-0005",
        "model_name": "Ather 450X (fleet pair)",
        "price": Decimal("300000.00"),
        "expected_monthly_return": Decimal("5500.00"),
        "description": "Electric scooter pair deployed with a delivery fleet in Pune.",
    },
]


def seed_ev_assets(db: Session) -> None:
    created = 0
    for definition in EV_ASSET_DEFINITIONS:
        exists = db.scalar(select(EVAsset).where(EVAsset.asset_code == definition["asset_code"]))
        if exists is not None:
            continue
        db.add(EVAsset(**definition))
        created += 1
    db.commit()
    total = len(EV_ASSET_DEFINITIONS)
    logger.info("EV asset seed complete: %d created, %d already present", created, total - created)
