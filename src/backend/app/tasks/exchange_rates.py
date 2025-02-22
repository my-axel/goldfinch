from datetime import date, datetime, timedelta
from typing import Optional, List
from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.services.exchange_rate import ExchangeRateService
import logging
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

def run_in_session(func):
    """Decorator to handle database sessions"""
    def wrapper(*args, **kwargs):
        db = SessionLocal()
        try:
            result = func(db, *args, **kwargs)
            return result
        except Exception as e:
            logger.error(f"Task error: {str(e)}")
            raise
        finally:
            db.close()
    return wrapper

@celery_app.task(bind=True, max_retries=3)
def update_exchange_rates(
    self,
    update_type: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    currencies: Optional[List[str]] = None
) -> None:
    """
    Celery task to update exchange rates.
    Handles both scheduled daily updates and manual updates.
    
    Args:
        update_type: One of 'historical', 'daily', 'manual_historical', 'manual_latest'
        start_date: Optional start date in ISO format (YYYY-MM-DD)
        end_date: Optional end date in ISO format (YYYY-MM-DD)
        currencies: Optional list of currencies to update
    """
    logger.info(f"Starting exchange rate update task: {update_type}")
    
    try:
        # Convert date strings to date objects if provided
        start = date.fromisoformat(start_date) if start_date else None
        end = date.fromisoformat(end_date) if end_date else None
        
        @run_in_session
        def perform_update(db):
            # Use sync version of service methods
            return ExchangeRateService.manage_rate_update_sync(
                db=db,
                update_type=update_type,
                start_date=start,
                end_date=end,
                currencies=currencies
            )
        
        perform_update()
        logger.info(f"Completed exchange rate update task: {update_type}")
        
    except Exception as exc:
        logger.error(f"Failed to update exchange rates: {str(exc)}")
        # Retry with exponential backoff
        retry_in = 60 * (2 ** self.request.retries)  # 60s, 120s, 240s
        self.retry(exc=exc, countdown=retry_in)

@celery_app.task
def cleanup_old_updates() -> None:
    """
    Celery task to clean up old completed update records.
    Runs daily to remove records older than 30 days.
    """
    logger.info("Starting cleanup of old exchange rate updates")
    
    @run_in_session
    def perform_cleanup(db):
        return ExchangeRateService.cleanup_old_updates_sync(db)
    
    try:
        perform_cleanup()
        logger.info("Completed cleanup of old exchange rate updates")
        
    except Exception as e:
        logger.error(f"Failed to cleanup old updates: {str(e)}")
        raise 