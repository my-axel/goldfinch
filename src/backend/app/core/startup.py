from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.exchange_rate import ExchangeRate
from app.models.etf import ETF, ETFPrice
from app.tasks.exchange_rates import update_exchange_rates
from app.tasks.etf import update_etf_latest_prices
from app.crud import update_tracking
import logging

logger = logging.getLogger(__name__)

def check_and_trigger_updates():
    """
    Check for missing updates when the app starts and trigger catch-up tasks if needed.
    This ensures that if the app was down for multiple days, we'll fetch the missing data.
    Uses update tracking to avoid unnecessary updates on weekends/holidays.
    """
    logger.info("Running startup checks for missing updates...")
    db = SessionLocal()
    try:
        # Check exchange rates
        check_exchange_rates(db)
        
        # Check ETF prices
        check_etf_prices(db)
        
        # Cleanup old tracking records
        update_tracking.cleanup_old_tracking(db)
        
    except Exception as e:
        logger.error(f"Error during startup checks: {str(e)}")
    finally:
        db.close()

def check_exchange_rates(db: Session):
    """
    Check for missing exchange rate updates and trigger catch-up tasks if needed.
    Uses a streamlined approach to fetch only out-of-date currencies.
    """
    logger.info("Checking exchange rates during startup...")
    
    # Always create a tracking record for today
    today = date.today()
    tracking = update_tracking.get_or_create_tracking(db, today, "exchange_rates")
    
    try:
        # Get the latest exchange rate date
        latest_rate = db.query(ExchangeRate).order_by(ExchangeRate.date.desc()).first()
        latest_date = latest_rate.date if latest_rate else None
        
        # Use streamlined method to check and update exchange rates
        if update_tracking.should_attempt_update(db, "exchange_rates", latest_date):
            logger.info("Checking and fetching latest currency rates...")
            
            # Call the task to run the streamlined method with 'startup' update type
            update_exchange_rates.delay('startup')  
            
            update_tracking.mark_update_attempted(db, tracking, notes="Startup currency check initiated")
        else:
            notes = "Update not needed - already attempted today"
            logger.info(notes)
            update_tracking.mark_update_attempted(db, tracking, notes=notes)
    except Exception as e:
        error_msg = f"Error checking exchange rates on startup: {str(e)}"
        logger.error(error_msg)
        update_tracking.mark_update_attempted(db, tracking, notes=error_msg)

def check_etf_prices(db: Session):
    """
    Check for missing ETF price updates and trigger catch-up tasks if needed.
    Uses update tracking to avoid unnecessary updates on weekends/holidays.
    """
    today = date.today()
    
    # Get all ETFs
    etfs = db.query(ETF).all()
    
    for etf in etfs:
        # Always create a tracking record for today
        tracking_key = f"etf_prices_{etf.id}"
        tracking = update_tracking.get_or_create_tracking(db, today, tracking_key)
        
        latest_price = (
            db.query(ETFPrice)
            .filter(ETFPrice.etf_id == etf.id)
            .order_by(ETFPrice.date.desc())
            .first()
        )
        
        if not latest_price:
            logger.info(f"No prices found for ETF {etf.id}. This will be handled by the normal creation process.")
            update_tracking.mark_update_attempted(db, tracking, notes="No prices found - will be handled by creation process")
            continue
        
        days_missing = (today - latest_price.date).days
        
        # Check weekend condition first
        if today.weekday() >= 5:  # Weekend
            if days_missing > 3:
                notes = f"Weekend update triggered due to old data ({days_missing} days)"
                logger.info(f"Latest price for ETF {etf.id} is from {latest_price.date}. {notes}")
                if update_tracking.should_attempt_update(db, tracking_key, latest_price.date):
                    update_etf_latest_prices.delay(etf.id)
            else:
                notes = "Weekend - no update needed"
                logger.info(f"Latest price for ETF {etf.id} is from {latest_price.date}. {notes}")
            update_tracking.mark_update_attempted(db, tracking, notes=notes)
            continue
        
        # Regular weekday check
        if update_tracking.should_attempt_update(db, tracking_key, latest_price.date):
            logger.info(f"Latest price for ETF {etf.id} is from {latest_price.date} ({days_missing} days old). Triggering update...")
            update_etf_latest_prices.delay(etf.id)
            update_tracking.mark_update_attempted(db, tracking)
        else:
            notes = "Update not needed - already up to date or already attempted today"
            logger.info(f"Prices for ETF {etf.id} are up to date or update already attempted today (latest: {latest_price.date})")
            update_tracking.mark_update_attempted(db, tracking, notes=notes) 