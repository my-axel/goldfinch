from datetime import date
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict, model_validator

from app.models.enums import PensionStatus, ContributionFrequency, CompoundingFrequency

class ContributionPlanStepBase(BaseModel):
    amount: Decimal = Field(gt=0, description="Amount to contribute per period")
    frequency: ContributionFrequency = Field(description="How often contributions are made")
    start_date: date = Field(description="When contributions begin")
    end_date: Optional[date] = Field(default=None, description="When contributions end (if applicable)")
    note: Optional[str] = Field(default=None, description="Optional note about this contribution step")
    
    @field_validator('end_date')
    def validate_end_date_after_start_date(cls, v, info):
        if v is not None and v < info.data.get('start_date'):
            raise ValueError("End date must be after start date")
        return v

class ContributionPlanStepCreate(ContributionPlanStepBase):
    pass

class ContributionPlanStepResponse(ContributionPlanStepBase):
    id: int
    pension_savings_id: int
    
    model_config = ConfigDict(from_attributes=True)

class PensionSavingsStatementBase(BaseModel):
    statement_date: date = Field(description="Date of the account statement")
    balance: Decimal = Field(ge=0, description="Account balance at statement date")
    note: Optional[str] = Field(default=None, description="Optional note about this statement")

class PensionSavingsStatementCreate(PensionSavingsStatementBase):
    pass

class PensionSavingsStatementUpdate(BaseModel):
    statement_date: Optional[date] = None
    balance: Optional[Decimal] = Field(default=None, ge=0)
    note: Optional[str] = None

class PensionSavingsStatementResponse(PensionSavingsStatementBase):
    id: int
    pension_id: int
    
    model_config = ConfigDict(from_attributes=True)

class PensionSavingsBase(BaseModel):
    name: str = Field(min_length=1, description="Name of the savings account")
    member_id: int = Field(gt=0, description="ID of the household member who owns this account")
    start_date: date = Field(description="When the savings account was started")
    notes: Optional[str] = Field(default=None, description="Optional notes about this savings account")
    
    pessimistic_rate: Decimal = Field(
        default=Decimal("2.0"),
        ge=0, le=20,
        description="Annual interest rate (%) for pessimistic scenario"
    )
    realistic_rate: Decimal = Field(
        default=Decimal("3.0"),
        ge=0, le=20,
        description="Annual interest rate (%) for realistic scenario"
    )
    optimistic_rate: Decimal = Field(
        default=Decimal("4.0"),
        ge=0, le=20,
        description="Annual interest rate (%) for optimistic scenario"
    )
    compounding_frequency: CompoundingFrequency = Field(
        default=CompoundingFrequency.ANNUALLY,
        description="How often interest is compounded"
    )
    status: PensionStatus = Field(
        default=PensionStatus.ACTIVE,
        description="Current status of the savings account"
    )
    paused_at: Optional[date] = Field(
        default=None,
        description="When the account was paused (if applicable)"
    )
    resume_at: Optional[date] = Field(
        default=None,
        description="When the account will resume (if applicable)"
    )
    
    @model_validator(mode='after')
    def validate_interest_rates(self):
        if self.pessimistic_rate > self.realistic_rate:
            raise ValueError("Pessimistic rate cannot be higher than realistic rate")
        if self.realistic_rate > self.optimistic_rate:
            raise ValueError("Realistic rate cannot be higher than optimistic rate")
        return self

class PensionSavingsCreate(PensionSavingsBase):
    contribution_plan_steps: List[ContributionPlanStepCreate]

class PensionSavingsUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    notes: Optional[str] = None
    pessimistic_rate: Optional[Decimal] = Field(default=None, ge=0, le=20)
    realistic_rate: Optional[Decimal] = Field(default=None, ge=0, le=20)
    optimistic_rate: Optional[Decimal] = Field(default=None, ge=0, le=20)
    compounding_frequency: Optional[CompoundingFrequency] = None
    status: Optional[PensionStatus] = None
    paused_at: Optional[date] = None
    resume_at: Optional[date] = None
    contribution_plan_steps: Optional[List[ContributionPlanStepCreate]] = None
    
    @model_validator(mode='after')
    def validate_interest_rates(self):
        # Check if we have at least two rates to compare
        if self.pessimistic_rate is not None and self.realistic_rate is not None:
            if self.pessimistic_rate > self.realistic_rate:
                raise ValueError("Pessimistic rate cannot be higher than realistic rate")
                
        if self.realistic_rate is not None and self.optimistic_rate is not None:
            if self.realistic_rate > self.optimistic_rate:
                raise ValueError("Realistic rate cannot be higher than optimistic rate")
                
        return self

class PensionSavingsResponse(PensionSavingsBase):
    id: int
    contribution_plan_steps: List[ContributionPlanStepResponse]
    statements: List[PensionSavingsStatementResponse]
    
    model_config = ConfigDict(from_attributes=True)

class PensionSavingsScenario(BaseModel):
    """Projection scenario for savings pension."""
    balance: Decimal
    retirement_age: int
    years_to_retirement: int
    growth_rate: Decimal
    total_contributions: Decimal
    balance_without_contributions: Decimal

class PensionSavingsProjection(BaseModel):
    """Complete projection including both retirement dates."""
    planned: Dict[str, PensionSavingsScenario] = {}
    possible: Dict[str, PensionSavingsScenario] = {}

class PensionSavingsListSchema(BaseModel):
    """Lightweight schema for savings pensions in list view"""
    id: int
    name: str
    member_id: int
    status: PensionStatus
    paused_at: Optional[date] = None
    resume_at: Optional[date] = None
    latest_balance: Optional[Decimal] = None
    latest_statement_date: Optional[date] = None
    pessimistic_rate: Decimal
    realistic_rate: Decimal
    optimistic_rate: Decimal
    compounding_frequency: CompoundingFrequency
    current_step_amount: Optional[Decimal] = None
    current_step_frequency: Optional[ContributionFrequency] = None
    
    model_config = ConfigDict(from_attributes=True)