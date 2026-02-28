from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.services import etf_service
from app.crud.etf_update import etf_update
from app.models.etf import ETF, ETFPrice, ETFUpdate
from datetime import date, timedelta
import logging
from celery.exceptions import MaxRetriesExceededError
from celery.utils.log import get_task_logger
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text

logger = get_task_logger(__name__)

def handle_task_error(task, exc, etf_id: str, task_type: str):
    """Handle task errors with proper logging and retry logic."""
    try:
        # Test database connection
        try:
            db = SessionLocal()
            db.execute(text("SELECT 1"))
            logger.info(f"Database connection test successful for {task_type} task")
        except Exception as db_exc:
            logger.error(f"Database connection test failed: {str(db_exc)}")
            raise

        # Log the error
        if isinstance(exc, SQLAlchemyError):
            logger.error(f"Database error in {task_type} for ETF {etf_id}: {str(exc)}")
        else:
            logger.error(f"Error in {task_type} for ETF {etf_id}: {str(exc)}")
        
        # Calculate retry delay with exponential backoff
        retry_delay = 60 * (2 ** task.request.retries)  # 60s, 120s, 240s, etc.
        
        # Create a new session for updating status
        db = SessionLocal()
        try:
            latest_update = etf_update.get_latest_by_etf(db, etf_id=etf_id)
            if latest_update:
                etf_update.update_status(
                    db=db,
                    db_obj=latest_update,
                    status="retrying",
                    error=f"Attempt {task.request.retries + 1} failed: {str(exc)}"
                )
            db.commit()
        except Exception as e:
            logger.error(f"Failed to update status: {str(e)}")
            db.rollback()
        finally:
            db.close()
        
        # Retry the task
        raise task.retry(exc=exc, countdown=retry_delay, max_retries=3)
    except MaxRetriesExceededError:
        logger.error(f"Max retries exceeded for {task_type} ETF {etf_id}")
        # Update the ETF update status to failed
        db = SessionLocal()
        try:
            latest_update = etf_update.get_latest_by_etf(db, etf_id=etf_id)
            if latest_update:
                etf_update.update_status(
                    db=db,
                    db_obj=latest_update,
                    status="failed",
                    error=f"Max retries exceeded: {str(exc)}"
                )
            db.commit()
        except Exception as e:
            logger.error(f"Failed to update final status: {str(e)}")
            db.rollback()
        finally:
            db.close()
        raise

@celery_app.task(bind=True)
def fetch_etf_data(self, etf_id: str) -> None:
    """
    Celery task to fetch and update complete ETF data including historical prices.
    Use this for new ETFs or when a complete refresh is needed.
    """
    logger.info(f"Starting initial data fetch for ETF {etf_id}")
    db = SessionLocal()
    try:
        etf_service.update_etf_data(db, etf_id)
        logger.info(f"Successfully completed initial data fetch for ETF {etf_id}")
        db.commit()
    except Exception as exc:
        db.rollback()
        handle_task_error(self, exc, etf_id, "initial data fetch")
    finally:
        db.close()

@celery_app.task(bind=True)
def update_etf_latest_prices(self, etf_id: str) -> None:
    """
    Celery task to update only missing recent prices for an ETF.
    This is more efficient than fetching the complete history.
    """
    logger.info(f"Starting price update for ETF {etf_id}")
    db = SessionLocal()
    try:
        etf_service.update_latest_prices(db, etf_id)
        logger.info(f"Successfully updated latest prices for ETF {etf_id}")
        db.commit()
    except Exception as exc:
        db.rollback()
        handle_task_error(self, exc, etf_id, "price update")
    finally:
        db.close()

@celery_app.task(bind=True)
def refresh_etf_prices(self, etf_id: str) -> None:
    """
    Celery task to refresh all ETF prices.
    """
    logger.info(f"Starting full price refresh for ETF {etf_id}")
    db = SessionLocal()
    try:
        etf_service.refresh_prices(db, etf_id)
        logger.info(f"Successfully refreshed all prices for ETF {etf_id}")
        db.commit()
    except Exception as exc:
        db.rollback()
        handle_task_error(self, exc, etf_id, "price refresh")
    finally:
        db.close()

@celery_app.task
def update_all_etf_prices() -> None:
    """
    Daily task to update prices for all active ETFs.
    Uses DailyUpdateTracking to skip ETFs that were already updated today,
    and to skip weekends when markets are closed and data is still fresh.
    Mirrors how exchange rates are updated at 16:30 UTC.
    """
    from app.crud.update_tracking import update_tracking
    logger.info("Starting daily ETF price update")
    db = SessionLocal()
    try:
        etfs = db.query(ETF).filter(ETF.is_active == True).all()  # noqa: E712
        logger.info(f"Checking prices for {len(etfs)} active ETFs")
        triggered = 0
        for etf in etfs:
            tracking_key = f"etf_prices_{etf.id}"
            latest_price = (
                db.query(ETFPrice)
                .filter(ETFPrice.etf_id == etf.id)
                .order_by(ETFPrice.date.desc())
                .first()
            )
            latest_date = latest_price.date if latest_price else None
            if update_tracking.should_attempt_update(db, tracking_key, latest_date):
                update_etf_latest_prices.delay(etf.id)
                tracking = update_tracking.get_or_create_tracking(db, date.today(), tracking_key)
                update_tracking.mark_update_attempted(db, tracking, data_found=latest_date is not None)
                triggered += 1
        logger.info(f"Triggered price updates for {triggered}/{len(etfs)} ETFs")
    except Exception as exc:
        logger.error(f"Failed to run daily ETF price update: {str(exc)}")
        raise
    finally:
        db.close()


@celery_app.task
def cleanup_old_updates() -> None:
    """
    Celery task to clean up old ETF update records.
    Keeps only the last 30 days of updates.
    """
    logger.info("Starting cleanup of old ETF update records")
    db = SessionLocal()
    try:
        # Get all completed updates older than 30 days
        thirty_days_ago = date.today() - timedelta(days=30)
        old_updates = db.query(ETFUpdate).filter(
            ETFUpdate.status.in_(["completed", "completed_with_errors"]),
            ETFUpdate.completed_at < thirty_days_ago
        ).all()

        # Delete old updates
        for update in old_updates:
            db.delete(update)

        db.commit()
        logger.info(f"Successfully cleaned up {len(old_updates)} old ETF update records")
    except Exception as exc:
        logger.error(f"Failed to clean up old ETF update records: {str(exc)}")
        db.rollback()
        raise
    finally:
        db.close()