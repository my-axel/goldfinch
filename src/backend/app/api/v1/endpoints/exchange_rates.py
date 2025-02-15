from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.api.v1 import deps
from app.services.exchange_rate import ExchangeRateService
from app.schemas.exchange_rate import ExchangeRateResponse

router = APIRouter()

@router.get("/latest", response_model=ExchangeRateResponse)
async def get_latest_rates(
    db: Session = Depends(deps.get_db)
):
    """Get latest exchange rates"""
    today = date.today()
    rates = ExchangeRateService.get_rates_for_date(db, today)
    
    if not rates:
        # If no rates for today, fetch and store them
        await ExchangeRateService.update_rates(db)
        rates = ExchangeRateService.get_rates_for_date(db, today)
    
    return {"date": today, "rates": rates}

@router.get("/historical/{rate_date}", response_model=ExchangeRateResponse)
async def get_historical_rates(
    rate_date: date,
    db: Session = Depends(deps.get_db)
):
    """Get historical exchange rates for a specific date"""
    rates = ExchangeRateService.get_rates_for_date(db, rate_date)
    
    if not rates:
        # If no rates for the requested date, try to backfill
        await ExchangeRateService.backfill_historical_rates(
            db,
            start_date=rate_date,
            end_date=rate_date
        )
        rates = ExchangeRateService.get_rates_for_date(db, rate_date)
        
        if not rates:
            raise HTTPException(
                status_code=404,
                detail=f"No exchange rates available for {rate_date}"
            )
    
    return {"date": rate_date, "rates": rates}

@router.post("/backfill")
async def backfill_rates(
    start_date: date,
    end_date: Optional[date] = None,
    currencies: Optional[List[str]] = Query(None),
    db: Session = Depends(deps.get_db)
):
    """
    Backfill historical exchange rates for a date range.
    If no end_date is provided, it will fetch until today.
    If no currencies are provided, it will fetch common currencies (USD, CHF, GBP, JPY).
    """
    await ExchangeRateService.backfill_historical_rates(
        db,
        start_date=start_date,
        end_date=end_date,
        currencies=currencies
    )
    return {
        "message": "Historical exchange rates backfilled successfully",
        "start_date": start_date,
        "end_date": end_date or date.today(),
        "currencies": currencies or ['USD', 'CHF', 'GBP', 'JPY']
    }

@router.post("/update")
async def update_rates(
    db: Session = Depends(deps.get_db)
):
    """Manually trigger an update of latest exchange rates"""
    await ExchangeRateService.update_rates(db)
    return {"message": "Exchange rates updated successfully"} 