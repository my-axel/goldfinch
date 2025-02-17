from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel

class ETFBase(BaseModel):
    id: str  # ISIN
    name: str
    symbol: str
    currency: str
    provider: Optional[str] = None
    is_active: bool = True

class ETFCreate(ETFBase):
    pass

class ETFUpdate(BaseModel):
    name: Optional[str] = None
    symbol: Optional[str] = None
    currency: Optional[str] = None
    provider: Optional[str] = None
    is_active: Optional[bool] = None

class ETFResponse(ETFBase):
    class Config:
        from_attributes = True

class ETFPriceBase(BaseModel):
    price: Decimal
    date: date

class ETFPriceCreate(ETFPriceBase):
    pass

class ETFPriceResponse(ETFPriceBase):
    id: int
    etf_id: str

    class Config:
        from_attributes = True 