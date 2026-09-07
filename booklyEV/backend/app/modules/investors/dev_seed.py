"""DEV-ONLY: simulate one monthly earning accrual for every ACTIVE
investment. Not part of `app/seed.py` — unlike roles/permissions/EV
assets, this depends on real investments already existing (chicken/egg),
and represents an ongoing system process (a monthly accrual job), not
one-time baseline data.

There is deliberately no API endpoint for this — see
`InvestorService.accrue_earning_dev`'s docstring. Run by hand for local
demo/testing only:

    python -m app.modules.investors.dev_seed
"""
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.logging import configure_logging, logger

# Run standalone (not via app.main), so every mapped module must be
# imported here — SQLAlchemy configures the whole mapper registry together
# on first query, and a class it hasn't seen yet (e.g. Role, referenced by
# name from User) fails that configuration even though this script never
# queries it directly. Mirrors alembic/env.py and tests/conftest.py.
from app.modules.audit import models as _audit_models  # noqa: F401,E402
from app.modules.auth import models as _auth_models  # noqa: F401,E402
from app.modules.investors.enums import InvestmentStatus
from app.modules.investors.models import Investment, InvestorEarning
from app.modules.investors.service import InvestorService
from app.modules.permissions import models as _permissions_models  # noqa: F401,E402
from app.modules.roles import models as _roles_models  # noqa: F401,E402
from app.modules.users import models as _users_models  # noqa: F401,E402


def _previous_month_period(today: date) -> tuple[date, date]:
    period_end = today.replace(day=1) - timedelta(days=1)
    period_start = period_end.replace(day=1)
    return period_start, period_end


def run() -> None:
    configure_logging()
    db = SessionLocal()
    try:
        service = InvestorService(db)
        active_investments = list(
            db.scalars(select(Investment).where(Investment.status == InvestmentStatus.ACTIVE))
        )

        period_start, period_end = _previous_month_period(date.today())

        created = 0
        for investment in active_investments:
            already_accrued = db.scalar(
                select(InvestorEarning).where(
                    InvestorEarning.investment_id == investment.id,
                    InvestorEarning.period_start == period_start,
                )
            )
            if already_accrued is not None:
                continue

            amount = Decimal(investment.ev_asset.expected_monthly_return)
            service.accrue_earning_dev(
                investment, amount=amount, period_start=period_start, period_end=period_end
            )
            created += 1

        logger.info(
            "Dev earnings accrual complete: %d earning(s) created for period %s to %s",
            created,
            period_start,
            period_end,
        )
    finally:
        db.close()


if __name__ == "__main__":
    run()
