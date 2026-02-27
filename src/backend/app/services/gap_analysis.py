"""
Service for computing the retirement gap analysis for a household member.

Implements the 6-step calculation from the PRD:
  1. Monthly retirement need (net income × replacement rate, or manual override)
  2. Monthly pension income from ACTIVE plans (State + Company + Insurance)
  3. Remaining monthly gap after pension income
  4. Required capital (via Safe Withdrawal Rate) adjusted for inflation
  5. Projected capital at retirement (ETF + Savings, 3 scenarios)
  6. Final gap = required_capital_adjusted - projected_capital per scenario

The result is reusable by other features (Payout Strategy, Recommendations, etc.)
"""
from datetime import date
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session

from app.crud.household import household as household_crud
from app.crud.retirement_gap import retirement_gap as gap_crud
from app.crud.pension_etf import pension_etf as etf_crud
from app.crud.pension_savings import pension_savings as savings_crud
from app.crud.pension_state import pension_state as state_crud
from app.crud.pension_company import pension_company as company_crud
from app.crud.pension_insurance import pension_insurance as insurance_crud
from app.crud.settings import settings as settings_crud
from app.models.enums import PensionStatus
from app.schemas.retirement_gap import GapAnalysisResult, GapBreakdown, GapScenarios
from app.services.pension_series_projection import PensionSeriesProjectionService


