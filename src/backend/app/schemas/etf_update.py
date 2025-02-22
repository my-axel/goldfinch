from datetime import datetime
import datetime as dt
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class ETFErrorBase(BaseModel):
    etf_id: str
    error_type: str
    date: Optional[dt.date] = None
    context: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ETFErrorCreate(ETFErrorBase):
    pass

class ETFErrorResponse(ETFErrorBase):
    id: int
    created_at: datetime
    resolved: bool
    resolved_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class ETFUpdateBase(BaseModel):
    """Base ETF update schema."""
    etf_id: str
    update_type: str = Field(..., pattern="^(full|prices_only|prices_refresh)$")
    start_date: dt.date
    end_date: dt.date
    notes: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ETFUpdateCreate(ETFUpdateBase):
    """Schema for creating an ETF update."""
    pass

class ETFUpdateResponse(ETFUpdateBase):
    """Schema for ETF update responses."""
    id: int
    status: str = Field(..., pattern="^(pending|processing|retrying|completed|completed_with_errors|failed)$")
    created_at: datetime
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    missing_dates: Optional[List[dt.date]] = None
    retry_count: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class ETFUpdateList(BaseModel):
    """Schema for list of ETF updates."""
    updates: List[ETFUpdateResponse]
    model_config = ConfigDict(from_attributes=True)