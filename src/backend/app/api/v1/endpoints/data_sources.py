from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
import time
import logging
from app.api.v1 import deps
from app.crud.data_source import (
    get_all,
    get_by_id,
    update,
    update_priorities,
)
from app.schemas.data_source import (
    DataSourceConfigResponse,
    DataSourceConfigUpdate,
    DataSourcePrioritiesUpdate,
    DataSourceTestResult,
)
from app.services.data_sources import get_registry

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=List[DataSourceConfigResponse])
def list_data_sources(db: Session = Depends(deps.get_db)):
    """List all configured data sources, ordered by priority."""
    return get_all(db)


@router.put("/{source_id}", response_model=DataSourceConfigResponse)
def update_data_source(
    source_id: str,
    obj_in: DataSourceConfigUpdate,
    db: Session = Depends(deps.get_db),
):
    """Enable/disable a data source, update its API key or priority."""
    db_obj = update(db, source_id=source_id, obj_in=obj_in)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found")

    # If API key was updated, pass it to the registry
    if obj_in.api_key is not None:
        registry = get_registry()
        registry.configure_source(source_id, obj_in.api_key)

    return db_obj


@router.put("/priorities/bulk", response_model=List[DataSourceConfigResponse])
def update_data_source_priorities(
    obj_in: DataSourcePrioritiesUpdate,
    db: Session = Depends(deps.get_db),
):
    """Bulk-update priorities (e.g. after drag & drop reordering in UI)."""
    priorities = [{"source_id": p.source_id, "priority": p.priority} for p in obj_in.priorities]
    return update_priorities(db, priorities=priorities)


@router.get("/{source_id}/test", response_model=DataSourceTestResult)
def test_data_source(
    source_id: str,
    db: Session = Depends(deps.get_db),
):
    """Test connectivity for a data source by fetching one recent price."""
    config = get_by_id(db, source_id=source_id)
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found")

    registry = get_registry()
    source = registry.get_source(source_id)
    if not source:
        return DataSourceTestResult(
            source_id=source_id,
            success=False,
            message="No adapter registered for this source",
        )

    # Use a well-known ETF symbol for the connectivity test
    test_symbols = {
        "yfinance": "VWRL.L",
        "stooq": "VWRL.UK",
    }
    test_symbol = test_symbols.get(source_id, "VWRL.L")
    end = date.today()
    start = end - timedelta(days=7)

    start_ts = time.time()
    try:
        prices = source.fetch_prices(test_symbol, start, end)
        latency_ms = int((time.time() - start_ts) * 1000)
        if prices:
            return DataSourceTestResult(
                source_id=source_id,
                success=True,
                message=f"Connected — received {len(prices)} price(s) for {test_symbol}",
                latency_ms=latency_ms,
            )
        return DataSourceTestResult(
            source_id=source_id,
            success=False,
            message=f"Connected but no data returned for {test_symbol} (market may be closed)",
            latency_ms=latency_ms,
        )
    except Exception as e:
        latency_ms = int((time.time() - start_ts) * 1000)
        logger.warning(f"Test failed for {source_id}: {e}")
        return DataSourceTestResult(
            source_id=source_id,
            success=False,
            message=str(e),
            latency_ms=latency_ms,
        )
