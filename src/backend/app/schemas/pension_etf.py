from datetime import date
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.etf_update import ETFUpdateResponse, ETFErrorResponse

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

    class Config:
        from_attributes = True

class ContributionPlanStepBase(BaseModel):
    amount: Decimal = Field(gt=0)
    frequency: str  # MONTHLY, QUARTERLY, etc.
    start_date: date
    end_date: Optional[date] = None

class ContributionPlanStepCreate(ContributionPlanStepBase):
    pass

class ContributionPlanStepResponse(ContributionPlanStepBase):
    id: int
    pension_etf_id: int

    class Config:
        from_attributes = True

class ContributionPlanBase(BaseModel):
    date: date
    amount: Decimal = Field(ge=0)
    note: Optional[str] = None

class ContributionPlanCreate(ContributionPlanBase):
    pass

class ContributionPlanResponse(ContributionPlanBase):
    id: int
    pension_etf_id: int

    class Config:
        from_attributes = True

class ContributionHistoryBase(BaseModel):
    date: date
    amount: Decimal = Field(ge=0)
    is_manual: bool = False
    note: Optional[str] = None

class ContributionHistoryCreate(ContributionHistoryBase):
    pass

class ContributionHistoryResponse(ContributionHistoryBase):
    id: int
    pension_etf_id: int

    class Config:
        from_attributes = True

class PensionETFBase(BaseModel):
    name: str
    member_id: int
    notes: Optional[str] = None
    etf_id: str
    existing_units: Optional[float] = None
    reference_date: Optional[date] = None

class PensionETFCreate(PensionETFBase):
    contribution_plan_steps: List[ContributionPlanStepCreate]
    realize_historical_contributions: bool = False

class PensionETFResponse(PensionETFBase):
    id: int
    current_value: Decimal
    total_units: Decimal
    etf: Optional[ETFResponse] = None
    contribution_plan_steps: List[ContributionPlanStepResponse]
    contribution_plan: List[ContributionPlanResponse]
    contribution_history: List[ContributionHistoryResponse]

    class Config:
        from_attributes = True

class PensionETFUpdate(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    contribution_plan_steps: Optional[List[ContributionPlanStepCreate]] = None 