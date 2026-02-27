from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from datetime import date
from app.api.v1 import deps
from app.schemas.etf import (
    ETFResponse,
    ETFCreate,
    ETFUpdate,
    ETFPriceCreate,
    ETFPriceResponse,
)
from app.schemas.etf_update import ETFUpdateResponse, ETFUpdateCreate
from app.crud.etf import etf_crud
from app.crud.etf_update import etf_update
from app.tasks.etf import update_etf_latest_prices, refresh_etf_prices, fetch_etf_data
from app.models.etf import ETFError, ETFPrice, ETFUpdate as ETFUpdateModel
from app.services.etf_service import ETFServiceError, ETFNotFoundError
from app.services.data_sources import get_registry, FinanceDatabaseSearch
from app.services.data_sources.stooq_source import StooqDataSource
import logging
import time
import re

logger = logging.getLogger(__name__)

# ISIN: 2 uppercase letters (country code) + 10 alphanumeric chars
_ISIN_RE = re.compile(r'^[A-Z]{2}[A-Z0-9]{10}$')
# Short ticker: 1-15 chars, only uppercase letters, digits, dots, hyphens — no spaces
_SHORT_TICKER_RE = re.compile(r'^[A-Z0-9][A-Z0-9.\-]{0,14}$')

router = APIRouter()

@router.get("/search", status_code=status.HTTP_200_OK, response_model=List[dict])
def search_etfs(
    query: str = Query(..., min_length=2, description="ETF name, symbol, or ISIN to search for"),
    db: Session = Depends(deps.get_db),
):
    """
    Search ETFs. Query routing:
    - ISIN (e.g. LU2572257124): resolved directly via yFinance ISIN lookup
    - Short ticker (e.g. AHYQ, AHYQ.DE): resolved via yFinance + FinanceDB name search
    - Everything else: FinanceDatabase offline full-text search

    Returns results annotated with the data source:
    - source='yfinance': Yahoo Finance compatible symbol
    - source='stooq': Stooq-mapped symbol (derived, not live-validated)
    """
    t0 = time.monotonic()
    query_upper = query.strip().upper()
    logger.info(f"[ETF Search] query='{query}'")
    try:
        # Get enabled sources from DB first (needed for ISIN/ticker lookup too)
        registry = get_registry()
        active_sources = registry.get_active_sources(db)
        active_source_ids = {s.source_id for s in active_sources}
        logger.info(f"[ETF Search] Active sources: {active_source_ids}")

        fd_results = []

        # --- ISIN lookup ---
        # If the query looks like an ISIN (e.g. "LU2572257124"), skip FinanceDB and
        # resolve directly via yFinance — it maps ISINs to Yahoo tickers reliably.
        if _ISIN_RE.match(query_upper) and "yfinance" in active_source_ids:
            logger.info(f"[ETF Search] Detected ISIN pattern: {query_upper}")
            yf_source = registry.get_source("yfinance")
            if yf_source and hasattr(yf_source, "lookup_by_isin"):
                isin_result = yf_source.lookup_by_isin(query_upper)
                if isin_result:
                    fd_results = [isin_result]
                    logger.info(f"[ETF Search] ISIN resolved to symbol={isin_result.symbol}")

        # --- Short ticker lookup ---
        # If the query is a short uppercase ticker (e.g. "AHYQ" or "AHYQ.DE"),
        # try resolving it directly via yFinance. Also run FinanceDB alongside.
        elif _SHORT_TICKER_RE.match(query_upper) and "yfinance" in active_source_ids:
            logger.info(f"[ETF Search] Detected ticker pattern: {query_upper}")
            yf_source = registry.get_source("yfinance")
            if yf_source and hasattr(yf_source, "lookup_by_symbol"):
                ticker_result = yf_source.lookup_by_symbol(query_upper)
                if ticker_result:
                    fd_results = [ticker_result]
                    logger.info(f"[ETF Search] Ticker {query_upper!r} resolved: {ticker_result.symbol}")
            # Also run FinanceDB for name-based hits — merge results, deduplicate by symbol
            fd_name_results = FinanceDatabaseSearch().search(query, limit=30)
            seen_symbols = {r.symbol for r in fd_results}
            for r in fd_name_results:
                if r.symbol not in seen_symbols:
                    fd_results.append(r)
                    seen_symbols.add(r.symbol)

        # --- Name/full-text search (default) ---
        else:
            fd_results = FinanceDatabaseSearch().search(query, limit=30)

        logger.info(f"[ETF Search] FinanceDB+lookup returned {len(fd_results)} results in {time.monotonic()-t0:.2f}s")

        if not fd_results:
            return []

        results = []
        stooq_adapter = StooqDataSource()
        stooq_count = 0
        # Track seen Stooq symbols to avoid duplicates
        # (e.g. AMEW.DE and AMEW.F both map to AMEW.DE on Stooq)
        seen_stooq_symbols: set[str] = set()

        for fd_result in fd_results:
            symbol = fd_result.symbol
            name = fd_result.name
            currency = fd_result.currency
            isin = fd_result.isin
            exchange = fd_result.exchange
            fund_family = fd_result.fund_family
            category = fd_result.category

            # yFinance result (symbol is Yahoo-compatible)
            if "yfinance" in active_source_ids:
                results.append({
                    "symbol": symbol,
                    "shortName": name,
                    "longName": name,
                    "currency": currency,
                    "isin": isin,
                    "exchange": exchange,
                    "fund_family": fund_family,
                    "category": category,
                    "source": "yfinance",
                    "source_name": "Yahoo Finance (yFinance)",
                })

            # Stooq result (symbol derived via heuristic mapping, no live validation)
            if "stooq" in active_source_ids:
                stooq_symbol = stooq_adapter.yahoo_to_stooq_symbol(symbol)
                if stooq_symbol is not None and stooq_symbol not in seen_stooq_symbols:
                    seen_stooq_symbols.add(stooq_symbol)
                    stooq_count += 1
                    results.append({
                        "symbol": stooq_symbol,
                        "shortName": name,
                        "longName": name,
                        "currency": currency,
                        "isin": isin,
                        "exchange": exchange,
                        "fund_family": fund_family,
                        "category": category,
                        "source": "stooq",
                        "source_name": "Stooq",
                        "symbol_derived": True,  # Flag: not live-validated
                    })

        logger.info(
            f"[ETF Search] Returning {len(results)} total results "
            f"(yfinance={len(fd_results) if 'yfinance' in active_source_ids else 0}, "
            f"stooq={stooq_count}) in {time.monotonic()-t0:.2f}s"
        )
        return results
    except Exception as e:
        logger.error(f"[ETF Search] Error for query '{query}': {e}", exc_info=True)
        return []

