"""
Schemas for pension time series endpoints.

Each pension type exposes a /series endpoint returning historical data points
and future projection scenarios. The dashboard aggregate endpoint combines
all types into a single response.
"""
from datetime import date
from decimal import Decimal
from typing import Dict, List, Optional

from pydantic import BaseModel


class HistoricalDataPoint(BaseModel):
    """A single historical value data point for a pension."""
    date: date
    value: Decimal
    contributions_to_date: Optional[Decimal] = None


class ProjectionDataPoint(BaseModel):
    """A single projected data point (future)."""
    date: date
    value: Decimal


class ScenarioSeries(BaseModel):
    """Three-scenario projection time series (monthly data points)."""
    pessimistic: List[ProjectionDataPoint]
    realistic: List[ProjectionDataPoint]
    optimistic: List[ProjectionDataPoint]


class PensionSeriesResponse(BaseModel):
    """Full time series for one pension plan."""
    pension_id: int
    pension_type: str
    name: str
    member_id: int
    historical: List[HistoricalDataPoint]
    projection: ScenarioSeries
    # Only populated for state pensions — monthly payout projection
    monthly_projection: Optional[ScenarioSeries] = None


class ContributionSummary(BaseModel):
    """Aggregated contribution metrics across selected pensions."""
    total_to_date: Decimal
    this_year: Decimal
    total_returns: Decimal          # current_value - total_to_date
    returns_percentage: Optional[Decimal] = None  # returns / total_to_date * 100


class AggregateTypeBreakdown(BaseModel):
    """Historical + projection aggregate for a single pension type."""
    historical: List[HistoricalDataPoint]
    projection: ScenarioSeries


class AggregateMetadata(BaseModel):
    """Metadata about the aggregate series response."""
    member_id: Optional[int] = None  # None = entire household
    pension_count: int
    earliest_date: Optional[date] = None
    retirement_date: Optional[date] = None
    contributions: ContributionSummary
    rates_used: Dict[str, Dict[str, Decimal]]  # e.g. {"ETF_PLAN": {"pessimistic": 4.0}}


class AggregateSeriesResponse(BaseModel):
    """
    Household-level or member-level aggregate time series.

    - historical: summed across all pensions using LOCF date alignment
    - projection: summed scenarios across all pensions
    - by_type: per-pension-type breakdown
    - metadata: contribution totals, rates used, date range
    """
    historical: List[HistoricalDataPoint]
    projection: ScenarioSeries
    by_type: Dict[str, AggregateTypeBreakdown]
    metadata: AggregateMetadata
