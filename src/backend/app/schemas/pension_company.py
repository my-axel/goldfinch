from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.enums import ContributionFrequency, PensionStatus


class ContributionPlanStepBase(BaseModel):
    amount: Decimal = Field(gt=0)
    frequency: ContributionFrequency
    start_date: date
    end_date: Optional[date] = None
    note: Optional[str] = None

class ContributionPlanStepCreate(ContributionPlanStepBase):
    pass

class ContributionPlanStepResponse(ContributionPlanStepBase):
    id: int
    pension_company_id: int

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
    pension_company_id: int

    class Config:
        from_attributes = True

class PensionCompanyRetirementProjectionBase(BaseModel):
    retirement_age: int = Field(ge=0)
    monthly_payout: Decimal = Field(ge=0)
    total_capital: Decimal = Field(ge=0)

class PensionCompanyRetirementProjectionCreate(PensionCompanyRetirementProjectionBase):
    pass

class PensionCompanyRetirementProjectionResponse(PensionCompanyRetirementProjectionBase):
    id: int
    statement_id: int

    class Config:
        from_attributes = True

class PensionCompanyRetirementProjectionUpdate(BaseModel):
    retirement_age: Optional[int] = None
    monthly_payout: Optional[Decimal] = None
    total_capital: Optional[Decimal] = None

# Base schema with common attributes
class PensionCompanyStatementBase(BaseModel):
    statement_date: date
    notes: Optional[str] = None


# Schema for creating a new statement
class PensionCompanyStatementCreate(PensionCompanyStatementBase):
    projections: List[PensionCompanyRetirementProjectionCreate]


# Schema for updating an existing statement
class PensionCompanyStatementUpdate(BaseModel):
    statement_date: Optional[date] = None
    notes: Optional[str] = None
    projections: Optional[List[PensionCompanyRetirementProjectionCreate]] = None


# Schema for response
class PensionCompanyStatementResponse(PensionCompanyStatementBase):
    id: int
    pension_id: int
    created_at: datetime
    projections: List[PensionCompanyRetirementProjectionResponse]

    class Config:
        from_attributes = True

class PensionCompanyBase(BaseModel):
    name: str
    member_id: int
    notes: Optional[str] = None
    employer: str
    start_date: date
    contribution_amount: Optional[Decimal] = None
    contribution_frequency: Optional[ContributionFrequency] = None
    status: PensionStatus = PensionStatus.ACTIVE
    paused_at: Optional[date] = None
    resume_at: Optional[date] = None

class PensionCompanyCreate(PensionCompanyBase):
    contribution_plan_steps: List[ContributionPlanStepCreate] = []

class PensionCompanyResponse(PensionCompanyBase):
    id: int
    current_value: Decimal
    contribution_plan_steps: List[ContributionPlanStepResponse]
    contribution_history: List[ContributionHistoryResponse]
    statements: List[PensionCompanyStatementResponse]

    class Config:
        from_attributes = True

class PensionCompanyUpdate(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    employer: Optional[str] = None
    contribution_amount: Optional[Decimal] = None
    contribution_frequency: Optional[ContributionFrequency] = None
    contribution_plan_steps: Optional[List[ContributionPlanStepCreate]] = None
    status: Optional[PensionStatus] = None
    paused_at: Optional[date] = None
    resume_at: Optional[date] = None

class PensionStatusUpdate(BaseModel):
    status: PensionStatus
    paused_at: Optional[date] = None
    resume_at: Optional[date] = None 