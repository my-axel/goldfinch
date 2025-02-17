from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
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
from app.crud.etf import etf_crud
import yfinance as yf

router = APIRouter()

@router.get("/search", status_code=200)
async def search_yfinance(
    query: str = Query(..., min_length=2, description="ETF symbol to search for")
):
    """Search ETFs using yfinance API"""
    try:
        # Try to get ticker info
        ticker = yf.Ticker(query)
        
        # Force info download with a new session
        info = ticker.fast_info
        
        if info:
            return [{
                'symbol': query.upper(),
                'shortName': ticker.info.get('shortName'),
                'longName': ticker.info.get('longName'),
                'currency': ticker.info.get('currency')
            }]
        return []
    except Exception as e:
        print(f"Error searching for ETF {query}: {str(e)}")
        # Try alternative method if first one fails
        try:
            tickers = yf.download(query, period='1d')
            if not tickers.empty:
                return [{
                    'symbol': query.upper(),
                    'shortName': query.upper(),
                    'longName': query.upper(),
                    'currency': 'Unknown'  # We can't get currency from download
                }]
        except Exception as e2:
            print(f"Second attempt failed: {str(e2)}")
        return []

@router.get("", response_model=List[ETFResponse])
def get_etfs(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    query: Optional[str] = None,
    is_active: Optional[bool] = None,
    provider: Optional[str] = None
):
    """
    Retrieve ETFs with optional filtering and search.
    """
    if query:
        return etf_crud.search(db, query=query)
        
    filters = {}
    if is_active is not None:
        filters["is_active"] = is_active
    if provider:
        filters["provider"] = provider
    return etf_crud.get_multi(db, skip=skip, limit=limit, filters=filters)

@router.get("/{etf_id}", response_model=ETFResponse)
def get_etf(
    etf_id: str,
    db: Session = Depends(deps.get_db)
):
    """
    Get a specific ETF by ID (ISIN).
    """
    etf = etf_crud.get(db, id=etf_id)
    if not etf:
        raise HTTPException(status_code=404, detail="ETF not found")
    return etf

@router.post("", response_model=ETFResponse)
def create_etf(
    etf_in: ETFCreate,
    db: Session = Depends(deps.get_db)
):
    """
    Create a new ETF.
    """
    existing_etf = etf_crud.get(db, id=etf_in.id)
    if existing_etf:
        raise HTTPException(
            status_code=400,
            detail=f"ETF with ISIN {etf_in.id} already exists"
        )
    return etf_crud.create(db, obj_in=etf_in)

@router.put("/{etf_id}", response_model=ETFResponse)
def update_etf(
    etf_id: str,
    etf_in: ETFUpdate,
    db: Session = Depends(deps.get_db)
):
    """
    Update an ETF.
    """
    etf = etf_crud.get(db, id=etf_id)
    if not etf:
        raise HTTPException(status_code=404, detail="ETF not found")
    return etf_crud.update(db, db_obj=etf, obj_in=etf_in)

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