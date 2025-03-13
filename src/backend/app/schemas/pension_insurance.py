from datetime import date
from decimal import Decimal
from typing import List, Optional, Union, Literal
from pydantic import BaseModel, Field, validator, root_validator
from app.models.enums import ContributionFrequency, PensionStatus

class ContributionPlanStepBase(BaseModel):
    amount: Decimal = Field(gt=0, description="Contribution amount (must be positive)")
    frequency: str = Field(description="Usually MONTHLY")  # Usually MONTHLY
    start_date: date = Field(description="Start date of the contribution step")
    end_date: Optional[date] = Field(None, description="End date of the contribution step (optional)")
    note: Optional[str] = Field(None, description="Additional notes")
    
    @validator('end_date')
    def end_date_must_be_after_start_date(cls, v, values):
        if v and 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v

class ContributionPlanStepCreate(ContributionPlanStepBase):
    pass

class ContributionPlanStepResponse(ContributionPlanStepBase):
    id: int
    pension_insurance_id: int

    class Config:
        from_attributes = True

class ContributionHistoryBase(BaseModel):
    contribution_date: date = Field(description="Date of the contribution")
    amount: Decimal = Field(ge=0, description="Contribution amount (must be non-negative)")
    is_manual: bool = Field(False, description="Whether the contribution was manually entered")
    note: Optional[str] = Field(None, description="Additional notes")
    
    @validator('contribution_date')
    def contribution_date_must_not_be_in_future(cls, v):
        if v > date.today():
            raise ValueError('Contribution date cannot be in the future')
        return v

class ContributionHistoryCreate(ContributionHistoryBase):
    pass

class ContributionHistoryResponse(ContributionHistoryBase):
    id: int
    pension_insurance_id: int

    class Config:
        from_attributes = True

# New schemas for benefits, statements, and projections

class BenefitBase(BaseModel):
    """
    Base schema for insurance pension benefits.
    
    NOTE: This schema and related schemas (BenefitCreate, BenefitResponse) are currently not used
    by the frontend. The PensionInsuranceBenefit model exists in the database but is not populated
    through the UI. Currently, only the total_benefits field in PensionInsuranceStatement is used
    as a summary value.
    
    This schema may be used in future implementations to provide more detailed tracking of
    individual benefits (e.g., government subsidies, employer matches, child bonuses).
    """
    source: str = Field(description="Source of the benefit (e.g., 'Government', 'Employer')")
    amount: Decimal = Field(gt=0, description="Benefit amount (must be positive)")
    frequency: str = Field(description="MONTHLY, QUARTERLY, YEARLY, ONE_TIME")  # MONTHLY, QUARTERLY, YEARLY, ONE_TIME
    description: Optional[str] = Field(None, description="Description of the benefit")
    valid_from: date = Field(description="Start date of the benefit")
    valid_until: Optional[date] = Field(None, description="End date of the benefit (optional)")
    status: str = Field("ACTIVE", description="ACTIVE, PAUSED, ENDED")  # ACTIVE, PAUSED, ENDED
    
    @validator('valid_until')
    def valid_until_must_be_after_valid_from(cls, v, values):
        if v and 'valid_from' in values and v <= values['valid_from']:
            raise ValueError('Valid until date must be after valid from date')
        return v

class BenefitCreate(BenefitBase):
    """
    Schema for creating a new insurance pension benefit.
    Currently not used by the frontend.
    """
    pass

class BenefitResponse(BenefitBase):
    """
    Schema for returning an insurance pension benefit.
    Currently not used by the frontend.
    """
    id: int
    pension_insurance_id: int

    class Config:
        from_attributes = True

class ProjectionScenarioBase(BaseModel):
    return_rate: Decimal = Field(description="Expected return rate")
    value_at_retirement: Decimal = Field(gt=0, description="Expected value at retirement (must be positive)")
    monthly_payout: Decimal = Field(gt=0, description="Expected monthly payout (must be positive)")
    
    @validator('return_rate')
    def return_rate_must_be_reasonable(cls, v):
        # Return rates should be between -10% and +10%
        if v < -10 or v > 10:
            raise ValueError('Return rate must be between -10% and +10%')
        return v

