"""
Service for computing the retirement gap analysis for a household member.

Implements the 6-step calculation:
  1. Monthly retirement need (net income × replacement rate, or manual override)
  2. Monthly pension income from ACTIVE plans (State + Company + Insurance)
  3. Remaining monthly gap after pension income
  4. Required capital via annuity/perpetuity formula (per scenario growth rate)
  5. Projected capital at retirement (ETF + Savings, 3 scenarios)
  6. Final gap = required_capital_adjusted - projected_capital per scenario

Capital calculation modes:
  - capital_depletion=True  → Annuity: K = M × (1 - (1+r/12)^-N) / (r/12)
  - capital_depletion=False → Perpetuity: K = M × 12 / r
Where M = monthly gap, r = scenario growth rate, N = (withdrawal_until_age - retirement_age) × 12

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
from app.schemas.retirement_gap import GapAnalysisResult, GapBreakdown, GapScenarios, GapTimeline, GapTimelinePoint
from app.services.pension_series_projection import PensionSeriesProjectionService
from app.services.pension_state_projection import PensionStateProjectionService


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

        # Salary growth factor: projects current net income to retirement date.
        # Captures both inflation and real wage growth (career progression, raises).
        salary_growth_rate = Decimal(str(config.annual_salary_growth_rate)) / Decimal("100")
        if not retirement_already_reached and years_to_retirement > 0:
            salary_growth_factor = (Decimal("1") + salary_growth_rate) ** Decimal(str(years_to_retirement))
        else:
            salary_growth_factor = Decimal("1")

        # Projected net salary at retirement in future nominal euros (always computed for display).
        salary_at_retirement = (Decimal(str(config.net_monthly_income)) * salary_growth_factor).quantize(Decimal("0.01"))

        # --- Step 1: Monthly retirement need ---
        if config.desired_monthly_pension is not None:
            # Manual override: user specifies today's-euros target — inflate with inflation rate.
            needed_monthly = Decimal(str(config.desired_monthly_pension))
            uses_override = True
            if not retirement_already_reached and years_to_retirement > 0:
                inflation_factor = (Decimal("1") + inflation_rate / Decimal("100")) ** Decimal(str(years_to_retirement))
            else:
                inflation_factor = Decimal("1")
            needed_monthly_at_retirement = (needed_monthly * inflation_factor).quantize(Decimal("0.01"))
        else:
            # Normal calculation: apply replacement rate to projected salary at retirement.
            # salary_at_retirement is already in future nominal euros, so no extra inflation factor needed.
            needed_monthly = (salary_at_retirement * Decimal(str(config.replacement_rate))).quantize(Decimal("0.01"))
            uses_override = False
            needed_monthly_at_retirement = needed_monthly

        # --- Step 2: Monthly pension income from ACTIVE plans ---
        state_scenarios = self._state_monthly_scenarios(db, member_id, member, app_settings, retirement_date)
        company_monthly = self._company_monthly(db, member_id, member.retirement_age_planned)
        insurance_monthly = self._insurance_monthly(db, member_id)
        fixed_income = company_monthly + insurance_monthly
        monthly_pension_income = GapScenarios(
            pessimistic=(state_scenarios.pessimistic + fixed_income).quantize(Decimal("0.01")),
            realistic=(state_scenarios.realistic + fixed_income).quantize(Decimal("0.01")),
            optimistic=(state_scenarios.optimistic + fixed_income).quantize(Decimal("0.01")),
        )

        # Apply optional pension deduction rate (taxes/social contributions on pension income).
        # If set, converts gross pension amounts to net by applying (1 - deduction_rate).
        if config.pension_deduction_rate is not None and config.pension_deduction_rate > 0:
            net_factor = Decimal("1") - Decimal(str(config.pension_deduction_rate)) / Decimal("100")
            monthly_pension_income = GapScenarios(
                pessimistic=(monthly_pension_income.pessimistic * net_factor).quantize(Decimal("0.01")),
                realistic=(monthly_pension_income.realistic * net_factor).quantize(Decimal("0.01")),
                optimistic=(monthly_pension_income.optimistic * net_factor).quantize(Decimal("0.01")),
            )

        # --- Step 3: Remaining monthly gap in future nominal euros (per scenario) ---
        remaining_monthly_gap = GapScenarios(
            pessimistic=(needed_monthly_at_retirement - monthly_pension_income.pessimistic).quantize(Decimal("0.01")),
            realistic=(needed_monthly_at_retirement - monthly_pension_income.realistic).quantize(Decimal("0.01")),
            optimistic=(needed_monthly_at_retirement - monthly_pension_income.optimistic).quantize(Decimal("0.01")),
        )

        # --- Step 4: Required capital via annuity/perpetuity (per scenario) ---
        # The gap is already in future nominal euros. Required capital is computed
        # using the scenario-specific growth rate and the configured withdrawal horizon.
        withdrawal_until_age = config.withdrawal_until_age
        capital_depletion = config.capital_depletion
        N = (withdrawal_until_age - member.retirement_age_planned) * 12  # months

        pess_rate = Decimal(str(app_settings.projection_pessimistic_rate)) if app_settings else Decimal("4.0")
        real_rate = Decimal(str(app_settings.projection_realistic_rate)) if app_settings else Decimal("6.0")
        opt_rate = Decimal(str(app_settings.projection_optimistic_rate)) if app_settings else Decimal("8.0")

        def _required_capital(gap: Decimal, annual_rate_pct: Decimal) -> Decimal:
            if gap <= Decimal("0"):
                return Decimal("0")
            r = float(annual_rate_pct) / 100.0
            r_m = r / 12.0
            if capital_depletion:
                factor = Decimal(str(self._annuity_factor(r_m, N)))
            else:
                factor = Decimal(str(12.0 / r)) if r > 0 else Decimal("999999")
            return (gap * factor).quantize(Decimal("0.01"))

        required_capital = GapScenarios(
            pessimistic=_required_capital(remaining_monthly_gap.pessimistic, pess_rate),
            realistic=_required_capital(remaining_monthly_gap.realistic, real_rate),
            optimistic=_required_capital(remaining_monthly_gap.optimistic, opt_rate),
        )
        # required_capital_adjusted equals required_capital: inflation is already
        # embedded in needed_monthly_at_retirement, so there is no separate step.
        required_capital_adjusted = required_capital

        # --- Step 5: Projected capital at retirement (ETF + Savings) ---
        etf_projected, savings_projected = self._projected_capital(db, member_id, app_settings, retirement_date)

        projected_capital = GapScenarios(
            pessimistic=(etf_projected.pessimistic + savings_projected.pessimistic).quantize(Decimal("0.01")),
            realistic=(etf_projected.realistic + savings_projected.realistic).quantize(Decimal("0.01")),
            optimistic=(etf_projected.optimistic + savings_projected.optimistic).quantize(Decimal("0.01")),
        )

        # --- Step 6: Final gap (per scenario) ---
        gap = GapScenarios(
            pessimistic=(required_capital_adjusted.pessimistic - projected_capital.pessimistic).quantize(Decimal("0.01")),
            realistic=(required_capital_adjusted.realistic - projected_capital.realistic).quantize(Decimal("0.01")),
            optimistic=(required_capital_adjusted.optimistic - projected_capital.optimistic).quantize(Decimal("0.01")),
        )

        return GapAnalysisResult(
            member_id=member_id,
            needed_monthly=needed_monthly.quantize(Decimal("0.01")),
            needed_monthly_at_retirement=needed_monthly_at_retirement,
            salary_at_retirement=salary_at_retirement,
            uses_override=uses_override,
            monthly_pension_income=monthly_pension_income,
            remaining_monthly_gap=remaining_monthly_gap,
            required_capital=required_capital,
            years_to_retirement=round(years_to_retirement, 2),
            required_capital_adjusted=required_capital_adjusted,
            projected_capital=projected_capital,
            gap=gap,
            breakdown=GapBreakdown(
                state_monthly=GapScenarios(
                    pessimistic=state_scenarios.pessimistic.quantize(Decimal("0.01")),
                    realistic=state_scenarios.realistic.quantize(Decimal("0.01")),
                    optimistic=state_scenarios.optimistic.quantize(Decimal("0.01")),
                ),
                company_monthly=company_monthly.quantize(Decimal("0.01")),
                insurance_monthly=insurance_monthly.quantize(Decimal("0.01")),
                etf_projected=etf_projected,
                savings_projected=savings_projected,
            ),
            retirement_already_reached=retirement_already_reached,
        )

    # ── Annuity helper ────────────────────────────────────────────────────────

    @staticmethod
    def _annuity_factor(monthly_rate: float, num_months: int) -> float:
        """
        Present-value annuity factor: (1 - (1 + r)^-N) / r
        Returns num_months when monthly_rate == 0 (limiting case).
        """
        if monthly_rate == 0:
            return float(num_months)
        return (1.0 - (1.0 + monthly_rate) ** (-num_months)) / monthly_rate

    # ── Monthly income helpers ────────────────────────────────────────────────

    def _state_monthly_scenarios(
        self,
        db: Session,
        member_id: int,
        member,
        app_settings,
        retirement_date: Optional[date],
    ) -> GapScenarios:
        """
        Project state pension monthly amounts at retirement per scenario.
        Uses PensionStateProjectionService with compound growth rates.
        """
        pensions = state_crud.get_multi(db, filters={"member_id": member_id})
        pess = real = opt = Decimal("0")
        state_svc = PensionStateProjectionService()
        for p in pensions:
            if p.status != PensionStatus.ACTIVE:
                continue
            if not p.statements:
                continue
            projection = state_svc.calculate_scenarios(p, member, app_settings)
            planned = projection.planned
            if not planned:
                continue
            if "pessimistic" in planned and planned["pessimistic"].monthly_amount is not None:
                pess += planned["pessimistic"].monthly_amount
            if "realistic" in planned and planned["realistic"].monthly_amount is not None:
                real += planned["realistic"].monthly_amount
            if "optimistic" in planned and planned["optimistic"].monthly_amount is not None:
                opt += planned["optimistic"].monthly_amount
        return GapScenarios(pessimistic=pess, realistic=real, optimistic=opt)

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


    def compute_timeline(self, db: Session, member_id: int) -> GapTimeline:
        """
        Compute year-by-year retirement gap timeline from today to planned retirement.

        For each integer year Y (0 = today, 1 = one year from now, …):
          - required_monthly: retirement need grown by salary growth (or inflation for override)
          - state_income: state pension grown by per-scenario rates for Y years
          - fixed_income: company + insurance (constant)
          - capital_income: ETF + savings capital at year Y, converted to monthly via withdrawal rate
          - pension_income: sum of above, net of optional deduction rate

        Raises ValueError if member or config not found.
        """
        member = household_crud.get(db, id=member_id)
        if member is None:
            raise ValueError(f"Member {member_id} not found")

        config = gap_crud.get_by_member_id(db, member_id=member_id)
        if config is None:
            raise ValueError(f"No gap config found for member {member_id}")

        app_settings = settings_crud.get_settings(db)
        inflation_rate = Decimal(str(app_settings.inflation_rate)) if app_settings else Decimal("2.0")
        pess_rate = Decimal(str(app_settings.projection_pessimistic_rate)) if app_settings else Decimal("4.0")
        real_rate = Decimal(str(app_settings.projection_realistic_rate)) if app_settings else Decimal("6.0")
        opt_rate = Decimal(str(app_settings.projection_optimistic_rate)) if app_settings else Decimal("8.0")

        retirement_date = member.retirement_date_planned
        today = date.today()

        days_to_retirement = (retirement_date - today).days if retirement_date else 0
        years_to_retirement = max(days_to_retirement / 365.25, 0.0)
        retirement_already_reached = retirement_date is None or retirement_date <= today

        if retirement_already_reached:
            return GapTimeline(
                member_id=member_id,
                start_year=today.year,
                retirement_year=today.year,
                points=[],
                gap_at_retirement=GapScenarios(
                    pessimistic=Decimal("0"), realistic=Decimal("0"), optimistic=Decimal("0")
                ),
            )

        replacement_rate = Decimal(str(config.replacement_rate))
        salary_growth_rate = Decimal(str(config.annual_salary_growth_rate)) / Decimal("100")
        net_monthly_income = Decimal(str(config.net_monthly_income))

        # Deduction factor for gross→net conversion of pension income
        if config.pension_deduction_rate is not None and config.pension_deduction_rate > 0:
            net_factor = Decimal("1") - Decimal(str(config.pension_deduction_rate)) / Decimal("100")
        else:
            net_factor = Decimal("1")

        # Required pension base and growth rate
        if config.desired_monthly_pension is not None:
            required_base = Decimal(str(config.desired_monthly_pension))
            required_growth_rate = inflation_rate / Decimal("100")
        else:
            required_base = net_monthly_income * replacement_rate
            required_growth_rate = salary_growth_rate

        # Fixed income (company + insurance) — constant
        company_monthly = self._company_monthly(db, member_id, member.retirement_age_planned)
        insurance_monthly = self._insurance_monthly(db, member_id)
        fixed_income = company_monthly + insurance_monthly

        # State pension: collect base amounts and rates per active pension
        state_bases = self._state_base_amounts_for_timeline(db, member_id, app_settings)

        # ETF + Savings: build full monthly series, extract yearly snapshots
        num_years = int(years_to_retirement) + 1
        svc = PensionSeriesProjectionService()
        etf_yearly = self._yearly_capital(
            etf_crud.get_multi(db, filters={"member_id": member_id}),
            "ETF_PLAN", svc, app_settings, retirement_date, num_years,
        )
        savings_yearly = self._yearly_capital(
            savings_crud.get_multi(db, filters={"member_id": member_id}),
            "SAVINGS", svc, app_settings, retirement_date, num_years,
        )

        start_year = today.year
        retirement_year = retirement_date.year

        points: list[GapTimelinePoint] = []
        for y in range(num_years):
            y_dec = Decimal(str(y))

            required_monthly = (required_base * (Decimal("1") + required_growth_rate) ** y_dec).quantize(Decimal("0.01"))

            # State pension at year Y
            state_pess = state_real = state_opt = Decimal("0")
            for base_pess, rate_pess, base_real, rate_real, base_opt, rate_opt in state_bases:
                state_pess += base_pess * ((Decimal("1") + rate_pess / Decimal("100")) ** y_dec)
                state_real += base_real * ((Decimal("1") + rate_real / Decimal("100")) ** y_dec)
                state_opt += base_opt * ((Decimal("1") + rate_opt / Decimal("100")) ** y_dec)

            # Capital income at year Y → monthly (annuity or perpetuity, per scenario)
            tl_N = (config.withdrawal_until_age - member.retirement_age_planned) * 12
            tl_pess_r = float(pess_rate) / 100.0
            tl_real_r = float(real_rate) / 100.0
            tl_opt_r = float(opt_rate) / 100.0
            if config.capital_depletion:
                tl_pess_factor = self._annuity_factor(tl_pess_r / 12.0, tl_N)
                tl_real_factor = self._annuity_factor(tl_real_r / 12.0, tl_N)
                tl_opt_factor = self._annuity_factor(tl_opt_r / 12.0, tl_N)
                cap_pess = (etf_yearly["pessimistic"][y] + savings_yearly["pessimistic"][y]) / Decimal(str(tl_pess_factor)) if tl_pess_factor else Decimal("0")
                cap_real = (etf_yearly["realistic"][y] + savings_yearly["realistic"][y]) / Decimal(str(tl_real_factor)) if tl_real_factor else Decimal("0")
                cap_opt = (etf_yearly["optimistic"][y] + savings_yearly["optimistic"][y]) / Decimal(str(tl_opt_factor)) if tl_opt_factor else Decimal("0")
            else:
                cap_pess = (etf_yearly["pessimistic"][y] + savings_yearly["pessimistic"][y]) * Decimal(str(tl_pess_r)) / Decimal("12") if tl_pess_r > 0 else Decimal("0")
                cap_real = (etf_yearly["realistic"][y] + savings_yearly["realistic"][y]) * Decimal(str(tl_real_r)) / Decimal("12") if tl_real_r > 0 else Decimal("0")
                cap_opt = (etf_yearly["optimistic"][y] + savings_yearly["optimistic"][y]) * Decimal(str(tl_opt_r)) / Decimal("12") if tl_opt_r > 0 else Decimal("0")

            # Total pension income (gross → net)
            total_pess = (state_pess + fixed_income + cap_pess) * net_factor
            total_real = (state_real + fixed_income + cap_real) * net_factor
            total_opt = (state_opt + fixed_income + cap_opt) * net_factor

            points.append(GapTimelinePoint(
                year=start_year + y,
                years_from_now=float(y),
                required_monthly=required_monthly,
                pension_income=GapScenarios(
                    pessimistic=total_pess.quantize(Decimal("0.01")),
                    realistic=total_real.quantize(Decimal("0.01")),
                    optimistic=total_opt.quantize(Decimal("0.01")),
                ),
                state_income=GapScenarios(
                    pessimistic=(state_pess * net_factor).quantize(Decimal("0.01")),
                    realistic=(state_real * net_factor).quantize(Decimal("0.01")),
                    optimistic=(state_opt * net_factor).quantize(Decimal("0.01")),
                ),
                fixed_income=(fixed_income * net_factor).quantize(Decimal("0.01")),
                capital_income=GapScenarios(
                    pessimistic=(cap_pess * net_factor).quantize(Decimal("0.01")),
                    realistic=(cap_real * net_factor).quantize(Decimal("0.01")),
                    optimistic=(cap_opt * net_factor).quantize(Decimal("0.01")),
                ),
            ))

        last = points[-1] if points else None
        if last:
            gap_at_retirement = GapScenarios(
                pessimistic=(last.required_monthly - last.pension_income.pessimistic).quantize(Decimal("0.01")),
                realistic=(last.required_monthly - last.pension_income.realistic).quantize(Decimal("0.01")),
                optimistic=(last.required_monthly - last.pension_income.optimistic).quantize(Decimal("0.01")),
            )
        else:
            gap_at_retirement = GapScenarios(pessimistic=Decimal("0"), realistic=Decimal("0"), optimistic=Decimal("0"))

        return GapTimeline(
            member_id=member_id,
            start_year=start_year,
            retirement_year=retirement_year,
            points=points,
            gap_at_retirement=gap_at_retirement,
        )

    def _state_base_amounts_for_timeline(self, db: Session, member_id: int, app_settings) -> list:
        """
        Returns list of (base_pess, rate_pess, base_real, rate_real, base_opt, rate_opt)
        for each active state pension with a statement, for use in compute_timeline().
        """
        pensions = state_crud.get_multi(db, filters={"member_id": member_id})
        result = []
        default_rates = {"pessimistic": Decimal("1.0"), "realistic": Decimal("1.5"), "optimistic": Decimal("2.0")}

        for p in pensions:
            if p.status != PensionStatus.ACTIVE:
                continue
            if not p.statements:
                continue
            latest = p.statements[0]
            if latest.projected_monthly_amount is None:
                continue
            base = Decimal(str(latest.projected_monthly_amount))

            rates = {}
            for scenario in ["pessimistic", "realistic", "optimistic"]:
                pension_rate = getattr(p, f"{scenario}_rate", None)
                if pension_rate is not None:
                    rates[scenario] = Decimal(str(pension_rate))
                elif app_settings is not None and hasattr(app_settings, f"state_pension_{scenario}_rate"):
                    rates[scenario] = Decimal(str(getattr(app_settings, f"state_pension_{scenario}_rate")))
                else:
                    rates[scenario] = default_rates[scenario]

            result.append((base, rates["pessimistic"], base, rates["realistic"], base, rates["optimistic"]))
        return result

    def _yearly_capital(self, pensions, pension_type: str, svc: PensionSeriesProjectionService, app_settings, retirement_date, num_years: int) -> dict:
        """
        Build full monthly projection series for all active pensions of a type,
        and extract capital values at yearly intervals (year 0 = today, year Y = Y*12 months).

        Returns {scenario: {year_index: Decimal}} for pessimistic/realistic/optimistic.
        """
        result = {
            s: {y: Decimal("0") for y in range(num_years)}
            for s in ("pessimistic", "realistic", "optimistic")
        }

        for p in pensions:
            if p.status != PensionStatus.ACTIVE:
                continue
            start_value, _ = svc._start_value_and_steps(p, pension_type)
            series = svc.build_scenario_series(p, pension_type, app_settings, retirement_date)

            for scenario in ("pessimistic", "realistic", "optimistic"):
                pts = getattr(series, scenario)
                result[scenario][0] += start_value
                for y in range(1, num_years):
                    idx = y * 12 - 1
                    if pts:
                        result[scenario][y] += pts[min(idx, len(pts) - 1)].value

        return result


gap_analysis_service = GapAnalysisService()
