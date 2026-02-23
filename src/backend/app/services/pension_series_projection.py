"""
Service for calculating forward projection time series for all pension types.

Produces monthly data points from today to the member's planned retirement date.
Each pension type uses per-pension rates with a global fallback:
- Savings:   pension's own pessimistic/realistic/optimistic_rate (always set, stored as %)
- State:     pension's own rates, fallback to settings.state_pension_*_rate
- Insurance: pension's own rates, fallback to settings.projection_*_rate
- Company:   pension's own rates, fallback to settings.projection_*_rate
- ETF:       pension's own rates, fallback to settings.projection_*_rate

All per-pension rates are stored as percentages (e.g. 7.0 = 7% p.a.).
Contribution plan steps are evaluated month by month.
ONE_TIME contributions are ignored in projections (they are historical events).
"""
from datetime import date
from decimal import Decimal
from typing import Dict, List, Optional

from app.models.pension_state import PensionState
from app.models.pension_savings import PensionSavings
from app.models.pension_insurance import PensionInsurance
from app.models.pension_company import PensionCompany
from app.models.pension_etf import PensionETF
from app.models.settings import Settings
from app.models.enums import ContributionFrequency
from app.schemas.pension_series import ProjectionDataPoint, ScenarioSeries


# Monthly contribution multiplier per frequency
# How much of one "step amount" counts as a monthly contribution
_FREQ_TO_MONTHLY: Dict[ContributionFrequency, Decimal] = {
    ContributionFrequency.MONTHLY:        Decimal("1"),
    ContributionFrequency.QUARTERLY:      Decimal("1") / Decimal("3"),
    ContributionFrequency.SEMI_ANNUALLY:  Decimal("1") / Decimal("6"),
    ContributionFrequency.ANNUALLY:       Decimal("1") / Decimal("12"),
    ContributionFrequency.ONE_TIME:       Decimal("0"),  # Ignored in projections
}


def _next_month(d: date) -> date:
    """Advance a date by one month, clamping to the last day of the target month."""
    month = d.month + 1 if d.month < 12 else 1
    year = d.year if d.month < 12 else d.year + 1
    # Clamp day to 28 to avoid overshooting short months
    return date(year, month, min(d.day, 28))


def _monthly_contribution_from_steps(steps, month_date: date) -> Decimal:
    """
    Return the total monthly contribution amount for all active steps in a given month.
    A step is active when: step.start_date <= month_date <= step.end_date (or no end_date).
    """
    total = Decimal("0")
    for step in steps:
        if step.start_date > month_date:
            continue
        if step.end_date is not None and step.end_date < month_date:
            continue
        multiplier = _FREQ_TO_MONTHLY.get(step.frequency, Decimal("0"))
        total += Decimal(str(step.amount)) * multiplier
    return total


def _project_series(
    start_value: Decimal,
    annual_rate_pct: Decimal,
    contribution_steps: list,
    start_date: date,
    end_date: date,
) -> List[ProjectionDataPoint]:
    """
    Generate monthly projection data points from start_date to end_date.

    Uses monthly compound growth:
        new_value = (prev_value + monthly_contribution) * (1 + monthly_rate)

    Args:
        start_value:        Starting portfolio value (from latest statement or current_value)
        annual_rate_pct:    Annual growth rate as a percentage (e.g. 7.0 for 7%)
        contribution_steps: Active contribution plan steps to evaluate each month
        start_date:         First projection month (typically today)
        end_date:           Last projection month (typically retirement date)

    Returns:
        List of ProjectionDataPoint, one per month, sorted ascending.
    """
    if end_date <= start_date:
        return []

    monthly_rate = (
        (Decimal("1") + annual_rate_pct / Decimal("100")) ** (Decimal("1") / Decimal("12"))
        - Decimal("1")
    )

    value = start_value
    points: List[ProjectionDataPoint] = []
    cur = start_date

    while cur <= end_date:
        contribution = _monthly_contribution_from_steps(contribution_steps, cur)
        value = (value + contribution) * (Decimal("1") + monthly_rate)
        points.append(
            ProjectionDataPoint(date=cur, value=value.quantize(Decimal("0.01")))
        )
        cur = _next_month(cur)

    return points


