from sqlalchemy.orm import Session
from app.crud.etf import etf_crud
from app.crud.pension_etf import pension_etf
from app.models.etf import ETF
from app.models.pension_etf import PensionETF
from app.models.task import TaskStatus
from app.db.session import SessionLocal
from datetime import date, timedelta
import logging

logger = logging.getLogger(__name__)

async def process_new_etf_pension(pension_id: int) -> None:
    """
    Background task to process a newly created ETF pension.
    This includes:
    1. Fetching historical ETF prices
    2. Realizing historical contributions if requested
    """
    db = SessionLocal()
    task = None
    try:
        # Create task status
        task = TaskStatus(
            task_type="etf_pension_processing",
            status="processing",
            resource_id=pension_id
        )
        db.add(task)
        db.commit()
        db.refresh(task)

        # Get the pension
        pension = pension_etf.get(db=db, id=pension_id)
        if not pension:
            raise ValueError(f"ETF Pension {pension_id} not found")

        # Get the ETF
        etf = etf_crud.get(db=db, id=pension.etf_id)
        if not etf:
            raise ValueError(f"ETF {pension.etf_id} not found")

        # Fetch historical prices
        logger.info(f"Fetching historical prices for ETF {etf.id}")
        etf_crud.refresh_full_history(db=db, etf_id=etf.id)

        # If historical contributions should be realized
        if pension.realize_historical_contributions:
            logger.info(f"Realizing historical contributions for pension {pension_id}")
            pension_etf.realize_historical_contributions(db=db, pension_id=pension_id)

        # Update task status to completed
        task.status = "completed"
        db.commit()

    except Exception as e:
        db.rollback()
        error_msg = str(e)
        logger.error(f"Error processing ETF pension {pension_id}: {error_msg}")
        
        # Update task status to failed
        if task:
            task.status = "failed"
            task.error = error_msg
            db.add(task)
            db.commit()
        
        raise e
    finally:
        db.close() 