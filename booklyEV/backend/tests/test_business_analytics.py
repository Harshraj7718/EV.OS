"""Pure unit tests for app/modules/businesses/analytics.py — no DB, no
HTTP, no fixtures.
"""
from decimal import Decimal

from app.modules.businesses.analytics import calculate_utilization_percent


def test_calculate_utilization_percent_basic() -> None:
    assert calculate_utilization_percent(1, 2) == Decimal("50.00")


def test_calculate_utilization_percent_zero_total_is_zero_not_a_division_error() -> None:
    assert calculate_utilization_percent(0, 0) == Decimal("0.00")
    assert calculate_utilization_percent(5, 0) == Decimal("0.00")


def test_calculate_utilization_percent_none_active() -> None:
    assert calculate_utilization_percent(0, 4) == Decimal("0.00")


def test_calculate_utilization_percent_all_active() -> None:
    assert calculate_utilization_percent(3, 3) == Decimal("100.00")


def test_calculate_utilization_percent_rounds_half_up() -> None:
    assert calculate_utilization_percent(1, 3) == Decimal("33.33")
    assert calculate_utilization_percent(2, 3) == Decimal("66.67")
