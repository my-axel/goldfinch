from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class RetirementGapConfigCreate(BaseModel):
    net_monthly_income: Decimal = Field(..., gt=0)
    desired_monthly_pension: Optional[Decimal] = Field(None, gt=0)
    replacement_rate: Decimal = Field(Decimal("0.80"), ge=Decimal("0.50"), le=Decimal("1.00"))
    withdrawal_rate: Decimal = Field(Decimal("0.04"), ge=Decimal("0.02"), le=Decimal("0.06"))


class RetirementGapConfigUpdate(BaseModel):
    net_monthly_income: Optional[Decimal] = Field(None, gt=0)
    desired_monthly_pension: Optional[Decimal] = None  # null = clear override
    replacement_rate: Optional[Decimal] = Field(None, ge=Decimal("0.50"), le=Decimal("1.00"))
    withdrawal_rate: Optional[Decimal] = Field(None, ge=Decimal("0.02"), le=Decimal("0.06"))


class RetirementGapConfigResponse(BaseModel):
    id: int
    member_id: int
    net_monthly_income: Decimal
    desired_monthly_pension: Optional[Decimal]
    replacement_rate: Decimal
    withdrawal_rate: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GapScenarios(BaseModel):
    pessimistic: Decimal
    realistic: Decimal
    optimistic: Decimal


class GapBreakdown(BaseModel):
    state_monthly: Decimal
    company_monthly: Decimal
    insurance_monthly: Decimal
    etf_projected: GapScenarios
    savings_projected: GapScenarios


class GapAnalysisResult(BaseModel):
    member_id: int
    needed_monthly: Decimal
    uses_override: bool
    monthly_pension_income: Decimal
    remaining_monthly_gap: Decimal
    required_capital: Decimal
    years_to_retirement: float
    required_capital_adjusted: Decimal
    projected_capital: GapScenarios
    gap: GapScenarios
    breakdown: GapBreakdown
    retirement_already_reached: bool
