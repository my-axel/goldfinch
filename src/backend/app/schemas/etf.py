from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import date, datetime

class ETF(BaseModel):
    id: str
    isin: str
    symbol: str
    name: str
    currency: str
    asset_class: str
    domicile: str
    inception_date: date
    fund_size: float
    ter: float
    distribution_policy: str
    last_price: float
    last_update: datetime
    ytd_return: float
    one_year_return: float
    volatility_30d: float
    sharpe_ratio: float

class ETFCreate(BaseModel):
    id: str
    symbol: str
    name: str
    currency: str
    asset_class: str
    domicile: str
    isin: Optional[str] = Field(default="UNKNOWN")
    inception_date: date = Field(default_factory=date.today)
    fund_size: float = 0
    ter: float = 0
    distribution_policy: str
    last_price: float = 0
    last_update: datetime = Field(default_factory=datetime.utcnow)
    ytd_return: float = 0
    one_year_return: float = 0
    volatility_30d: float = 0
    sharpe_ratio: float = 0

    class Config:
        from_attributes = True

class ETFUpdate(BaseModel):
    name: Optional[str] = None
    last_price: Optional[float] = None
    last_update: Optional[datetime] = None
    ytd_return: Optional[float] = None
    one_year_return: Optional[float] = None
    volatility_30d: Optional[float] = None
    sharpe_ratio: Optional[float] = None

class ETFInDB(ETF):
    class Config:
        from_attributes = True

class ETFPriceBase(BaseModel):
    date: date
    price: float = Field(gt=0)  # Close price
    currency: str = "EUR"
    volume: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    open: Optional[float] = None
    dividends: Optional[float] = None
    stock_splits: Optional[float] = None
    capital_gains: Optional[float] = None
    original_currency: Optional[str] = None

class ETFPriceCreate(ETFPriceBase):
    etf_id: str

class ETFPriceResponse(BaseModel):
    date: date
    price: float  # Close price in EUR
    currency: str
    volume: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    open: Optional[float] = None
    dividends: Optional[float] = None
    stock_splits: Optional[float] = None
    capital_gains: Optional[float] = None
    original_currency: Optional[str] = None

    class Config:
        from_attributes = True

class ETFResponse(BaseModel):
    id: str
    isin: Optional[str] = "UNKNOWN"
    symbol: str
    name: str
    currency: str
    asset_class: str
    domicile: str
    inception_date: date
    fund_size: float
    ter: float
    distribution_policy: str
    last_price: float
    last_update: datetime
    ytd_return: float
    one_year_return: float
    volatility_30d: float
    sharpe_ratio: float

    class Config:
        from_attributes = True

class ETFResponseWithHistory(ETFResponse):
    historical_prices: List[ETFPriceResponse] = []

    class Config:
        from_attributes = True