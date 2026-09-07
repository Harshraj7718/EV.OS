"""Pure unit tests for app/modules/investors/finance.py — no DB, no HTTP,
no fixtures. This is exactly the point of keeping financial calculations
isolated: these run in milliseconds and exercise the math directly.
"""
from decimal import Decimal

from app.modules.investors.finance import (
    calculate_roi_percent,
    round_money,
    sum_unpaid_earnings,
    summarize_portfolio,
)


def test_round_money_rounds_half_up_to_two_places() -> None:
    assert round_money(Decimal("100.005")) == Decimal("100.01")
    assert round_money(Decimal("100.004")) == Decimal("100.00")
    assert round_money(Decimal("100")) == Decimal("100.00")


def test_calculate_roi_percent_basic() -> None:
    assert calculate_roi_percent(Decimal("1000"), Decimal("150")) == Decimal("15.00")


def test_calculate_roi_percent_zero_invested_is_zero_not_a_division_error() -> None:
    assert calculate_roi_percent(Decimal("0"), Decimal("500")) == Decimal("0.00")
    assert calculate_roi_percent(Decimal("-10"), Decimal("500")) == Decimal("0.00")


def test_calculate_roi_percent_no_returns_yet() -> None:
    assert calculate_roi_percent(Decimal("1000"), Decimal("0")) == Decimal("0.00")


def test_sum_unpaid_earnings_adds_and_rounds() -> None:
    amounts = [Decimal("100.111"), Decimal("50.004"), Decimal("25.005")]
    assert sum_unpaid_earnings(amounts) == round_money(sum(amounts, Decimal("0")))


def test_sum_unpaid_earnings_empty_list_is_zero() -> None:
    assert sum_unpaid_earnings([]) == Decimal("0.00")


def test_summarize_portfolio_combines_accrued_and_paid_into_total_earnings() -> None:
    totals = summarize_portfolio(
        total_invested=Decimal("100000"),
        assets_owned=2,
        accrued_earnings=Decimal("3000"),
        paid_earnings=Decimal("2000"),
        total_payouts=Decimal("2000"),
    )

    assert totals.total_invested == Decimal("100000.00")
    assert totals.assets_owned == 2
    assert totals.total_earnings == Decimal("5000.00")
    assert totals.total_earnings_paid == Decimal("2000.00")
    assert totals.unpaid_earnings_balance == Decimal("3000.00")
    assert totals.total_payouts == Decimal("2000.00")
    assert totals.roi_percent == Decimal("5.00")


def test_summarize_portfolio_no_investments_yet() -> None:
    totals = summarize_portfolio(
        total_invested=Decimal("0"),
        assets_owned=0,
        accrued_earnings=Decimal("0"),
        paid_earnings=Decimal("0"),
        total_payouts=Decimal("0"),
    )

    assert totals.total_invested == Decimal("0.00")
    assert totals.roi_percent == Decimal("0.00")


def test_summarize_portfolio_roi_can_exceed_100_percent() -> None:
    """A long-held asset can return more than its purchase price over
    time — ROI isn't capped at 100%, and the calculation shouldn't clip it.
    """
    totals = summarize_portfolio(
        total_invested=Decimal("10000"),
        assets_owned=1,
        accrued_earnings=Decimal("0"),
        paid_earnings=Decimal("15000"),
        total_payouts=Decimal("15000"),
    )

    assert totals.roi_percent == Decimal("150.00")
