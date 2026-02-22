from datetime import date
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.etf_update import ETFUpdateResponse, ETFErrorResponse
from app.models.enums import PensionStatus

class ETFResponse(BaseModel):
    id: str
    name: str
    symbol: str
    isin: Optional[str] = None
    currency: str
    last_price: Optional[Decimal] = None
    last_update: Optional[date] = None
    asset_class: Optional[str] = None
    domicile: Optional[str] = None
    inception_date: Optional[date] = None
    fund_size: Optional[Decimal] = None
    ter: Optional[Decimal] = None
    distribution_policy: Optional[str] = None
    ytd_return: Optional[Decimal] = None
    one_year_return: Optional[Decimal] = None
    volatility_30d: Optional[Decimal] = None
    sharpe_ratio: Optional[Decimal] = None
    updates: Optional[List[ETFUpdateResponse]] = None
    errors: Optional[List[ETFErrorResponse]] = None

    model_config = ConfigDict(from_attributes=True)

class ContributionPlanStepBase(BaseModel):
    amount: Decimal = Field(gt=0)
    frequency: str  # MONTHLY, QUARTERLY, etc.
    start_date: date
    end_date: Optional[date] = None
    note: Optional[str] = None

class ContributionPlanStepCreate(ContributionPlanStepBase):
    pass

class ContributionPlanStepResponse(ContributionPlanStepBase):
    id: int
    pension_etf_id: int

    model_config = ConfigDict(from_attributes=True)

class ContributionHistoryBase(BaseModel):
    contribution_date: date
    amount: Decimal = Field(ge=0)
    is_manual: bool = False
    note: Optional[str] = None

class ContributionHistoryCreate(ContributionHistoryBase):
    pass

class ContributionHistoryResponse(ContributionHistoryBase):
    id: int
    pension_etf_id: int

    model_config = ConfigDict(from_attributes=True)

class PensionETFBase(BaseModel):
    name: str
    member_id: int
    notes: Optional[str] = None
    etf_id: str
    existing_units: Optional[float] = None
    reference_date: Optional[date] = None
    status: PensionStatus = PensionStatus.ACTIVE
    paused_at: Optional[date] = None
    resume_at: Optional[date] = None

class PensionETFCreate(PensionETFBase):
    contribution_plan_steps: List[ContributionPlanStepCreate]
    realize_historical_contributions: bool = False

class PensionETFResponse(PensionETFBase):
    id: int
    current_value: Decimal
    total_units: Decimal
    etf: Optional[ETFResponse] = None
    contribution_plan_steps: List[ContributionPlanStepResponse]
    contribution_history: List[ContributionHistoryResponse]

    model_config = ConfigDict(from_attributes=True)

class PensionETFUpdate(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    contribution_plan_steps: Optional[List[ContributionPlanStepCreate]] = None
    status: Optional[PensionStatus] = None
    paused_at: Optional[date] = None
    resume_at: Optional[date] = None

class PensionStatusUpdate(BaseModel):
    status: PensionStatus
    paused_at: Optional[date] = None
    resume_at: Optional[date] = None

class PensionStatistics(BaseModel):
    total_invested_amount: Decimal = Field(ge=0)
    current_value: Decimal = Field(ge=0)
    total_return: Decimal
    annual_return: Optional[Decimal] = None
    contribution_history: List[ContributionHistoryResponse]
    value_history: List[dict] = Field(
        description="List of historical values with dates",
        json_schema_extra={
            "example": [{"date": "2024-01-01", "value": "1000.00"}]
        }
    )

class ETFPensionListSchema(BaseModel):
    """Lightweight schema for ETF pensions in list view"""
    id: int
    name: str
    member_id: int
    current_value: float
    total_units: Decimal
    etf_id: str
    etf_name: str  # Include ETF name for display in the list
    status: PensionStatus
    is_existing_investment: bool
    existing_units: Optional[float] = None
    paused_at: Optional[date] = None
    resume_at: Optional[date] = None
    current_step_amount: Optional[Decimal] = None
    current_step_frequency: Optional[str] = None

    model_config = ConfigDict(from_attributes=True) 