@router.get("", response_model=List[ETFResponse], status_code=status.HTTP_200_OK)
def get_etfs(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, gt=0, le=1000),
    query: Optional[str] = None,
    is_active: Optional[bool] = None,
    provider: Optional[str] = None
):
    """
    Retrieve ETFs with optional filtering and search.
    """
    try:
        if query:
            return etf_crud.search(db, query=query)
            
        filters = {}
        if is_active is not None:
            filters["is_active"] = is_active
        if provider:
            filters["provider"] = provider
        return etf_crud.get_multi(db, skip=skip, limit=limit, filters=filters)
    except Exception as e:
        logger.error(f"Error retrieving ETFs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving ETFs"
        )

@router.get("/{etf_id}", response_model=ETFResponse, status_code=status.HTTP_200_OK)
def get_etf(
    etf_id: str,
    db: Session = Depends(deps.get_db)
):
    """
    Get a specific ETF by ID (ISIN).
    """
    try:
        etf = etf_crud.get(db, id=etf_id)
        if not etf:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ETF not found"
            )
        return etf
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving ETF {etf_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving ETF"
        )

@router.post("", response_model=ETFResponse, status_code=status.HTTP_201_CREATED)
def create_etf(
    etf_in: ETFCreate,
    db: Session = Depends(deps.get_db)
):
    """
    Create a new ETF.
    """
    try:
        existing_etf = etf_crud.get(db, id=etf_in.id)
        if existing_etf:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"ETF with ID {etf_in.id} already exists"
            )
        return etf_crud.create(db, obj_in=etf_in)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating ETF: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating ETF"
        )

@router.put("/{etf_id}", response_model=ETFResponse)
def update_etf(
    etf_id: str,
    etf_in: ETFUpdate,
    db: Session = Depends(deps.get_db)
):
    """
    Update an ETF.
    """
    try:
        etf = etf_crud.get(db, id=etf_id)
        if not etf:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ETF not found"
            )
        return etf_crud.update(db, db_obj=etf, obj_in=etf_in)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating ETF {etf_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating ETF"
        )

@router.delete("/{etf_id}")
def delete_etf(
    etf_id: str,
    db: Session = Depends(deps.get_db)
):
    """
    Delete an ETF.
    """
    etf = etf_crud.get(db, id=etf_id)
    if not etf:
        raise HTTPException(status_code=404, detail="ETF not found")
    etf_crud.remove(db, id=etf_id)
    return {"message": "ETF deleted successfully"}

