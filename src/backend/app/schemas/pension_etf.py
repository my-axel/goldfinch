from datetime import date
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field

class ETFResponse(BaseModel):
    id: str
    name: str
    symbol: str
    isin: str
    currency: str
    price: Decimal
    price_date: date

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

class AllocationPlanBase(BaseModel):
    etf_id: str
    amount: Decimal = Field(ge=0)
    percentage: Decimal = Field(ge=0, le=100)

class AllocationPlanCreate(AllocationPlanBase):
    pass

class AllocationPlanResponse(AllocationPlanBase):
    id: int
    pension_etf_contribution_plan_id: int

    class Config:
        from_attributes = True

class ContributionPlanBase(BaseModel):
    date: date
    amount: Decimal = Field(ge=0)
    note: Optional[str] = None

class ContributionPlanCreate(ContributionPlanBase):
    allocations: List[AllocationPlanCreate]

class ContributionPlanResponse(ContributionPlanBase):
    id: int
    pension_etf_id: int
    allocations: List[AllocationPlanResponse]

    class Config:
        from_attributes = True

class AllocationHistoryBase(BaseModel):
    etf_id: str
    amount: Decimal = Field(ge=0)
    units: Decimal = Field(ge=0)
    price_per_unit: Decimal = Field(ge=0)
    percentage: Decimal = Field(ge=0, le=100)

class AllocationHistoryCreate(AllocationHistoryBase):
    pass

class AllocationHistoryResponse(AllocationHistoryBase):
    id: int
    pension_etf_contribution_history_id: int

    class Config:
        from_attributes = True

class ContributionHistoryBase(BaseModel):
    date: date
    amount: Decimal = Field(ge=0)
    is_manual: bool = False
    note: Optional[str] = None

class ContributionHistoryCreate(ContributionHistoryBase):
    allocations: List[AllocationHistoryCreate]

class ContributionHistoryResponse(ContributionHistoryBase):
    id: int
    pension_etf_id: int
    allocations: List[AllocationHistoryResponse]

    class Config:
        from_attributes = True

class PensionETFBase(BaseModel):
    name: str
    member_id: int
    notes: Optional[str] = None
    etf_id: str

class PensionETFCreate(PensionETFBase):
    contribution_plan_steps: List[ContributionPlanStepCreate]

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