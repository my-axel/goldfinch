from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import PensionStatus

# Base schema for statements
class PensionStateStatementBase(BaseModel):
    statement_date: date = Field(description="Date of the pension statement")
    current_monthly_amount: Optional[Decimal] = Field(default=None, description="Current monthly pension amount based on contributions so far (EUR)")
    projected_monthly_amount: Optional[Decimal] = Field(default=None, description="Projected monthly pension amount at retirement (EUR)")
    current_value: Optional[Decimal] = Field(default=None, description="Current total value of the pension (EUR)")
    note: Optional[str] = Field(default=None, description="Additional notes about the statement")

# Schema for creating a new statement
class PensionStateStatementCreate(PensionStateStatementBase):
    pass

# Schema for updating an existing statement
class PensionStateStatementUpdate(BaseModel):
    statement_date: Optional[date] = None
    current_monthly_amount: Optional[Decimal] = None
    projected_monthly_amount: Optional[Decimal] = None
    current_value: Optional[Decimal] = None
    note: Optional[str] = None

# Schema for statement response
class PensionStateStatementResponse(PensionStateStatementBase):
    id: int
    pension_id: int
    created_at: date

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            datetime: lambda dt: dt.date() if dt else None
        }
    )

# Base schema for state pensions
class PensionStateBase(BaseModel):
    name: str = Field(description="Name of the state pension")
    member_id: int = Field(description="ID of the household member")
    notes: Optional[str] = Field(default=None, description="Additional notes")
    start_date: date = Field(description="When person started accumulating state pension")
    status: PensionStatus = Field(default=PensionStatus.ACTIVE, description="Current status of the pension")
    # Per-pension scenario rates (nullable; falls back to settings.state_pension_*_rate when None)
    pessimistic_rate: Optional[Decimal] = Field(default=None, ge=0)
    realistic_rate: Optional[Decimal] = Field(default=None, ge=0)
    optimistic_rate: Optional[Decimal] = Field(default=None, ge=0)

# Schema for creating a new state pension
class PensionStateCreate(PensionStateBase):
    statements: Optional[List[PensionStateStatementCreate]] = Field(default=None, description="Optional list of statements to create with the pension")

# Schema for updating an existing state pension
class PensionStateUpdate(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    start_date: Optional[date] = None
    status: Optional[PensionStatus] = None
    statements: Optional[List[dict]] = Field(default=None, description="Optional list of statements to update or create with the pension")
    pessimistic_rate: Optional[Decimal] = None
    realistic_rate: Optional[Decimal] = None
    optimistic_rate: Optional[Decimal] = None

# Schema for state pension response
class PensionStateResponse(PensionStateBase):
    id: int
    statements: List[PensionStateStatementResponse] = []

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            datetime: lambda dt: dt.date() if dt else None
        }
    )

# Schema for state pension list view
class StatePensionListSchema(BaseModel):
    """Lightweight schema for state pensions in list view"""
    id: int
    name: str
    member_id: int
    start_date: date
    status: PensionStatus
    paused_at: Optional[date] = None
    resume_at: Optional[date] = None
    latest_statement_date: Optional[date] = None
    latest_monthly_amount: Optional[float] = Field(default=None, description="Current monthly amount from latest statement (EUR)")
    latest_projected_amount: Optional[float] = Field(default=None, description="Projected monthly amount from latest statement (EUR)")
    latest_current_value: Optional[float] = Field(default=None, description="Current total value from latest statement (EUR)")
    statements_count: int = Field(default=0, description="Number of statements available for this pension")

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            datetime: lambda dt: dt.date() if dt else None
        }
    )

# Schema for updating pension status
class PensionStatusUpdate(BaseModel):
    status: PensionStatus
    paused_at: Optional[date] = None
    resume_at: Optional[date] = None 