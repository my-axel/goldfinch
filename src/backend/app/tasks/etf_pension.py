from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.crud.pension_etf import pension_etf
from app.crud.etf import etf_crud
from app.models.task import TaskStatus
import logging

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=3)
def process_new_etf_pension(self, pension_id: int) -> None:
    """
    Celery task to process a newly created ETF pension.
    This includes:
    1. Fetching historical ETF prices
    2. Realizing historical contributions if requested
    """
    logger.info(f"Starting processing of new ETF pension {pension_id}")
    db = SessionLocal()
    task = None
    try:
        # Get the original task to get its metadata
        original_task = db.query(TaskStatus).filter(
            TaskStatus.task_type == "etf_pension_processing",
            TaskStatus.resource_id == pension_id,
            TaskStatus.status == "pending"
        ).first()

        if not original_task:
            logger.error(f"No pending task found for pension {pension_id}")
            return

        logger.info(f"Found original task with metadata: {original_task.task_metadata}")

        # Create processing task status with metadata from original task
        task = TaskStatus(
            task_type="etf_pension_processing",
            status="processing",
            resource_id=pension_id,
            task_metadata=original_task.task_metadata
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        logger.info(f"Created processing task status for pension {pension_id}")

        # Get the pension
        pension = pension_etf.get(db=db, id=pension_id)
        if not pension:
            raise ValueError(f"ETF Pension {pension_id} not found")

        # Get the ETF
        etf = etf_crud.get(db=db, id=pension.etf_id)
        if not etf:
            raise ValueError(f"ETF {pension.etf_id} not found")

        # Update only the latest prices - no need for full history refresh
        logger.info(f"Updating latest prices for ETF {etf.id}")
        etf_crud.update_latest_prices(db=db, etf_id=etf.id)
        logger.info(f"Successfully updated prices for ETF {etf.id}")

        # Check if we should realize historical contributions
        should_realize = task.task_metadata and task.task_metadata.get("realize_historical_contributions")
        logger.info(f"Should realize historical contributions: {should_realize}")

        if should_realize:
            logger.info(f"Starting to realize historical contributions for pension {pension_id}")
            pension_etf.realize_historical_contributions(db=db, pension_id=pension_id)
            logger.info(f"Successfully realized historical contributions for pension {pension_id}")

        # Update task status to completed
        task.status = "completed"
        db.commit()
        logger.info(f"Successfully completed processing of ETF pension {pension_id}")

    except Exception as exc:
        db.rollback()
        error_msg = str(exc)
        logger.error(f"Failed to process ETF pension {pension_id}: {error_msg}")
        
        # Update task status to failed
        if task:
            task.status = "failed"
            task.error = error_msg
            db.add(task)
            db.commit()
            logger.info(f"Updated task status to failed for pension {pension_id}")
        
        # Retry the task with exponential backoff
        self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
    finally:
        db.close() 