"""Pure calculation for the one non-trivial analytics figure — no
DB/HTTP/ORM imports, tested directly with no fixtures. Mirrors
`app/modules/investors/finance.py`'s isolation rationale.
"""
from decimal import ROUND_HALF_UP, Decimal

_TWO_PLACES = Decimal("0.01")
_ZERO = Decimal("0.00")


def calculate_utilization_percent(active_fleet_vehicles: int, total_vehicles: int) -> Decimal:
    """What fraction of a business's owned vehicles are currently
    deployed (actively assigned to a fleet), as a percentage.
    """
    if total_vehicles <= 0:
        return _ZERO
    percent = (Decimal(active_fleet_vehicles) / Decimal(total_vehicles)) * Decimal(100)
    return percent.quantize(_TWO_PLACES, rounding=ROUND_HALF_UP)
