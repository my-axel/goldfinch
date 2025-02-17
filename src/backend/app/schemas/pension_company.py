from datetime import date
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field

class ContributionPlanStepBase(BaseModel):
    amount: Decimal = Field(gt=0)
    frequency: str  # Usually MONTHLY
    start_date: date
    end_date: Optional[date] = None

class ContributionPlanStepCreate(ContributionPlanStepBase):
    pass

class ContributionPlanStepResponse(ContributionPlanStepBase):
    id: int
    pension_company_id: int

    class Config:
        from_attributes = True

class ContributionPlanBase(BaseModel):
    date: date
    employee_amount: Decimal = Field(ge=0)
    employer_amount: Decimal = Field(ge=0)
    note: Optional[str] = None

class ContributionPlanCreate(ContributionPlanBase):
    pass

class ContributionPlanResponse(ContributionPlanBase):
    id: int
    pension_company_id: int

    class Config:
        from_attributes = True

class ContributionHistoryBase(BaseModel):
    date: date
    employee_amount: Decimal = Field(ge=0)
    employer_amount: Decimal = Field(ge=0)
    is_manual: bool = False
    note: Optional[str] = None

class ContributionHistoryCreate(ContributionHistoryBase):
    pass

class ContributionHistoryResponse(ContributionHistoryBase):
    id: int
    pension_company_id: int

    class Config:
        from_attributes = True

class PensionCompanyBase(BaseModel):
    name: str
    member_id: int
    notes: Optional[str] = None
    employer: str
    start_date: date
    vesting_period: int = Field(ge=0)
    matching_percentage: Optional[Decimal] = Field(ge=0)
    max_employer_contribution: Optional[Decimal] = Field(ge=0)

class PensionCompanyCreate(PensionCompanyBase):
    contribution_plan_steps: List[ContributionPlanStepCreate]

class PensionCompanyResponse(PensionCompanyBase):
    id: int
    current_value: Decimal
    contribution_plan_steps: List[ContributionPlanStepResponse]
    contribution_plan: List[ContributionPlanResponse]
    contribution_history: List[ContributionHistoryResponse]

    class Config:
        from_attributes = True

class PensionCompanyUpdate(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    employer: Optional[str] = None
    vesting_period: Optional[int] = None
    matching_percentage: Optional[Decimal] = None
    max_employer_contribution: Optional[Decimal] = None
    contribution_plan_steps: Optional[List[ContributionPlanStepCreate]] = None 