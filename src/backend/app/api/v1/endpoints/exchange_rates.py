from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.api.v1 import deps
from app.services.exchange_rate import ExchangeRateService
from app.schemas.exchange_rate import (
    ExchangeRateResponse,
    ExchangeRateUpdateResponse,
    ExchangeRateUpdate as ExchangeRateUpdateSchema
)
from app.models.exchange_rate import ExchangeRateUpdate, ExchangeRate
from app.tasks.exchange_rates import update_exchange_rates
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/latest", response_model=ExchangeRateResponse)
async def get_latest_rates(
    db: Session = Depends(deps.get_db)
):
    """
    Get the most recent available exchange rates.
    If today's rates are not available (weekend/holiday), returns the latest available rates.
    """
    today = date.today()
    rates = ExchangeRateService.get_rates_for_date(db, today)
    
    if not rates:
        # Get the latest rate date from the database
        latest_rate = (
            db.query(ExchangeRate.date)
            .order_by(ExchangeRate.date.desc())
            .first()
        )
        
        if latest_rate:
            logger.info(f"No rates for today ({today}), using latest available date: {latest_rate.date}")
            rates = ExchangeRateService.get_rates_for_date(db, latest_rate.date)
            return {"date": latest_rate.date, "rates": rates}
            
        # If no rates at all, trigger an update
        logger.info("No rates found in database, triggering update")
        await ExchangeRateService.manage_rate_update(
            db=db,
            update_type='daily',
            start_date=today,
            end_date=today
        )
        
        # Try to get rates again after update
        latest_rate = (
            db.query(ExchangeRate.date)
            .order_by(ExchangeRate.date.desc())
            .first()
        )
        
        if latest_rate:
            rates = ExchangeRateService.get_rates_for_date(db, latest_rate.date)
            return {"date": latest_rate.date, "rates": rates}
    
    return {"date": today, "rates": rates or {}}

@router.get("/status", response_model=ExchangeRateUpdateResponse)
async def get_update_status(
    limit: int = Query(10, gt=0, le=100),
    db: Session = Depends(deps.get_db)
):
    """
    Get status of exchange rate updates.
    Returns:
    - Recent update operations
    - Total rates count
    - Latest rate date
    - Currency coverage statistics
    - Missing dates count
    """
    logger.info("Starting to fetch exchange rate update status")
    
    try:
        # First try to get recent updates
        logger.info("Fetching recent updates")
        recent_updates = (
            db.query(ExchangeRateUpdate)  # Now using the SQLAlchemy model
            .order_by(ExchangeRateUpdate.created_at.desc())
            .limit(limit)
            .all()
        )
        logger.info(f"Found {len(recent_updates)} recent updates")
        
        # Then get statistics
        logger.info("Fetching exchange rate statistics")
        try:
            stats = ExchangeRateService.get_update_statistics(db)
            logger.info("Successfully retrieved statistics")
        except Exception as stats_error:
            logger.error(f"Failed to get statistics: {str(stats_error)}")
            # Continue with empty stats if statistics fail
            stats = {
                'total_rates': 0,
                'latest_rate_date': None,
                'currencies_coverage': {},
                'missing_dates_count': 0
            }
        
        response = {
            "recent_updates": recent_updates,
            **stats
        }
        
        logger.info("Successfully prepared status response")
        return response
        
    except Exception as e:
        logger.error(f"Failed to get update status: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get exchange rate update status: {str(e)}"
        )

