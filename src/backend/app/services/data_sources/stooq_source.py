import requests
import pandas as pd
from io import StringIO
from datetime import date
from typing import Optional
from .base import DataSourceBase, SearchResult, PriceData, ETFInfo

# Yahoo Finance → Stooq exchange suffix mapping.
# Only suffixes listed here are known to work on Stooq.
# Symbols with unknown suffixes (e.g. .MU, .DU, .VI) are NOT available on Stooq
# and yahoo_to_stooq_symbol() returns None for them.
YAHOO_TO_STOOQ_SUFFIX: dict[str, str] = {
    ".L":  ".UK",   # London Stock Exchange
    ".PA": ".FR",   # Euronext Paris
    ".AS": ".NL",   # Amsterdam
    ".BE": ".BE",   # Brussels (Euronext)
    ".DE": ".DE",   # Frankfurt/XETRA
    ".F":  ".DE",   # Frankfurt (alternative Yahoo notation)
    ".SW": ".CH",   # Switzerland
    ".JP": ".JP",   # Japan
    ".MI": ".IT",   # Milan (Euronext)
    ".MC": ".ES",   # Madrid
    ".HE": ".FI",   # Helsinki
    ".ST": ".SE",   # Stockholm
    ".CO": ".DK",   # Copenhagen
    ".OL": ".NO",   # Oslo
}

STOOQ_CSV_URL = "https://stooq.com/q/d/l/"


class StooqDataSource(DataSourceBase):
    source_id = "stooq"
    name = "Stooq"
    requires_api_key = False
    supports_search = False       # No search API — symbols are derived from Yahoo symbols
    supports_metadata = False     # Price data only
    supports_adjusted_prices = False  # Split-adjusted only, not dividend-adjusted

    def yahoo_to_stooq_symbol(self, yahoo_symbol: str) -> Optional[str]:
        """
        Convert a Yahoo Finance ticker to Stooq format.
        Returns None for suffixes not known to Stooq (e.g. .MU, .DU, .VI).
        """
        for yahoo_suffix, stooq_suffix in YAHOO_TO_STOOQ_SUFFIX.items():
            if yahoo_symbol.endswith(yahoo_suffix):
                base = yahoo_symbol[: -len(yahoo_suffix)]
                return f"{base}{stooq_suffix}"
        # US stocks with no exchange suffix
        if "." not in yahoo_symbol:
            return f"{yahoo_symbol}.US"
        # Unknown suffix — not available on Stooq
        return None

    def search(self, query: str) -> list[SearchResult]:
        # Stooq has no search API
        return []

    def fetch_info(self, symbol: str) -> Optional[ETFInfo]:
        # Stooq provides no metadata
        return None

    def fetch_prices(self, symbol: str, start: date, end: date) -> list[PriceData]:
        """Fetch daily OHLCV prices from Stooq's CSV endpoint."""
        params = {
            "s": symbol.lower(),
            "d1": start.strftime("%Y%m%d"),
            "d2": end.strftime("%Y%m%d"),
            "i": "d",  # daily
        }
        headers = {"User-Agent": "Mozilla/5.0"}
        try:
            resp = requests.get(STOOQ_CSV_URL, params=params, headers=headers, timeout=15)
            resp.raise_for_status()
        except requests.RequestException:
            return []

        if "No data" in resp.text or len(resp.text.strip()) < 10:
            return []

        try:
            df = pd.read_csv(StringIO(resp.text), parse_dates=["Date"], index_col="Date")
        except Exception:
            return []

        if df.empty:
            return []

        df = df.sort_index(ascending=True)
        result = []
        for idx, row in df.iterrows():
            close = float(row["Close"]) if pd.notna(row.get("Close")) else None
            if close is None:
                continue
            result.append(PriceData(
                date=idx.date(),
                price=close,
                currency="",     # Stooq does not include currency — caller must fill from ETF metadata
                source=self.source_id,
                is_adjusted=False,  # Split-adjusted only, NOT dividend-adjusted
                open=float(row["Open"]) if pd.notna(row.get("Open")) else None,
                high=float(row["High"]) if pd.notna(row.get("High")) else None,
                low=float(row["Low"]) if pd.notna(row.get("Low")) else None,
                volume=float(row["Volume"]) if pd.notna(row.get("Volume")) else None,
            ))
        return result
