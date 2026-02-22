"""
Dashboard aggregate endpoint.

GET /api/v1/dashboard/series

Returns a unified time series combining historical and projection data
across all pension types for a household or individual member.

Historical series uses LOCF (Last Observation Carried Forward) to align
sparse statement data to a common date axis, then sums across all pensions.

Projection series sums each pension's monthly scenario projections for
pessimistic, realistic, and optimistic scenarios.
"""
from datetime import date
from decimal import Decimal
from typing import Dict, List, Optional, Tuple

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1 import deps
from app.crud.pension_etf import pension_etf
from app.crud.pension_company import pension_company
from app.crud.pension_insurance import pension_insurance
from app.crud.pension_state import pension_state
from app.crud.pension_savings import pension_savings
from app.crud.settings import settings
from app.services.pension_historical_series import PensionHistoricalSeriesService
from app.services.pension_series_projection import PensionSeriesProjectionService
from app.services.pension_contributions_summary import PensionContributionSummaryService
from app.schemas.pension_series import (
    AggregateSeriesResponse,
    AggregateTypeBreakdown,
    AggregateMetadata,
    HistoricalDataPoint,
    ProjectionDataPoint,
    ScenarioSeries,
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"],
)


def _locf_fill(
    historical: List[HistoricalDataPoint],
    all_dates: List[date],
) -> Dict[date, Decimal]:
    """
    Apply Last-Observation-Carried-Forward to fill a pension's value at every
    date in `all_dates`.

    If a pension has no data before a given date, its value is 0 for that date.
    """
    if not historical:
        return {d: Decimal("0") for d in all_dates}

    # Build a sorted lookup from actual data
    sorted_points = sorted(historical, key=lambda p: p.date)
    point_map: Dict[date, Decimal] = {p.date: p.value for p in sorted_points}
    sorted_known_dates = sorted(point_map.keys())

    import bisect
    result: Dict[date, Decimal] = {}
    for d in all_dates:
        idx = bisect.bisect_right(sorted_known_dates, d) - 1
        if idx >= 0:
            result[d] = point_map[sorted_known_dates[idx]]
        else:
            result[d] = Decimal("0")
    return result


def _sum_scenario_series(
    series_list: List[ScenarioSeries],
    all_dates: List[date],
) -> ScenarioSeries:
    """
    Sum multiple ScenarioSeries into one by adding values at each date.

    Uses LOCF within each series for date gaps. Dates not present in a
    series get value 0 (the pension isn't contributing beyond its retirement date).
    """
    pess: Dict[date, Decimal] = {d: Decimal("0") for d in all_dates}
    real: Dict[date, Decimal] = {d: Decimal("0") for d in all_dates}
    opt: Dict[date, Decimal] = {d: Decimal("0") for d in all_dates}

    for series in series_list:
        for scenario_name, target in [("pessimistic", pess), ("realistic", real), ("optimistic", opt)]:
            points = getattr(series, scenario_name)
            point_map = {p.date: p.value for p in points}
            for d in all_dates:
                target[d] = target[d] + point_map.get(d, Decimal("0"))

    return ScenarioSeries(
        pessimistic=[ProjectionDataPoint(date=d, value=pess[d]) for d in all_dates],
        realistic=[ProjectionDataPoint(date=d, value=real[d]) for d in all_dates],
        optimistic=[ProjectionDataPoint(date=d, value=opt[d]) for d in all_dates],
    )


def _collect_all_pensions(
    db: Session,
    member_id: Optional[int],
    pension_type_filter: Optional[str],
) -> List[Tuple]:
    """
    Fetch all pensions (with relationships loaded) optionally filtered by member and type.

    Uses the base get_multi() which supports `filters` dict for member_id.
    Returns list of (pension_model, pension_type_str) tuples.
    """
    type_to_crud = {
        "STATE":     (pension_state,     "STATE"),
        "SAVINGS":   (pension_savings,   "SAVINGS"),
        "INSURANCE": (pension_insurance, "INSURANCE"),
        "COMPANY":   (pension_company,   "COMPANY"),
        "ETF_PLAN":  (pension_etf,       "ETF_PLAN"),
    }

    types_to_load = [pension_type_filter] if pension_type_filter else list(type_to_crud.keys())
    filters = {"member_id": member_id} if member_id else None

    result = []
    for type_str in types_to_load:
        crud_instance, label = type_to_crud[type_str]
        pensions = crud_instance.get_multi(db=db, filters=filters)
        for p in pensions:
            result.append((p, label))
    return result