class GapAnalysisService:
    """Computes the retirement gap analysis for a given household member."""

    def compute(self, db: Session, member_id: int) -> GapAnalysisResult:
        """
        Run the full 6-step gap analysis for a member.

        Raises:
            ValueError: if no RetirementGapConfig exists for the member, or member not found.
        """
        # --- Load required data ---
        member = household_crud.get(db, id=member_id)
        if member is None:
            raise ValueError(f"Member {member_id} not found")

        config = gap_crud.get_by_member_id(db, member_id=member_id)
        if config is None:
            raise ValueError(f"No gap config found for member {member_id}")

        app_settings = settings_crud.get_settings(db)
        inflation_rate = Decimal(str(app_settings.inflation_rate)) if app_settings else Decimal("2.0")

        retirement_date = member.retirement_date_planned
        today = date.today()

        # Years to retirement (fractional)
        days_to_retirement = (retirement_date - today).days if retirement_date else 0
        years_to_retirement = max(days_to_retirement / 365.25, 0.0)
        retirement_already_reached = retirement_date is None or retirement_date <= today

        # --- Step 1: Monthly retirement need ---
        if config.desired_monthly_pension is not None:
            needed_monthly = Decimal(str(config.desired_monthly_pension))
            uses_override = True
        else:
            needed_monthly = Decimal(str(config.net_monthly_income)) * Decimal(str(config.replacement_rate))
            uses_override = False

        # --- Step 2: Monthly pension income from ACTIVE plans ---
        state_monthly = self._state_monthly(db, member_id)
        company_monthly = self._company_monthly(db, member_id, member.retirement_age_planned)
        insurance_monthly = self._insurance_monthly(db, member_id)
        monthly_pension_income = state_monthly + company_monthly + insurance_monthly

        # --- Step 3: Remaining monthly gap ---
        remaining_monthly_gap = needed_monthly - monthly_pension_income

        # --- Step 4: Required capital via SWR, inflation-adjusted ---
        withdrawal_rate = Decimal(str(config.withdrawal_rate))
        if remaining_monthly_gap > Decimal("0"):
            required_capital = (remaining_monthly_gap * Decimal("12")) / withdrawal_rate
        else:
            required_capital = Decimal("0")

        if not retirement_already_reached and years_to_retirement > 0:
            inflation_factor = (Decimal("1") + inflation_rate / Decimal("100")) ** Decimal(str(years_to_retirement))
            required_capital_adjusted = required_capital * inflation_factor
        else:
            required_capital_adjusted = required_capital

        # --- Step 5: Projected capital at retirement (ETF + Savings) ---
        etf_projected, savings_projected = self._projected_capital(db, member_id, app_settings, retirement_date)

        projected_capital = GapScenarios(
            pessimistic=(etf_projected.pessimistic + savings_projected.pessimistic).quantize(Decimal("0.01")),
            realistic=(etf_projected.realistic + savings_projected.realistic).quantize(Decimal("0.01")),
            optimistic=(etf_projected.optimistic + savings_projected.optimistic).quantize(Decimal("0.01")),
        )

        # --- Step 6: Final gap ---
        adj = required_capital_adjusted
        gap = GapScenarios(
            pessimistic=(adj - projected_capital.pessimistic).quantize(Decimal("0.01")),
            realistic=(adj - projected_capital.realistic).quantize(Decimal("0.01")),
            optimistic=(adj - projected_capital.optimistic).quantize(Decimal("0.01")),
        )

        return GapAnalysisResult(
            member_id=member_id,
            needed_monthly=needed_monthly.quantize(Decimal("0.01")),
            uses_override=uses_override,
            monthly_pension_income=monthly_pension_income.quantize(Decimal("0.01")),
            remaining_monthly_gap=remaining_monthly_gap.quantize(Decimal("0.01")),
            required_capital=required_capital.quantize(Decimal("0.01")),
            years_to_retirement=round(years_to_retirement, 2),
            required_capital_adjusted=required_capital_adjusted.quantize(Decimal("0.01")),
            projected_capital=projected_capital,
            gap=gap,
            breakdown=GapBreakdown(
                state_monthly=state_monthly.quantize(Decimal("0.01")),
                company_monthly=company_monthly.quantize(Decimal("0.01")),
                insurance_monthly=insurance_monthly.quantize(Decimal("0.01")),
                etf_projected=etf_projected,
                savings_projected=savings_projected,
            ),
            retirement_already_reached=retirement_already_reached,
        )

    # ── Monthly income helpers ────────────────────────────────────────────────

    def _state_monthly(self, db: Session, member_id: int) -> Decimal:
        """Sum latest projected_monthly_amount across all ACTIVE state pensions."""
        pensions = state_crud.get_multi(db, filters={"member_id": member_id})
        total = Decimal("0")
        for p in pensions:
            if p.status != PensionStatus.ACTIVE:
                continue
            if not p.statements:
                continue
            latest = max(p.statements, key=lambda s: s.statement_date)
            if latest.projected_monthly_amount is not None:
                total += Decimal(str(latest.projected_monthly_amount))
        return total

    def _company_monthly(self, db: Session, member_id: int, retirement_age: int) -> Decimal:
        """Sum monthly payouts from ACTIVE company pensions at the planned retirement age."""
        pensions = company_crud.get_multi(db, filters={"member_id": member_id})
        total = Decimal("0")
        for p in pensions:
            if p.status != PensionStatus.ACTIVE:
                continue
            if not p.statements:
                continue
            latest = max(p.statements, key=lambda s: s.statement_date)
            projections = latest.retirement_projections or []
            if not projections:
                continue
            # Find projection matching retirement age; fall back to closest
            match = next((pr for pr in projections if pr.retirement_age == retirement_age), None)
            if match is None:
                match = min(projections, key=lambda pr: abs(pr.retirement_age - retirement_age))
            total += Decimal(str(match.monthly_payout))
        return total

    def _insurance_monthly(self, db: Session, member_id: int) -> Decimal:
        """Sum monthly payouts from ACTIVE insurance pensions (latest statement, with_contributions scenario)."""
        pensions = insurance_crud.get_multi(db, filters={"member_id": member_id})
        total = Decimal("0")
        for p in pensions:
            if p.status != PensionStatus.ACTIVE:
                continue
            if not p.statements:
                continue
            latest = max(p.statements, key=lambda s: s.statement_date)
            projections = latest.projections or []
            match = next((pr for pr in projections if pr.scenario_type == "with_contributions"), None)
            if match is None:
                match = next(iter(projections), None)
            if match is not None:
                total += Decimal(str(match.monthly_payout))
        return total

    # ── Projected capital helpers ─────────────────────────────────────────────

    def _projected_capital(
        self,
        db: Session,
        member_id: int,
        app_settings,
        retirement_date: Optional[date],
    ):
        """
        Compute end-of-projection capital for ETF and Savings pensions per scenario.

        Returns (etf_projected: GapScenarios, savings_projected: GapScenarios).
        """
        svc = PensionSeriesProjectionService()
        zero = GapScenarios(pessimistic=Decimal("0"), realistic=Decimal("0"), optimistic=Decimal("0"))

        if retirement_date is None or retirement_date <= date.today():
            return zero, zero

        # ETF pensions
        etf_pess = etf_real = etf_opt = Decimal("0")
        for p in etf_crud.get_multi(db, filters={"member_id": member_id}):
            if p.status != PensionStatus.ACTIVE:
                continue
            series = svc.build_scenario_series(p, "ETF_PLAN", app_settings, retirement_date)
            etf_pess += series.pessimistic[-1].value if series.pessimistic else Decimal("0")
            etf_real  += series.realistic[-1].value  if series.realistic  else Decimal("0")
            etf_opt   += series.optimistic[-1].value if series.optimistic  else Decimal("0")

        # Savings pensions
        sav_pess = sav_real = sav_opt = Decimal("0")
        for p in savings_crud.get_multi(db, filters={"member_id": member_id}):
            if p.status != PensionStatus.ACTIVE:
                continue
            series = svc.build_scenario_series(p, "SAVINGS", app_settings, retirement_date)
            sav_pess += series.pessimistic[-1].value if series.pessimistic else Decimal("0")
            sav_real  += series.realistic[-1].value  if series.realistic  else Decimal("0")
            sav_opt   += series.optimistic[-1].value if series.optimistic  else Decimal("0")

        etf_projected = GapScenarios(
            pessimistic=etf_pess.quantize(Decimal("0.01")),
            realistic=etf_real.quantize(Decimal("0.01")),
            optimistic=etf_opt.quantize(Decimal("0.01")),
        )
        savings_projected = GapScenarios(
            pessimistic=sav_pess.quantize(Decimal("0.01")),
            realistic=sav_real.quantize(Decimal("0.01")),
            optimistic=sav_opt.quantize(Decimal("0.01")),
        )
        return etf_projected, savings_projected


gap_analysis_service = GapAnalysisService()