@router.post("/update/historical")
async def trigger_historical_update(
    start_date: Optional[date] = None,
    currencies: Optional[List[str]] = None,
    db: Session = Depends(deps.get_db)
):
    """
    Trigger a manual historical update.
    If start_date not provided, defaults to 1999-01-01.
    """
    try:
        # Convert dates to ISO format for Celery
        start_str = start_date.isoformat() if start_date else None
        
        # Directly call Celery task
        task = update_exchange_rates.delay(
            update_type='manual_historical',
            start_date=start_str,
            currencies=currencies
        )
        
        return {
            "message": "Historical update scheduled",
            "task_id": task.id,
            "start_date": start_date or date(1999, 1, 1),
            "currencies": currencies or ExchangeRateService.DEFAULT_CURRENCIES
        }
        
    except Exception as e:
        logger.error(f"Failed to schedule historical update: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to schedule historical exchange rate update"
        )

@router.post("/update/latest")
async def trigger_latest_update(
    background_tasks: BackgroundTasks,
    currencies: Optional[List[str]] = None,
    db: Session = Depends(deps.get_db)
):
    """
    Trigger a manual update for the latest rates.
    """
    try:
        today = date.today()
        
        # Schedule the update task
        background_tasks.add_task(
            update_exchange_rates.delay,
            'manual_latest',
            start_date=today.isoformat(),
            end_date=today.isoformat(),
            currencies=currencies
        )
        
        return {
            "message": "Latest rates update scheduled",
            "date": today,
            "currencies": currencies or ExchangeRateService.DEFAULT_CURRENCIES
        }
        
    except Exception as e:
        logger.error(f"Failed to schedule latest update: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to schedule latest exchange rate update"
        )

@router.get("/historical/{rate_date}", response_model=ExchangeRateResponse)
async def get_historical_rates(
    rate_date: date,
    use_previous_rates: bool = Query(
        True,
        description="If True, returns the most recent rates before the requested date when exact date is not available"
    ),
    db: Session = Depends(deps.get_db)
):
    """
    Get historical exchange rates for a specific date.
    If rates are not available for the exact date and use_previous_rates is True:
    1. First tries to find the most recent rates before the requested date
    2. If no previous rates found, attempts to update data for the date
    3. After update, tries again to find the most recent rates
    
    If use_previous_rates is False, only returns rates for the exact date requested.
    """
    # First try exact date
    rates = ExchangeRateService.get_rates_for_date(db, rate_date)
    
    if not rates and use_previous_rates:
        # If no exact match and fallback is enabled, try to find the most recent rates before this date
        latest_rate_date = (
            db.query(ExchangeRate.date)
            .filter(ExchangeRate.date < rate_date)
            .order_by(ExchangeRate.date.desc())
            .first()
        )
        
        if latest_rate_date:
            logger.info(f"No rates for {rate_date}, using latest available date: {latest_rate_date.date}")
            rates = ExchangeRateService.get_rates_for_date(db, latest_rate_date.date)
            return {"date": latest_rate_date.date, "rates": rates}
            
        # If no previous rates found, try to update
        logger.info(f"No previous rates found before {rate_date}, attempting to update")
        await ExchangeRateService.manage_rate_update(
            db=db,
            update_type='manual_historical',
            start_date=rate_date,
            end_date=rate_date
        )
        
        # After update, try again to find the most recent rates
        latest_rate_date = (
            db.query(ExchangeRate.date)
            .filter(ExchangeRate.date <= rate_date)
            .order_by(ExchangeRate.date.desc())
            .first()
        )
        
        if latest_rate_date:
            rates = ExchangeRateService.get_rates_for_date(db, latest_rate_date.date)
            return {"date": latest_rate_date.date, "rates": rates}
    
    if not rates:
        # If no rates found (either exact match required or fallback failed)
        detail_msg = (
            f"No exchange rates available for {rate_date}"
            if not use_previous_rates else
            f"No exchange rates available on or before {rate_date}"
        )
        raise HTTPException(status_code=404, detail=detail_msg)
    
    return {"date": rate_date, "rates": rates}

@router.post("/update")
async def update_rates(
    db: Session = Depends(deps.get_db)
):
    """Manually trigger an update of latest exchange rates"""
    await ExchangeRateService.update_rates(db)
    return {"message": "Exchange rates updated successfully"} 