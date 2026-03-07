from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class RetirementGapConfigCreate(BaseModel):
    net_monthly_income: Decimal = Field(..., gt=0)
    desired_monthly_pension: Optional[Decimal] = Field(None, gt=0)
    replacement_rate: Decimal = Field(Decimal("0.80"), ge=Decimal("0.50"), le=Decimal("1.00"))
    withdrawal_rate: Decimal = Field(Decimal("0.04"), ge=Decimal("0.02"), le=Decimal("0.06"))
    annual_salary_growth_rate: Decimal = Field(Decimal("2.0"), ge=Decimal("0"), le=Decimal("10"))
    pension_deduction_rate: Optional[Decimal] = Field(None, ge=Decimal("0"), le=Decimal("50"))


class RetirementGapConfigUpdate(BaseModel):
    net_monthly_income: Optional[Decimal] = Field(None, gt=0)
    desired_monthly_pension: Optional[Decimal] = None  # null = clear override
    replacement_rate: Optional[Decimal] = Field(None, ge=Decimal("0.50"), le=Decimal("1.00"))
    withdrawal_rate: Optional[Decimal] = Field(None, ge=Decimal("0.02"), le=Decimal("0.06"))
    annual_salary_growth_rate: Optional[Decimal] = Field(None, ge=Decimal("0"), le=Decimal("10"))
    pension_deduction_rate: Optional[Decimal] = Field(None, ge=Decimal("0"), le=Decimal("50"))


class RetirementGapConfigResponse(BaseModel):
    id: int
    member_id: int
    net_monthly_income: Decimal
    desired_monthly_pension: Optional[Decimal]
    replacement_rate: Decimal
    withdrawal_rate: Decimal
    annual_salary_growth_rate: Decimal
    pension_deduction_rate: Optional[Decimal]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GapScenarios(BaseModel):
    pessimistic: Decimal
    realistic: Decimal
    optimistic: Decimal


class GapBreakdown(BaseModel):
    state_monthly: GapScenarios
    company_monthly: Decimal
    insurance_monthly: Decimal
    etf_projected: GapScenarios
    savings_projected: GapScenarios


class GapAnalysisResult(BaseModel):
    member_id: int
    needed_monthly: Decimal
    needed_monthly_at_retirement: Decimal
    salary_at_retirement: Decimal
    uses_override: bool
    monthly_pension_income: GapScenarios
    remaining_monthly_gap: GapScenarios
    required_capital: GapScenarios
    years_to_retirement: float
    required_capital_adjusted: GapScenarios
    projected_capital: GapScenarios
    gap: GapScenarios
    breakdown: GapBreakdown
    retirement_already_reached: bool


class GapTimelinePoint(BaseModel):
    year: int
    years_from_now: float
    required_monthly: Decimal
    pension_income: GapScenarios
    state_income: GapScenarios
    fixed_income: Decimal
    capital_income: GapScenarios


class GapTimeline(BaseModel):
    member_id: int
    start_year: int
    retirement_year: int
    points: list[GapTimelinePoint]
    gap_at_retirement: GapScenarios