class ProjectionScenarioCreate(ProjectionScenarioBase):
    pass

class ProjectionScenarioResponse(ProjectionScenarioBase):
    id: int

    class Config:
        from_attributes = True

class ProjectionBase(BaseModel):
    scenario_type: Literal["with_contributions", "without_contributions"] = Field(
        description="Type of scenario: with_contributions or without_contributions"
    )
    return_rate: Decimal = Field(description="Expected return rate")
    value_at_retirement: Decimal = Field(gt=0, description="Expected value at retirement (must be positive)")
    monthly_payout: Decimal = Field(gt=0, description="Expected monthly payout (must be positive)")
    
    @validator('return_rate')
    def return_rate_must_be_reasonable(cls, v):
        # Return rates should be between -10% and +10%
        if v < -10 or v > 10:
            raise ValueError('Return rate must be between -10% and +10%')
        return v

class ProjectionCreate(ProjectionBase):
    pass

class ProjectionResponse(ProjectionBase):
    id: int
    statement_id: int

    class Config:
        from_attributes = True

class StatementBase(BaseModel):
    statement_date: date = Field(description="Date of the statement")
    value: Decimal = Field(gt=0, description="Current value (must be positive)")
    total_contributions: Decimal = Field(ge=0, description="Total contributions to date (must be non-negative)")
    total_benefits: Decimal = Field(ge=0, description="Total benefits received (must be non-negative)")
    costs_amount: Optional[Decimal] = Field(None, description="Yearly costs amount")
    costs_percentage: Optional[Decimal] = Field(None, description="Yearly costs percentage")
    note: Optional[str] = Field(None, description="Additional notes")
    
    @validator('statement_date')
    def statement_date_must_not_be_in_future(cls, v):
        if v > date.today():
            raise ValueError('Statement date cannot be in the future')
        return v
    
    @validator('costs_amount')
    def costs_amount_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Costs amount must be positive')
        return v
    
    @validator('costs_percentage')
    def costs_percentage_must_be_reasonable(cls, v):
        if v is not None and (v <= 0 or v > 100):
            raise ValueError('Costs percentage must be between 0 and 100')
        return v

class StatementCreate(StatementBase):
    projections: List[ProjectionCreate] = Field(description="Projections for this statement")

