import yfinance as yf
import pandas as pd
from datetime import date
from typing import Optional
from .base import DataSourceBase, SearchResult, PriceData, ETFInfo
import logging

logger = logging.getLogger(__name__)


class YFinanceDataSource(DataSourceBase):
    source_id = "yfinance"
    name = "Yahoo Finance (yFinance)"
    requires_api_key = False
    supports_search = False       # Search handled by FinanceDatabaseSearch
    supports_metadata = True
    supports_adjusted_prices = True  # auto_adjust=True by default since yfinance 2024

    def search(self, query: str) -> list[SearchResult]:
        # Search is delegated to FinanceDatabaseSearch; this source does not search
        return []

    def lookup_by_isin(self, isin: str) -> Optional[SearchResult]:
        """
        Resolve an ISIN to a Yahoo Finance ticker symbol.
        yFinance accepts ISINs directly and returns the corresponding ticker info.
        Returns None if the ISIN cannot be resolved to a real ticker symbol.

        Note: yFinance sometimes returns ISIN+exchange (e.g. "LU1234567890.SG") when it
        cannot map the ISIN to a proper ticker. Those results are rejected.
        """
        try:
            ticker = yf.Ticker(isin)
            info = ticker.info
            if not info or not info.get("symbol"):
                logger.debug(f"[yFinance] ISIN lookup for {isin}: no symbol returned")
                return None
            symbol = info["symbol"]
            # Reject pseudo-symbols like "LU1234567890.SG" (ISIN used as symbol + exchange suffix)
            if symbol.upper().startswith(isin.upper()):
                logger.debug(f"[yFinance] ISIN {isin}: symbol {symbol!r} looks like ISIN+exchange, not a real ticker")
                return None
            name = info.get("longName") or info.get("shortName") or isin
            logger.info(f"[yFinance] ISIN {isin} resolved to symbol={symbol}, name={repr(name)}")
            return SearchResult(
                symbol=symbol,
                name=name,
                source_id=self.source_id,
                source_name=self.name,
                currency=info.get("currency"),
                isin=isin,
                exchange=info.get("exchange"),
            )
        except Exception as e:
            logger.warning(f"[yFinance] ISIN lookup failed for {isin}: {e}")
            return None

    # Common European exchange suffixes to try when a bare ticker has no suffix.
    # Ordered by typical prevalence for EU-listed ETFs.
    _EXCHANGE_SUFFIXES = [".DE", ".L", ".PA", ".AS", ".SW", ".MI", ".MC", ".ST"]

    def lookup_by_symbol(self, symbol: str) -> Optional[SearchResult]:
        """
        Validate a ticker symbol directly via yFinance.
        - If symbol already contains a dot (e.g. "AHYQ.DE"), tries it directly.
        - If bare ticker (e.g. "AHYQ"), tries common exchange suffixes.
        Returns a SearchResult if the symbol resolves to a valid instrument, None otherwise.
        """
        candidates = [symbol]
        if "." not in symbol:
            candidates += [symbol + suffix for suffix in self._EXCHANGE_SUFFIXES]

        for candidate in candidates:
            result = self._try_ticker(candidate)
            if result:
                return result
        return None

    def _try_ticker(self, symbol: str) -> Optional[SearchResult]:
        """Try a single ticker symbol via yFinance. Returns SearchResult or None."""
        try:
            info = yf.Ticker(symbol).info
            if not info or not info.get("symbol"):
                return None
            if not info.get("shortName") and not info.get("longName"):
                return None
            # Require at least some price data to confirm the symbol is live
            if not info.get("regularMarketPrice") and not info.get("navPrice") and not info.get("previousClose"):
                return None
            name = info.get("longName") or info.get("shortName") or symbol
            logger.info(f"[yFinance] Ticker {symbol!r} resolved: name={repr(name)}")
            return SearchResult(
                symbol=info["symbol"],
                name=name,
                source_id=self.source_id,
                source_name=self.name,
                currency=info.get("currency"),
                isin=info.get("isin"),
                exchange=info.get("exchange"),
            )
        except Exception:
            return None

    def fetch_info(self, symbol: str) -> Optional[ETFInfo]:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            if not info or info.get("regularMarketPrice") is None and info.get("navPrice") is None:
                # yfinance returns a sparse dict for invalid symbols
                if not info.get("shortName") and not info.get("longName"):
                    return None
            return ETFInfo(
                symbol=symbol,
                name=info.get("longName") or info.get("shortName") or symbol,
                currency=info.get("currency", ""),
                source=self.source_id,
                isin=info.get("isin"),
                ter=info.get("annualReportExpenseRatio"),
                fund_size=info.get("totalAssets"),
                asset_class=info.get("quoteType"),
                domicile=info.get("exchange"),
                distribution_policy=_distribution_policy(info),
            )
        except Exception:
            return None

    def fetch_prices(self, symbol: str, start: date, end: date) -> list[PriceData]:
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(start=start, end=end, interval="1d", auto_adjust=True)
            if hist.empty:
                return []
            result = []
            currency = ticker.info.get("currency", "") if not hist.empty else ""
            for idx, row in hist.iterrows():
                close = float(row["Close"]) if not pd.isna(row["Close"]) else None
                if close is None:
                    continue
                result.append(PriceData(
                    date=idx.date(),
                    price=close,
                    currency=currency,
                    source=self.source_id,
                    is_adjusted=True,
                    open=float(row["Open"]) if not pd.isna(row.get("Open", float("nan"))) else None,
                    high=float(row["High"]) if not pd.isna(row.get("High", float("nan"))) else None,
                    low=float(row["Low"]) if not pd.isna(row.get("Low", float("nan"))) else None,
                    volume=float(row["Volume"]) if not pd.isna(row.get("Volume", float("nan"))) else None,
                    dividends=float(row["Dividends"]) if "Dividends" in row and not pd.isna(row["Dividends"]) else None,
                    stock_splits=float(row["Stock Splits"]) if "Stock Splits" in row and not pd.isna(row["Stock Splits"]) else None,
                    capital_gains=float(row["Capital Gains"]) if "Capital Gains" in row and not pd.isna(row["Capital Gains"]) else None,
                ))
            return result
        except Exception:
            return []


def _distribution_policy(info: dict) -> Optional[str]:
    yield_val = info.get("yield") or info.get("trailingAnnualDividendYield")
    if yield_val and yield_val > 0:
        return "DISTRIBUTING"
    return None
