from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date
from typing import Optional


@dataclass
class SearchResult:
    symbol: str           # Source-specific symbol (e.g. "VWRL.L" for yfinance, "VWRL.UK" for stooq)
    name: str
    source_id: str        # e.g. "yfinance"
    source_name: str      # e.g. "Yahoo Finance (yFinance)"
    currency: Optional[str] = None
    isin: Optional[str] = None
    exchange: Optional[str] = None
    fund_family: Optional[str] = None   # Asset manager, e.g. "BlackRock Asset Management"
    category: Optional[str] = None      # Asset class/category, e.g. "Developed Markets"


@dataclass
class PriceData:
    date: date
    price: float          # Close price (in original currency)
    currency: str
    source: str           # source_id
    is_adjusted: bool = False
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    volume: Optional[float] = None
    dividends: Optional[float] = None
    stock_splits: Optional[float] = None
    capital_gains: Optional[float] = None


@dataclass
class ETFInfo:
    symbol: str
    name: str
    currency: str
    source: str
    isin: Optional[str] = None
    ter: Optional[float] = None
    fund_size: Optional[float] = None
    inception_date: Optional[date] = None
    asset_class: Optional[str] = None
    domicile: Optional[str] = None
    distribution_policy: Optional[str] = None


class DataSourceBase(ABC):
    source_id: str
    name: str
    requires_api_key: bool = False
    supports_search: bool = False
    supports_metadata: bool = False
    supports_adjusted_prices: bool = False

    @abstractmethod
    def search(self, query: str) -> list[SearchResult]:
        """Symbol search. Returns empty list if not supported."""
        ...

    @abstractmethod
    def fetch_info(self, symbol: str) -> Optional[ETFInfo]:
        """Fetch ETF metadata. Returns None if not supported or not found."""
        ...

    @abstractmethod
    def fetch_prices(self, symbol: str, start: date, end: date) -> list[PriceData]:
        """Fetch daily historical prices (OHLCV). Returns empty list on error."""
        ...

    def validate_symbol(self, symbol: str) -> bool:
        """Check if a symbol exists at this source. Default: try fetching one day."""
        try:
            prices = self.fetch_prices(symbol, date.today(), date.today())
            return True  # No exception = likely valid (may return empty on non-trading day)
        except Exception:
            return False
