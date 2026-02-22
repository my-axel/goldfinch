from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import ContributionFrequency, PensionStatus
import logging

# Use the app.schemas namespace to ensure logs go to the right place
logger = logging.getLogger("app.schemas.pension_company")


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
    pension_company_id: int

    model_config = ConfigDict(from_attributes=True)

class PensionCompanyRetirementProjectionBase(BaseModel):
    retirement_age: int
    monthly_payout: Optional[Decimal] = None
    total_capital: Optional[Decimal] = None

class PensionCompanyRetirementProjectionCreate(PensionCompanyRetirementProjectionBase):
    pass

class PensionCompanyRetirementProjectionResponse(PensionCompanyRetirementProjectionBase):
    id: int
    statement_id: int

    model_config = ConfigDict(
        from_attributes=True,
        model_dump_handlers={
            Decimal: lambda v: float(v)
        },
        exclude_none=True,
        arbitrary_types_allowed=True
    )
    
    def model_dump(self, **kwargs):
        """Override model_dump to add logging for debugging recursion issues"""
        logger.debug(f"SCHEMA: model_dump called on PensionCompanyRetirementProjectionResponse with id={self.id}")
        try:
            # Log the projection data before serialization
            projection_data = {
                "id": self.id,
                "statement_id": self.statement_id,
                "retirement_age": self.retirement_age,
                "monthly_payout": float(self.monthly_payout) if self.monthly_payout else None,
                "total_capital": float(self.total_capital) if self.total_capital else None
            }
            logger.debug(f"SCHEMA: Projection data before serialization: {projection_data}")
            
            result = super().model_dump(**kwargs)
            logger.debug(f"SCHEMA: model_dump successful for projection id={self.id}")
            return result
        except Exception as e:
            logger.error(f"SCHEMA: Error in model_dump for projection: {str(e)}", exc_info=True)
            raise

class PensionCompanyRetirementProjectionUpdate(BaseModel):
    retirement_age: Optional[int] = None
    monthly_payout: Optional[Decimal] = None
    total_capital: Optional[Decimal] = None

# Base schema with common attributes
class PensionCompanyStatementBase(BaseModel):
    statement_date: date
    value: Decimal
    note: Optional[str] = None


# Schema for creating a new statement
class PensionCompanyStatementCreate(PensionCompanyStatementBase):
    retirement_projections: List[PensionCompanyRetirementProjectionCreate] = []


# Schema for updating an existing statement
class PensionCompanyStatementUpdate(BaseModel):
    statement_date: Optional[date] = None
    value: Optional[Decimal] = None
    note: Optional[str] = None
    retirement_projections: Optional[List[PensionCompanyRetirementProjectionCreate]] = None


# Schema for response
class PensionCompanyStatementResponse(PensionCompanyStatementBase):
    id: int
    created_at: datetime
    pension_id: int
    retirement_projections: List[PensionCompanyRetirementProjectionResponse] = []

    model_config = ConfigDict(
        from_attributes=True,
        model_dump_handlers={
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        },
        exclude_none=True,
        arbitrary_types_allowed=True
    )
    
    def model_dump(self, **kwargs):
        """Override model_dump to add logging for debugging recursion issues"""
        logger.debug(f"SCHEMA: model_dump called on PensionCompanyStatementResponse with id={self.id}")
        logger.debug(f"SCHEMA: model_dump kwargs: {kwargs}")
        try:
            logger.debug(f"SCHEMA: Starting model_dump for statement id={self.id}")
            logger.debug(f"SCHEMA: Statement has {len(self.retirement_projections)} projections")
            
            # Log the statement data before serialization
            statement_data = {
                "id": self.id,
                "pension_id": self.pension_id,
                "statement_date": str(self.statement_date),
                "value": float(self.value) if self.value else None,
                "created_at": self.created_at.isoformat() if self.created_at else None,
                "note": self.note,
                "retirement_projections_count": len(self.retirement_projections)
            }
            logger.debug(f"SCHEMA: Statement data before serialization: {statement_data}")
            
            result = super().model_dump(**kwargs)
            logger.debug(f"SCHEMA: model_dump successful for PensionCompanyStatementResponse with id={self.id}")
            return result
        except Exception as e:
            logger.error(f"SCHEMA: Error in model_dump for PensionCompanyStatementResponse: {str(e)}", exc_info=True)
            # Log the object structure to help diagnose the issue
            try:
                logger.error(f"SCHEMA: Statement object structure: {vars(self)}")
            except:
                logger.error("SCHEMA: Could not log statement object structure")
            raise

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

class PensionCompanyNestedResponse(PensionCompanyBase):
    id: int
    current_value: Decimal

    model_config = ConfigDict(from_attributes=True)

class PensionCompanyResponse(PensionCompanyBase):
    id: int
    current_value: Decimal
    contribution_plan_steps: List[ContributionPlanStepResponse] = []
    contribution_history: List[ContributionHistoryResponse] = []
    statements: List[PensionCompanyStatementResponse] = []

    model_config = ConfigDict(
        from_attributes=True,
        model_dump_handlers={
            Decimal: lambda v: float(v)
        }
    )

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

class CompanyPensionListSchema(BaseModel):
    """Lightweight schema for company pensions in list view"""
    id: int
    name: str
    member_id: int
    current_value: float
    employer: str
    start_date: date
    contribution_amount: Optional[Decimal] = None
    contribution_frequency: Optional[ContributionFrequency] = None
    status: PensionStatus
    paused_at: Optional[date] = None
    resume_at: Optional[date] = None
    current_step_amount: Optional[Decimal] = None
    current_step_frequency: Optional[ContributionFrequency] = None
    latest_statement_date: Optional[date] = None
    latest_projections: List[dict] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True) 