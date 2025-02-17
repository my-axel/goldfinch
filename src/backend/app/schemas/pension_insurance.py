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
    pension_insurance_id: int

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
    pension_insurance_id: int

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
    pension_insurance_id: int

    class Config:
        from_attributes = True

class PensionInsuranceBase(BaseModel):
    name: str
    member_id: int
    notes: Optional[str] = None
    provider: str
    contract_number: str
    start_date: date
    guaranteed_interest: Decimal = Field(ge=0)
    expected_return: Decimal = Field(ge=0)

class PensionInsuranceCreate(PensionInsuranceBase):
    contribution_plan_steps: List[ContributionPlanStepCreate]

class PensionInsuranceResponse(PensionInsuranceBase):
    id: int
    current_value: Decimal
    contribution_plan_steps: List[ContributionPlanStepResponse]
    contribution_plan: List[ContributionPlanResponse]
    contribution_history: List[ContributionHistoryResponse]

    class Config:
        from_attributes = True

class PensionInsuranceUpdate(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    provider: Optional[str] = None
    contract_number: Optional[str] = None
    guaranteed_interest: Optional[Decimal] = None
    expected_return: Optional[Decimal] = None
    contribution_plan_steps: Optional[List[ContributionPlanStepCreate]] = None 