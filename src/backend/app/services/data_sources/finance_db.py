"""
FinanceDatabaseSearch — ETF search backend using the financedatabase library.

This is NOT a DataSourceBase subclass. It is a dedicated search adapter that
replaces yf.Search() for finding ETF symbols. It provides rich metadata
(ISIN, exchange, currency) from a static, locally-cached dataset.
"""
import logging
import time
from .base import SearchResult

logger = logging.getLogger(__name__)

# Lazy import — financedatabase is only loaded on first search call
_fd = None
# Cache the ETFs() instance — loading it is expensive (~1-2s), reuse across requests
_etfs_instance = None


def _get_etfs():
    """Return a cached ETFs() instance. Initializes on first call."""
    global _fd, _etfs_instance
    if _etfs_instance is None:
        if _fd is None:
            try:
                import financedatabase as fd
                _fd = fd
            except ImportError:
                logger.error(
                    "financedatabase is not installed. Run: pip install financedatabase"
                )
                raise
        t0 = time.monotonic()
        _etfs_instance = _fd.ETFs()
        logger.info(f"[FinanceDB] ETFs() initialized in {time.monotonic() - t0:.2f}s")
    return _etfs_instance


class FinanceDatabaseSearch:
    """Search ETFs using the financedatabase library (static, locally-cached dataset)."""

    def search(self, query: str, limit: int = 20) -> list[SearchResult]:
        """
        Search for ETFs by name or ticker symbol.
        Returns a list of SearchResult with source_id='financedatabase'.

        The financedatabase API uses **kwargs for column-based filtering:
        - search(name=query) — full-text search in the name column
        - search(index=query) — search in the ticker symbol (DataFrame index)
        Results from both are merged and deduplicated.

        Note: Results contain the Yahoo Finance-compatible symbol.
        The caller is responsible for deriving source-specific symbols (e.g. Stooq).
        """
        import pandas as pd
        t0 = time.monotonic()
        logger.info(f"[FinanceDB] search('{query}', limit={limit})")
        try:
            etfs = _get_etfs()

            t1 = time.monotonic()
            by_name = etfs.search(name=query)
            t2 = time.monotonic()
            by_symbol = etfs.search(index=query)
            t3 = time.monotonic()

            n_name = len(by_name) if by_name is not None and not by_name.empty else 0
            n_sym = len(by_symbol) if by_symbol is not None and not by_symbol.empty else 0
            logger.info(
                f"[FinanceDB] name={n_name} hits ({t2-t1:.2f}s), "
                f"index={n_sym} hits ({t3-t2:.2f}s) for query='{query}'"
            )

            frames = [df for df in [by_name, by_symbol] if df is not None and not df.empty]
            if not frames:
                logger.info(f"[FinanceDB] No results for '{query}'")
                return []

            raw = pd.concat(frames)
            raw = raw[~raw.index.duplicated(keep="first")]

            # Relevance sorting: exact match → starts-with → contains (alphabetically within each tier)
            query_lower = query.lower()
            name_col = raw.get("name", pd.Series(dtype=str, index=raw.index)).fillna("").str.lower()
            sym_col = raw.index.str.lower()
            exact = (sym_col == query_lower) | (name_col == query_lower)
            starts = (
                sym_col.str.startswith(query_lower, na=False)
                | name_col.str.startswith(query_lower, na=False)
            )
            scores = pd.Series(2, index=raw.index, dtype=int)
            scores[starts] = 1
            scores[exact] = 0
            raw = raw.assign(_rel=scores).sort_values(["_rel", "name"]).drop(columns=["_rel"])

            results: list[SearchResult] = []
            for symbol, row in raw.head(limit).iterrows():
                name = row.get("name") or str(symbol)
                currency = row.get("currency") or None
                exchange = row.get("exchange") or None
                fund_family = row.get("family") or None
                category = row.get("category") or None
                results.append(SearchResult(
                    symbol=str(symbol),
                    name=str(name),
                    source_id="financedatabase",
                    source_name="FinanceDatabase",
                    currency=currency,
                    isin=None,
                    exchange=exchange,
                    fund_family=str(fund_family) if fund_family else None,
                    category=str(category) if category else None,
                ))

            logger.info(
                f"[FinanceDB] Returning {len(results)} results for '{query}' "
                f"(total: {t3-t0:.2f}s)"
            )
            return results
        except Exception as e:
            logger.warning(f"[FinanceDB] search failed for query '{query}': {e}", exc_info=True)
            return []
