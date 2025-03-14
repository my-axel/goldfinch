from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.crud.pension_etf import pension_etf, needs_value_calculation
from app.crud.etf import etf_crud
from app.models.task import TaskStatus
from app.models.pension_etf import PensionETF
import logging

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=20)
def calculate_etf_pension_value(self, pension_id: int):
    """
    Calculate the current value of an ETF pension based on existing units and reference date.
    Will retry if price data is not available yet.
    """
    logger.info(f"Calculating value for ETF pension {pension_id}")
    db = SessionLocal()
    
    try:
        # Get the pension record
        pension = db.query(PensionETF).filter(PensionETF.id == pension_id).first()
        
        if not pension:
            logger.error(f"ETF pension {pension_id} not found")
            return
            
        # Skip if calculation not needed
        if not needs_value_calculation(pension):
            logger.info(f"ETF pension {pension_id} does not need value calculation")
            return
            
        # Attempt to fetch price data and calculate value
        price = etf_crud.get_price_for_date(db=db, etf_id=pension.etf_id, date=pension.reference_date)
        
        if not price:
            retry_count = self.request.retries
            
            # Determine retry delay based on retry count
            if retry_count < 5:
                delay = 20  # 20 seconds
            elif retry_count < 15:
                delay = 60  # 1 minute
            else:
                delay = 300  # 5 minutes
                
            logger.info(f"No price data available for ETF {pension.etf_id} on {pension.reference_date}. "
                        f"Retry {retry_count+1}/20 scheduled in {delay} seconds")
            
            # Schedule retry
            raise self.retry(exc=ValueError(f"No price data available for ETF {pension.etf_id}"), countdown=delay)
        
        # Calculate current value
        current_value = pension.existing_units * price.price
        
        # Update pension record
        pension.current_value = current_value
        db.commit()
        
        logger.info(f"Successfully calculated value for ETF pension {pension_id}: {current_value}")
        
    except Exception as e:
        logger.error(f"Error calculating ETF pension value: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

@celery_app.task
def retry_pending_calculations():
    """Retry calculations for ETF pensions with pending values"""
    logger.info("Checking for ETF pensions with pending value calculations")
    db = SessionLocal()
    
    try:
        # Find all ETF pensions
        pending_pensions = db.query(PensionETF).all()
        pending_pensions = [p for p in pending_pensions if needs_value_calculation(p)]
        
        logger.info(f"Found {len(pending_pensions)} ETF pensions with pending calculations")
        
        for pension in pending_pensions:
            # Schedule calculation task
            calculate_etf_pension_value.delay(pension.id)
            
    except Exception as e:
        logger.error(f"Error retrying pending ETF pension calculations: {str(e)}")
    finally:
        db.close()

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