from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Dict

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
    rates: Dict[str, Decimal]  # e.g., {"USD": 1.1234, "CHF": 0.9876}

class ExchangeRateUpdateBase(BaseModel):
    """Base schema for exchange rate updates"""
    update_type: str  # 'historical', 'daily', 'manual_historical', 'manual_latest'
    start_date: date
    end_date: date
    status: str  # 'pending', 'processing', 'completed', 'failed'
    currencies: List[str]

class ExchangeRateUpdateCreate(ExchangeRateUpdateBase):
    """Schema for creating a new update record"""
    pass

class ExchangeRateUpdate(ExchangeRateUpdateBase):
    """Schema for a complete update record"""
    id: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    missing_dates: Optional[List[date]] = None
    retry_count: int
    
    model_config = ConfigDict(from_attributes=True)

class ExchangeRateUpdateResponse(BaseModel):
    """Response model for getting update status"""
    recent_updates: List[ExchangeRateUpdate]
    total_rates: int
    latest_rate_date: Optional[date]
    currencies_coverage: Dict[str, int]
    missing_dates_count: int
    
    model_config = ConfigDict(from_attributes=True) 