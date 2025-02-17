from pydantic import BaseModel, Field, validator
from datetime import date
from typing import Optional
from decimal import Decimal
from app.models.enums import ContributionFrequency

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

class OneTimeInvestmentCreate(BaseModel):
    amount: Decimal = Field(gt=0, description="Amount to invest in EUR")
    investment_date: date = Field(description="When the investment was/will be made")
    note: Optional[str] = Field(None, description="Optional note explaining the investment (e.g., 'Year-end bonus 2024')")

    @validator('amount', pre=True)
    def convert_amount_to_decimal(cls, v):
        if isinstance(v, (int, float)):
            return Decimal(str(v))
        if isinstance(v, str):
            return Decimal(v)
        raise ValueError('Invalid amount type. Expected number or string.')

    class Config:
        json_schema_extra = {
            "example": {
                "amount": 2000.00,
                "investment_date": "2024-02-15",
                "note": "Year-end bonus 2024"
            }
        } 