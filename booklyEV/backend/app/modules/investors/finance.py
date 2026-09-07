"""Pure financial calculations for the investor module.

No DB session, no HTTP, no ORM objects in or out — every function here
takes plain Decimal/int/dict arguments and returns plain values or
dataclasses. That's deliberate: `InvestorService` does the DB work and
hands these functions already-aggregated numbers, so the actual math
(the part most worth getting right and easiest to get wrong) can be
unit-tested with zero fixtures. See tests/test_investor_finance.py and
docs/investor.md.
"""
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

_TWO_PLACES = Decimal("0.01")
_ZERO = Decimal("0.00")


def round_money(value: Decimal) -> Decimal:
    return value.quantize(_TWO_PLACES, rounding=ROUND_HALF_UP)


def calculate_roi_percent(total_invested: Decimal, total_returns: Decimal) -> Decimal:
    """Return on investment as a percentage. 0.00 (not an error) when
    nothing has been invested yet — there's no meaningful ratio, and
    every caller displays this directly.
    """
    if total_invested <= _ZERO:
        return _ZERO
    return round_money((total_returns / total_invested) * Decimal(100))


@dataclass(frozen=True)
class PortfolioTotals:
    total_invested: Decimal
    assets_owned: int
    total_earnings: Decimal  # accrued + paid, i.e. all-time returns
    total_earnings_paid: Decimal
    unpaid_earnings_balance: Decimal
    total_payouts: Decimal
    roi_percent: Decimal


def summarize_portfolio(
    *,
    total_invested: Decimal,
    assets_owned: int,
    accrued_earnings: Decimal,
    paid_earnings: Decimal,
    total_payouts: Decimal,
) -> PortfolioTotals:
    """Aggregate an investor's holdings into the numbers the dashboard and
    /portfolio page show. All inputs are already-summed totals (from
    `EarningRepository.sum_by_status` etc.) — this function only combines
    and rounds them, it doesn't touch the database.
    """
    total_earnings = accrued_earnings + paid_earnings
    return PortfolioTotals(
        total_invested=round_money(total_invested),
        assets_owned=assets_owned,
        total_earnings=round_money(total_earnings),
        total_earnings_paid=round_money(paid_earnings),
        unpaid_earnings_balance=round_money(accrued_earnings),
        total_payouts=round_money(total_payouts),
        roi_percent=calculate_roi_percent(total_invested, total_earnings),
    )


def sum_unpaid_earnings(amounts: list[Decimal]) -> Decimal:
    """The exact amount a payout request settles for — the sum of every
    currently-ACCRUED (unpaid) earning. Kept as its own tiny function so
    the payout-eligibility rule (`> 0`) is tested independently of the
    repository query that gathers the amounts.
    """
    return round_money(sum(amounts, _ZERO))
