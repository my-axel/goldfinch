from pydantic import BaseModel, Field
from datetime import date
from typing import Optional, List
from enum import Enum
from app.schemas.etf import ETFResponse

class ContributionFrequency(str, Enum):
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    SEMI_ANNUALLY = "SEMI_ANNUALLY"
    ANNUALLY = "ANNUALLY"
    ONE_TIME = "ONE_TIME"

class PensionType(str, Enum):
    ETF_PLAN = "ETF_PLAN"
    INSURANCE = "INSURANCE"
    COMPANY = "COMPANY"
    GOVERNMENT = "GOVERNMENT"
    OTHER = "OTHER"

class ContributionStepBase(BaseModel):
    amount: float = Field(gt=0)
    frequency: ContributionFrequency
    start_date: date
    end_date: Optional[date] = None

class ContributionStepCreate(ContributionStepBase):
    pass

class ContributionStepResponse(ContributionStepBase):
    id: int

    class Config:
        from_attributes = True

class ETFAllocationBase(BaseModel):
    etf_id: str
    amount: float
    units_bought: float

class ContributionStatus(str, Enum):
    PLANNED = "PLANNED"
    REALIZED = "REALIZED"
    SKIPPED = "SKIPPED"
    MODIFIED = "MODIFIED"

class ContributionBase(BaseModel):
    date: date
    amount: float
    planned_amount: float
    is_manual_override: bool = False
    etf_allocations: List[ETFAllocationBase]
    note: Optional[str] = None
    status: ContributionStatus = ContributionStatus.PLANNED

class PensionBase(BaseModel):
    name: str
    member_id: int
    type: PensionType
    start_date: date
    initial_capital: float = Field(ge=0)
    current_value: float = Field(ge=0)
    notes: Optional[str] = None

class ETFPensionCreate(PensionBase):
    type: PensionType = PensionType.ETF_PLAN
    etf_id: str
    contribution_plan: List[ContributionStepBase] = []

class InsurancePensionCreate(PensionBase):
    type: PensionType = PensionType.INSURANCE
    provider: str
    contract_number: str
    guaranteed_interest: float
    expected_return: float

class CompanyPensionCreate(PensionBase):
    type: PensionType = PensionType.COMPANY
    employer: str
    vesting_period: int
    matching_percentage: Optional[float] = None
    max_employer_contribution: Optional[float] = None

class PensionResponse(PensionBase):
    id: int

    class Config:
        from_attributes = True

class ETFPensionResponse(PensionBase):
    id: int
    type: PensionType = PensionType.ETF_PLAN
    etf_id: str
    etf: Optional[ETFResponse] = None
    contribution_plan: List[ContributionStepResponse] = []

    class Config:
        from_attributes = True

class InsurancePensionResponse(PensionBase):
    id: int
    type: PensionType = PensionType.INSURANCE
    # provider: str
    # contract_number: str
    # guaranteed_interest: float
    # expected_return: float

    class Config:
        from_attributes = True

class CompanyPensionResponse(PensionBase):
    id: int
    type: PensionType = PensionType.COMPANY
    # employer: str
    # vesting_period: int
    matching_percentage: Optional[float] = None
    max_employer_contribution: Optional[float] = None

    class Config:
        from_attributes = True

class ETFPensionUpdate(BaseModel):
    name: Optional[str] = None
    member_id: Optional[int] = None
    start_date: Optional[date] = None
    initial_capital: Optional[float] = Field(ge=0, default=None)
    notes: Optional[str] = None
    etf_id: Optional[str] = None
    contribution_plan: Optional[List[ContributionStepBase]] = None

class InsurancePensionUpdate(BaseModel):
    name: Optional[str] = None
    member_id: Optional[int] = None
    start_date: Optional[date] = None
    initial_capital: Optional[float] = Field(ge=0, default=None)
    notes: Optional[str] = None
    provider: Optional[str] = None
    contract_number: Optional[str] = None
    guaranteed_interest: Optional[float] = None
    expected_return: Optional[float] = None

class CompanyPensionUpdate(BaseModel):
    name: Optional[str] = None
    member_id: Optional[int] = None
    start_date: Optional[date] = None
    initial_capital: Optional[float] = Field(ge=0, default=None)
    notes: Optional[str] = None
    employer: Optional[str] = None
    vesting_period: Optional[int] = None
    matching_percentage: Optional[float] = None
    max_employer_contribution: Optional[float] = None 