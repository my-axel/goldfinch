from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.services import etf_service
import logging

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=3)
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
    except Exception as exc:
        logger.error(f"Failed to fetch initial data for ETF {etf_id}: {str(exc)}")
        self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
    finally:
        db.close()

@celery_app.task(bind=True, max_retries=3)
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
    except Exception as exc:
        logger.error(f"Failed to update latest prices for ETF {etf_id}: {str(exc)}")
        self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
    finally:
        db.close()

@celery_app.task(bind=True, max_retries=3)
def refresh_etf_prices(self, etf_id: str) -> None:
    """
    Celery task to refresh all ETF prices.
    """
    logger.info(f"Starting full price refresh for ETF {etf_id}")
    db = SessionLocal()
    try:
        etf_service.refresh_prices(db, etf_id)
        logger.info(f"Successfully refreshed all prices for ETF {etf_id}")
    except Exception as exc:
        logger.error(f"Failed to refresh prices for ETF {etf_id}: {str(exc)}")
        self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
    finally:
        db.close()