class StatementUpdate(BaseModel):
    statement_date: Optional[date] = None
    value: Optional[Decimal] = None
    total_contributions: Optional[Decimal] = None
    total_benefits: Optional[Decimal] = None
    costs_amount: Optional[Decimal] = Field(None, gt=0, description="Costs amount must be positive")
    costs_percentage: Optional[Decimal] = Field(None, ge=0, le=100, description="Costs percentage must be between 0 and 100")
    note: Optional[str] = None
    projections: Optional[List[ProjectionCreate]] = None

    @validator('costs_amount')
    def validate_costs_amount(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Costs amount must be positive")
        return v

    @validator('costs_percentage')
    def validate_costs_percentage(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError("Costs percentage must be between 0 and 100")
        return v

class StatementResponse(StatementBase):
    id: int
    pension_insurance_id: int
    projections: List[ProjectionResponse]

    class Config:
        from_attributes = True

# Update existing pension insurance schemas

class PensionInsuranceBase(BaseModel):
    name: str = Field(description="Name of the insurance pension")
    member_id: int = Field(description="ID of the household member")
    notes: Optional[str] = Field(None, description="Additional notes")
    provider: str = Field(description="Insurance company name")
    contract_number: Optional[str] = Field(None, description="Policy or contract identification number")
    start_date: date = Field(description="Policy start date")
    guaranteed_interest: Optional[Decimal] = Field(None, ge=0, description="Minimum guaranteed return rate (must be non-negative)")
    expected_return: Optional[Decimal] = Field(None, ge=0, description="Expected total return rate (must be non-negative)")
    status: str = Field("ACTIVE", description="ACTIVE, PAUSED")
    policy_duration_years: Optional[int] = Field(None, description="Fixed term in years, if applicable")
    policy_end_date: Optional[date] = Field(None, description="Specific end date, if applicable")
    is_lifetime_policy: Optional[bool] = Field(None, description="Whether it's a lifetime policy")
    
    @validator('policy_end_date')
    def policy_end_date_must_be_after_start_date(cls, v, values):
        if v and 'start_date' in values and v <= values['start_date']:
            raise ValueError('Policy end date must be after start date')
        return v
    
    @validator('policy_duration_years')
    def policy_duration_years_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Policy duration years must be positive')
        return v
    
    @root_validator(skip_on_failure=True)
    def check_guaranteed_vs_expected_return(cls, values):
        guaranteed = values.get('guaranteed_interest')
        expected = values.get('expected_return')
        if guaranteed is not None and expected is not None and guaranteed > expected:
            raise ValueError('Guaranteed interest rate must be less than or equal to expected return')
        return values
    
    @root_validator(skip_on_failure=True)
    def check_policy_term_consistency(cls, values):
        duration = values.get('policy_duration_years')
        end_date = values.get('policy_end_date')
        is_lifetime = values.get('is_lifetime_policy')
        
        # Count how many policy term options are provided
        options_count = sum(1 for option in [duration, end_date, is_lifetime] if option is not None)
        
        # If more than one option is provided, raise an error
        if options_count > 1:
            raise ValueError('Only one of policy_duration_years, policy_end_date, or is_lifetime_policy should be provided')
        
        return values

class PensionInsuranceCreate(PensionInsuranceBase):
    contribution_plan_steps: List[ContributionPlanStepCreate]
    # NOTE: The benefits field is defined but not currently used in the frontend.
    # The PensionInsuranceBenefit model exists in the database but is not populated.
    benefits: Optional[List[BenefitCreate]] = None
    statements: Optional[List[StatementCreate]] = None

class PensionInsuranceResponse(PensionInsuranceBase):
    id: int
    current_value: Decimal
    contribution_plan_steps: List[ContributionPlanStepResponse]
    contribution_history: List[ContributionHistoryResponse]
    benefits: List[BenefitResponse] = []
    statements: List[StatementResponse] = []

    class Config:
        from_attributes = True

class PensionInsuranceUpdate(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    provider: Optional[str] = None
    contract_number: Optional[str] = None
    guaranteed_interest: Optional[Decimal] = None
    expected_return: Optional[Decimal] = None
    status: Optional[str] = None
    policy_duration_years: Optional[int] = None
    policy_end_date: Optional[date] = None
    is_lifetime_policy: Optional[bool] = None
    contribution_plan_steps: Optional[List[ContributionPlanStepCreate]] = None
    benefits: Optional[List[BenefitCreate]] = None
    
    @validator('guaranteed_interest')
    def guaranteed_interest_must_be_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError('Guaranteed interest rate must be non-negative')
        return v
    
    @validator('expected_return')
    def expected_return_must_be_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError('Expected return rate must be non-negative')
        return v
    
    @validator('policy_duration_years')
    def policy_duration_years_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Policy duration years must be positive')
        return v

class PensionStatusUpdate(BaseModel):
    status: PensionStatus
    paused_at: Optional[date] = None
    resume_at: Optional[date] = None

class PensionInsuranceListResponse(BaseModel):
    """Lightweight schema for insurance pensions in list view"""
    id: int
    name: str
    type: Literal["insurance"] = "insurance"
    member_id: Optional[int] = None
    currency: str
    start_date: date
    end_date: Optional[date] = None
    provider: str
    contract_number: Optional[str] = None
    guaranteed_interest: Optional[float] = None
    expected_return: Optional[float] = None
    current_value: Optional[float] = None
    status: PensionStatus
    paused_at: Optional[date] = None
    resume_at: Optional[date] = None

    class Config:
        orm_mode = True 