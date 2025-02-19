from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel

class ETFBase(BaseModel):
    id: str
    isin: Optional[str] = None
    symbol: str
    name: str
    currency: str
    asset_class: Optional[str] = None
    domicile: Optional[str] = None
    inception_date: Optional[date] = None
    fund_size: Optional[Decimal] = None
    ter: Optional[Decimal] = None
    distribution_policy: Optional[str] = None
    last_price: Optional[Decimal] = None
    last_update: Optional[datetime] = None
    ytd_return: Optional[Decimal] = None
    one_year_return: Optional[Decimal] = None
    volatility_30d: Optional[Decimal] = None
    sharpe_ratio: Optional[Decimal] = None

class ETFCreate(ETFBase):
    pass

class ETFUpdate(BaseModel):
    isin: Optional[str] = None
    symbol: Optional[str] = None
    name: Optional[str] = None
    currency: Optional[str] = None
    asset_class: Optional[str] = None
    domicile: Optional[str] = None
    inception_date: Optional[date] = None
    fund_size: Optional[Decimal] = None
    ter: Optional[Decimal] = None
    distribution_policy: Optional[str] = None
    last_price: Optional[Decimal] = None
    last_update: Optional[datetime] = None
    ytd_return: Optional[Decimal] = None
    one_year_return: Optional[Decimal] = None
    volatility_30d: Optional[Decimal] = None
    sharpe_ratio: Optional[Decimal] = None

class ETFResponse(ETFBase):
    class Config:
        from_attributes = True

class ETFPriceBase(BaseModel):
    date: date
    price: Decimal
    volume: Optional[Decimal] = None
    high: Optional[Decimal] = None
    low: Optional[Decimal] = None
    open: Optional[Decimal] = None
    dividends: Optional[Decimal] = None
    stock_splits: Optional[Decimal] = None
    capital_gains: Optional[Decimal] = None

class ETFPriceCreate(ETFPriceBase):
    pass

class ETFPriceResponse(ETFPriceBase):
    id: int
    etf_id: str
    currency: str
    original_currency: Optional[str] = None

    class Config:
        from_attributes = True 