@router.post("/{etf_id}/prices", response_model=ETFPriceResponse)
def add_etf_price(
    etf_id: str,
    price_in: ETFPriceCreate,
    db: Session = Depends(deps.get_db)
):
    """
    Add a new price point for an ETF.
    """
    etf = etf_crud.get(db, id=etf_id)
    if not etf:
        raise HTTPException(status_code=404, detail="ETF not found")
    return etf_crud.add_price(db, etf_id=etf_id, obj_in=price_in)

@router.get("/{etf_id}/prices", response_model=List[ETFPriceResponse])
def get_etf_prices(
    etf_id: str,
    db: Session = Depends(deps.get_db),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100
):
    """
    Get historical prices for an ETF with optional date range filtering.
    """
    etf = etf_crud.get(db, id=etf_id)
    if not etf:
        raise HTTPException(status_code=404, detail="ETF not found")
    return etf_crud.get_prices(
        db,
        etf_id=etf_id,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit
    )

@router.post("/{etf_id}/update", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
def trigger_etf_update(
    etf_id: str,
    update_type: str = Query(
        ...,
        description="Type of update: 'full', 'prices_only', 'prices_refresh'",
        pattern="^(full|prices_only|prices_refresh)$"
    ),
    db: Session = Depends(deps.get_db)
):
    """
    Trigger an ETF data update.
    - full: Complete refresh of ETF data and prices
    - prices_only: Update only missing recent prices
    - prices_refresh: Refresh all historical prices
    """
    try:
        etf = etf_crud.get(db, id=etf_id)
        if not etf:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ETF not found"
            )
            
        # Create update record
        update_record = etf_update.create_with_status(
            db,
            obj_in=ETFUpdateCreate(
                etf_id=etf_id,
                update_type=update_type,
                start_date=date.today(),
                end_date=date.today()
            ),
            status="pending"
        )
            
        if update_type == "full":
            task = fetch_etf_data.delay(etf_id)
        elif update_type == "prices_only":
            task = update_etf_latest_prices.delay(etf_id)
        elif update_type == "prices_refresh":
            task = refresh_etf_prices.delay(etf_id)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid update type"
            )
            
        return {
            "message": f"ETF update ({update_type}) scheduled",
            "task_id": task.id,
            "update_id": update_record.id,
            "status": "pending"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error triggering ETF update: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error triggering ETF update"
        )

@router.get("/{etf_id}/status", response_model=List[ETFUpdateResponse], status_code=status.HTTP_200_OK)
def get_etf_status(
    etf_id: str,
    limit: int = Query(10, gt=0, le=100),
    db: Session = Depends(deps.get_db)
):
    """
    Get status of recent ETF updates.
    Returns:
    - Recent update operations
    - Update status
    - Missing dates
    - Error information
    """
    try:
        # First check if ETF exists
        etf = etf_crud.get(db, id=etf_id)
        if not etf:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ETF not found"
            )
            
        # Get recent updates for this ETF
        try:
            recent_updates = (
                db.query(ETFUpdateModel)
                .filter(ETFUpdateModel.etf_id == etf_id)
                .order_by(ETFUpdateModel.created_at.desc())
                .limit(limit)
                .all()
            )
            return recent_updates
        except SQLAlchemyError as e:
            logger.error(f"Database error when retrieving ETF status: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error when retrieving ETF status"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error retrieving ETF status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error retrieving ETF status"
        )

@router.get("/{etf_id}/metrics", status_code=status.HTTP_200_OK)
def get_etf_metrics(
    etf_id: str,
    db: Session = Depends(deps.get_db)
):
    """
    Get ETF metrics including:
    - Price update frequency
    - Data completeness
    - Error rates
    - Performance metrics
    """
    try:
        etf = etf_crud.get(db, id=etf_id)
        if not etf:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ETF not found"
            )
            
        # Get latest update status
        latest_update = etf_update.get_latest_by_etf(db, etf_id=etf_id)
        
        # Get error statistics
        error_count = db.query(ETFError).filter(
            ETFError.etf_id == etf_id,
            ETFError.resolved == False  # noqa: E712
        ).count()
        
        # Get price statistics
        price_count = db.query(ETFPrice).filter(ETFPrice.etf_id == etf_id).count()
        
        return {
            "update_status": latest_update.status if latest_update else "unknown",
            "last_update": etf.last_update,
            "price_count": price_count,
            "unresolved_errors": error_count,
            "performance_metrics": {
                "ytd_return": etf.ytd_return,
                "one_year_return": etf.one_year_return,
                "volatility_30d": etf.volatility_30d,
                "sharpe_ratio": etf.sharpe_ratio
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving ETF metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving ETF metrics"
        ) 