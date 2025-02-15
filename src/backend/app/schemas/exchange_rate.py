from pydantic import BaseModel, ConfigDict
from datetime import date
from decimal import Decimal
from typing import List

class ExchangeRateBase(BaseModel):
    date: date
    currency: str
    rate: Decimal

class ExchangeRateCreate(ExchangeRateBase):
    pass

class ExchangeRate(ExchangeRateBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

class ExchangeRateResponse(BaseModel):
    """Response model for getting exchange rates for a specific date"""
    date: date
    rates: dict[str, Decimal]  # e.g., {"USD": 1.1234, "CHF": 0.9876} 