@router.get("/series", response_model=AggregateSeriesResponse)
def get_aggregate_series(
    db: Session = Depends(deps.get_db),
    member_id: Optional[int] = Query(None, description="Filter to a specific household member"),
    pension_type: Optional[str] = Query(None, description="Filter to a specific pension type (STATE, SAVINGS, INSURANCE, COMPANY, ETF_PLAN)"),
) -> AggregateSeriesResponse:
    """
    Aggregate time series for the entire household or a specific member.

    Combines historical and projection data across all pension types.

    **Historical:** Statement-based values, LOCF-aligned to a common monthly date axis.
    **Projection:** Monthly compound-growth scenarios (pessimistic/realistic/optimistic)
                   summed across all pensions until their respective retirement dates.
    **Metadata:** Contribution totals, rates used, date range.
    """
    settings_obj = settings.get_settings(db)
    historical_svc = PensionHistoricalSeriesService()
    projection_svc = PensionSeriesProjectionService()
    contribution_svc = PensionContributionSummaryService()

    # --- 1. Load all relevant pensions ---
    pensions_with_types = _collect_all_pensions(db, member_id, pension_type)

    if not pensions_with_types:
        empty_scenarios = ScenarioSeries(pessimistic=[], realistic=[], optimistic=[])
        empty_contributions = contribution_svc.compute([], Decimal("0"))
        return AggregateSeriesResponse(
            historical=[],
            projection=empty_scenarios,
            by_type={},
            metadata=AggregateMetadata(
                member_id=member_id,
                pension_count=0,
                earliest_date=None,
                retirement_date=None,
                contributions=empty_contributions,
                rates_used={},
            ),
        )

    # --- 2. Compute per-pension historical series ---
    pension_historicals: List[Tuple[str, List[HistoricalDataPoint]]] = []
    for pension, type_str in pensions_with_types:
        if type_str == "STATE":
            hist = historical_svc.get_historical_state(pension)
        elif type_str == "SAVINGS":
            hist = historical_svc.get_historical_savings(pension)
        elif type_str == "INSURANCE":
            hist = historical_svc.get_historical_insurance(pension)
        elif type_str == "COMPANY":
            hist = historical_svc.get_historical_company(pension)
        else:  # ETF_PLAN
            hist = historical_svc.get_historical_etf(pension, db, pension_etf)
        pension_historicals.append((type_str, hist))

    # --- 3. Collect all unique historical dates and sort ---
    all_hist_dates: List[date] = sorted(set(
        p.date
        for _, hist in pension_historicals
        for p in hist
    ))

    # --- 4. LOCF-aggregate historical series ---
    total_by_date: Dict[date, Decimal] = {d: Decimal("0") for d in all_hist_dates}
    by_type_hist: Dict[str, Dict[date, Decimal]] = {}

    for (type_str, hist), _ in zip(pension_historicals, pensions_with_types):
        filled = _locf_fill(hist, all_hist_dates)
        for d, v in filled.items():
            total_by_date[d] = total_by_date[d] + v
        if type_str not in by_type_hist:
            by_type_hist[type_str] = {d: Decimal("0") for d in all_hist_dates}
        for d, v in filled.items():
            by_type_hist[type_str][d] = by_type_hist[type_str][d] + v

    aggregate_historical = [
        HistoricalDataPoint(date=d, value=total_by_date[d])
        for d in all_hist_dates
    ]

    # --- 5. Compute per-pension projections ---
    pension_projections: List[Tuple[str, ScenarioSeries]] = []
    by_type_projections: Dict[str, List[ScenarioSeries]] = {}
    rates_used: Dict[str, Dict[str, Decimal]] = {}
    max_retirement_date: Optional[date] = None

    for pension, type_str in pensions_with_types:
        retirement_date = pension.member.retirement_date_planned if pension.member else None
        if retirement_date and (max_retirement_date is None or retirement_date > max_retirement_date):
            max_retirement_date = retirement_date

        proj = projection_svc.build_scenario_series(pension, type_str, settings_obj, retirement_date)
        pension_projections.append((type_str, proj))

        if type_str not in by_type_projections:
            by_type_projections[type_str] = []
        by_type_projections[type_str].append(proj)

        if type_str not in rates_used:
            rates = projection_svc.get_rates(pension, type_str, settings_obj)
            rates_used[type_str] = rates

    # --- 6. Collect all projection dates and sum scenarios ---
    all_proj_dates: List[date] = sorted(set(
        p.date
        for _, proj in pension_projections
        for p in proj.realistic
    ))

    aggregate_projection = _sum_scenario_series(
        [proj for _, proj in pension_projections],
        all_proj_dates
    )

    # --- 7. Build by_type breakdown ---
    by_type: Dict[str, AggregateTypeBreakdown] = {}
    for type_str in set(t for _, t in pensions_with_types):
        type_hist_dates = sorted(by_type_hist.get(type_str, {}).keys())
        type_historical = [
            HistoricalDataPoint(date=d, value=by_type_hist[type_str][d])
            for d in type_hist_dates
        ]
        type_proj_dates: List[date] = sorted(set(
            p.date
            for proj in by_type_projections.get(type_str, [])
            for p in proj.realistic
        ))
        type_projection = _sum_scenario_series(
            by_type_projections.get(type_str, []),
            type_proj_dates
        )
        by_type[type_str] = AggregateTypeBreakdown(
            historical=type_historical,
            projection=type_projection,
        )

    # --- 8. Contribution summary ---
    current_total = total_by_date.get(max(all_hist_dates), Decimal("0")) if all_hist_dates else Decimal("0")
    contributions = contribution_svc.compute(pensions_with_types, current_total)

    # --- 9. Build metadata ---
    earliest_date = all_hist_dates[0] if all_hist_dates else None
    retirement_date_for_meta = (
        pension.member.retirement_date_planned
        if member_id and pensions_with_types and pensions_with_types[0][0].member
        else max_retirement_date
    )

    metadata = AggregateMetadata(
        member_id=member_id,
        pension_count=len(pensions_with_types),
        earliest_date=earliest_date,
        retirement_date=retirement_date_for_meta,
        contributions=contributions,
        rates_used=rates_used,
    )

    return AggregateSeriesResponse(
        historical=aggregate_historical,
        projection=aggregate_projection,
        by_type=by_type,
        metadata=metadata,
    )
