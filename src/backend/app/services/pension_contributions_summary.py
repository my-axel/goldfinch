"""
Service for computing contribution summary metrics across pension types.

Used by the aggregate dashboard endpoint to populate ContributionSummary
in AggregateMetadata.

State pension has no contribution tracking (it's a statutory contribution
deducted from salary) — counted as 0.
"""
from datetime import date
from decimal import Decimal
from typing import List

from app.schemas.pension_series import ContributionSummary


def _sum_contributions(history_items, current_year: int) -> tuple[Decimal, Decimal]:
    """
    Sum total contributions and this-year contributions from a contribution history list.

    Args:
        history_items: Iterable of objects with .contribution_date (date) and .amount (Numeric)
        current_year:  The calendar year to filter for "this year"

    Returns:
        (total_to_date, this_year)
    """
    total = Decimal("0")
    this_year = Decimal("0")
    for item in history_items:
        amt = Decimal(str(item.amount))
        total += amt
        if item.contribution_date.year == current_year:
            this_year += amt
    return total, this_year


class PensionContributionSummaryService:
    """Computes contribution totals across a list of pensions of any type."""

    def compute(self, pensions_with_types: List[tuple], current_total_value: Decimal) -> ContributionSummary:
        """
        Compute aggregated contribution summary.

        Args:
            pensions_with_types: List of (pension_model, pension_type_str) tuples.
                                 Each pension must have its contribution_history loaded.
            current_total_value: The current summed portfolio value (for returns calculation).

        Returns:
            ContributionSummary with total_to_date, this_year, total_returns, returns_percentage.
        """
        current_year = date.today().year
        grand_total = Decimal("0")
        grand_this_year = Decimal("0")

        for pension, pension_type in pensions_with_types:
            if pension_type == "STATE":
                # State pension has no tracked contributions
                continue

            history = getattr(pension, "contribution_history", [])
            total, this_year = _sum_contributions(history, current_year)
            grand_total += total
            grand_this_year += this_year

        total_returns = current_total_value - grand_total
        returns_pct: Decimal | None = None
        if grand_total > Decimal("0"):
            returns_pct = (total_returns / grand_total * Decimal("100")).quantize(Decimal("0.01"))

        return ContributionSummary(
            total_to_date=grand_total.quantize(Decimal("0.01")),
            this_year=grand_this_year.quantize(Decimal("0.01")),
            total_returns=total_returns.quantize(Decimal("0.01")),
            returns_percentage=returns_pct,
        )