class PensionSeriesProjectionService:
    """Generates scenario projection series for all pension types."""

    def get_rates(
        self,
        pension,
        pension_type: str,
        settings: Settings,
    ) -> Dict[str, Decimal]:
        """
        Resolve pessimistic/realistic/optimistic rates for a pension (in % form).

        Returns dict with keys: "pessimistic", "realistic", "optimistic"
        All values are percentage points (e.g. 7.0 means 7% p.a.).
        """
        if pension_type == "SAVINGS":
            # Savings always has its own rates (non-nullable)
            return {
                "pessimistic": Decimal(str(pension.pessimistic_rate)),
                "realistic":   Decimal(str(pension.realistic_rate)),
                "optimistic":  Decimal(str(pension.optimistic_rate)),
            }

        elif pension_type == "STATE":
            # Per-pension rates with fallback to global state_pension_*_rate
            pess = Decimal(str(pension.pessimistic_rate)) if pension.pessimistic_rate is not None \
                   else Decimal(str(settings.state_pension_pessimistic_rate))
            real = Decimal(str(pension.realistic_rate)) if pension.realistic_rate is not None \
                   else Decimal(str(settings.state_pension_realistic_rate))
            opt  = Decimal(str(pension.optimistic_rate)) if pension.optimistic_rate is not None \
                   else Decimal(str(settings.state_pension_optimistic_rate))
            return {"pessimistic": pess, "realistic": real, "optimistic": opt}

        else:
            # INSURANCE, COMPANY, ETF_PLAN — per-pension rates (%), fallback to projection_*_rate
            pess = Decimal(str(pension.pessimistic_rate)) if pension.pessimistic_rate is not None \
                   else Decimal(str(settings.projection_pessimistic_rate))
            real = Decimal(str(pension.realistic_rate)) if pension.realistic_rate is not None \
                   else Decimal(str(settings.projection_realistic_rate))
            opt  = Decimal(str(pension.optimistic_rate)) if pension.optimistic_rate is not None \
                   else Decimal(str(settings.projection_optimistic_rate))
            return {"pessimistic": pess, "realistic": real, "optimistic": opt}

    def _start_value_and_steps(self, pension, pension_type: str):
        """
        Extract the projection starting value and contribution plan steps for a pension.

        Returns (start_value: Decimal, steps: list)
        """
        if pension_type == "STATE":
            # Use current_value from latest statement (capital equivalent)
            latest = next(
                (s for s in sorted(pension.statements, key=lambda s: s.statement_date, reverse=True)),
                None
            )
            if latest and latest.current_value is not None:
                value = Decimal(str(latest.current_value))
            else:
                value = Decimal("0")
            return value, []  # State pension has no contribution plan

        elif pension_type == "SAVINGS":
            latest = next(
                (s for s in sorted(pension.statements, key=lambda s: s.statement_date, reverse=True)),
                None
            )
            value = Decimal(str(latest.balance)) if latest else Decimal("0")
            return value, pension.contribution_plan_steps

        elif pension_type == "INSURANCE":
            latest = next(
                (s for s in sorted(pension.statements, key=lambda s: s.statement_date, reverse=True)),
                None
            )
            if latest:
                value = Decimal(str(latest.value))
            else:
                value = Decimal(str(pension.current_value))
            return value, pension.contribution_plan_steps

        elif pension_type == "COMPANY":
            latest = next(
                (s for s in sorted(pension.statements, key=lambda s: s.statement_date, reverse=True)),
                None
            )
            if latest:
                value = Decimal(str(latest.value))
            else:
                value = Decimal(str(pension.current_value))
            return value, []  # Company uses simple contribution_amount, not plan steps

        else:  # ETF_PLAN
            return Decimal(str(pension.current_value)), pension.contribution_plan_steps

    def build_scenario_series(
        self,
        pension,
        pension_type: str,
        settings: Settings,
        retirement_date: Optional[date] = None,
    ) -> ScenarioSeries:
        """
        Build pessimistic/realistic/optimistic projection series for a pension.

        Args:
            pension:         The pension model instance (with relationships loaded)
            pension_type:    String like "SAVINGS", "STATE", "ETF_PLAN" etc.
            settings:        Global settings (for fallback rates)
            retirement_date: End date for projection (member's planned retirement date).
                             If None, returns empty series.
        """
        if retirement_date is None or retirement_date <= date.today():
            return ScenarioSeries(pessimistic=[], realistic=[], optimistic=[])

        rates = self.get_rates(pension, pension_type, settings)
        start_value, steps = self._start_value_and_steps(pension, pension_type)
        start_date = date.today()

        return ScenarioSeries(
            pessimistic=_project_series(start_value, rates["pessimistic"], steps, start_date, retirement_date),
            realistic=_project_series(start_value, rates["realistic"], steps, start_date, retirement_date),
            optimistic=_project_series(start_value, rates["optimistic"], steps, start_date, retirement_date),
        )

    def build_state_monthly_projection(
        self,
        pension: PensionState,
        settings: Settings,
        retirement_date: Optional[date] = None,
    ) -> Optional[ScenarioSeries]:
        """
        Build a secondary projection for State pension: monthly payout growth.

        Projects the latest projected_monthly_amount forward using state pension rates.
        Returns None if no statement data is available.
        """
        latest = next(
            (s for s in sorted(pension.statements, key=lambda s: s.statement_date, reverse=True)),
            None
        )
        if not latest or latest.projected_monthly_amount is None:
            return None
        if retirement_date is None or retirement_date <= date.today():
            return None

        rates = self.get_rates(pension, "STATE", settings)
        start_value = Decimal(str(latest.projected_monthly_amount))
        start_date = date.today()

        return ScenarioSeries(
            pessimistic=_project_series(start_value, rates["pessimistic"], [], start_date, retirement_date),
            realistic=_project_series(start_value, rates["realistic"], [], start_date, retirement_date),
            optimistic=_project_series(start_value, rates["optimistic"], [], start_date, retirement_date),
        )
