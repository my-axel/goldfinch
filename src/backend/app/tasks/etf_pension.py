from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.crud.pension_etf import pension_etf, needs_value_calculation
from app.crud.etf import etf_crud
from app.models.task import TaskStatus
from app.models.pension_etf import PensionETF, PensionETFContributionHistory
from app.models.etf import ETFPrice
from celery.exceptions import Retry
import logging

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=20)
def calculate_etf_pension_value(self, pension_id: int):
    """
    Unified task: ensures ETF price data is available, realizes historical
    contributions if requested, then calculates the pension's current value.

    Entry point for all scenarios: creation, startup, periodic retry.
    Decides automatically whether a full fetch or an incremental update is needed.
    """
    logger.info(f"Processing ETF pension {pension_id}")
    db = SessionLocal()

    try:
        pension = db.query(PensionETF).filter(PensionETF.id == pension_id).first()
        if not pension:
            logger.error(f"ETF pension {pension_id} not found")
            return

        # Find the associated task status for metadata and progress tracking
        task_record = db.query(TaskStatus).filter(
            TaskStatus.task_type == "etf_pension_processing",
            TaskStatus.resource_id == pension_id,
            TaskStatus.status.in_(["pending", "processing"])
        ).order_by(TaskStatus.created_at.desc()).first()

        # Step 1: If the pension has an existing investment, ensure a price is available
        if needs_value_calculation(pension):
            price = etf_crud.get_price_for_date(
                db=db, etf_id=pension.etf_id, date=pension.reference_date
            )

            if not price:
                retry_count = self.request.retries
                delay = 20 if retry_count < 5 else (60 if retry_count < 15 else 300)

                logger.info(
                    f"No price for ETF {pension.etf_id} on {pension.reference_date}. "
                    f"Retry {retry_count + 1}/20 in {delay}s"
                )

                # Every 5 retries trigger a fresh price fetch so we never get stuck
                # if the original fetch task failed.
                if retry_count % 5 == 0:
                    any_price = db.query(ETFPrice).filter(
                        ETFPrice.etf_id == pension.etf_id
                    ).first()
                    if any_price:
                        from app.tasks.etf import update_etf_latest_prices
                        logger.info(f"Triggering incremental price update for ETF {pension.etf_id}")
                        update_etf_latest_prices.delay(pension.etf_id)
                    else:
                        from app.tasks.etf import fetch_etf_data
                        logger.info(f"No price history found — triggering full data fetch for ETF {pension.etf_id}")
                        fetch_etf_data.delay(pension.etf_id)

                raise self.retry(
                    exc=ValueError(f"No price data for ETF {pension.etf_id} on {pension.reference_date}"),
                    countdown=delay
                )

            # Price available: calculate current value
            pension.current_value = pension.existing_units * price.price
            logger.info(f"Calculated value for pension {pension_id}: {pension.current_value}")

            # Create the initial contribution history entry if it doesn't exist yet
            has_initial_entry = db.query(PensionETFContributionHistory).filter(
                PensionETFContributionHistory.pension_etf_id == pension_id,
                PensionETFContributionHistory.is_manual == True  # noqa: E712
            ).first()
            if not has_initial_entry:
                db.add(PensionETFContributionHistory(
                    pension_etf_id=pension_id,
                    contribution_date=pension.reference_date,
                    amount=pension.current_value,
                    is_manual=True,
                    note=f"Initial investment (price from {price.date})"
                ))

        # Step 2: Realize historical contributions if the task requested it
        if task_record:
            task_record.status = "processing"
            db.commit()

            should_realize = (
                task_record.task_metadata
                and task_record.task_metadata.get("realize_historical_contributions")
            )
            if should_realize:
                logger.info(f"Realizing historical contributions for pension {pension_id}")
                pension_etf.realize_historical_contributions(db=db, pension_id=pension_id)
                logger.info(f"Historical contributions realized for pension {pension_id}")

        # Step 3: Mark task as complete
        if task_record:
            task_record.status = "completed"
        db.commit()
        logger.info(f"Successfully processed ETF pension {pension_id}")

    except Exception as e:
        db.rollback()
        if not isinstance(e, Retry):
            logger.error(f"Error processing ETF pension {pension_id}: {str(e)}")
        raise
    finally:
        db.close()


@celery_app.task
def retry_pending_calculations():
    """Retry calculations for ETF pensions with pending values."""
    logger.info("Checking for ETF pensions with pending value calculations")
    db = SessionLocal()

    try:
        pending = [p for p in db.query(PensionETF).all() if needs_value_calculation(p)]
        logger.info(f"Found {len(pending)} ETF pensions with pending calculations")
        for p in pending:
            calculate_etf_pension_value.delay(p.id)
    except Exception as e:
        logger.error(f"Error retrying pending ETF pension calculations: {str(e)}")
    finally:
        db.close()


@celery_app.task
def add_all_due_contributions() -> None:
    """
    Daily task: incrementally adds newly due contribution entries for all active pensions.

    Runs after ETF prices are updated (20:00 UTC) so that prices are available
    for contribution dates. Uses add_due_contributions which is safe for repeated
    execution — it never resets total_units, preserving manual one-time investments.
    """
    logger.info("Starting daily contribution realization")
    db = SessionLocal()
    try:
        pensions = (
            db.query(PensionETF)
            .join(PensionETF.contribution_plan_steps)
            .distinct()
            .all()
        )
        logger.info(f"Checking {len(pensions)} pensions with contribution plans")
        total_new = 0
        for p in pensions:
            try:
                total_new += pension_etf.add_due_contributions(db=db, pension_id=p.id)
            except Exception as e:
                logger.error(f"Failed to add contributions for pension {p.id}: {str(e)}")
        logger.info(f"Daily contribution realization done — {total_new} new entries added")
    except Exception as e:
        logger.error(f"Failed to run daily contribution realization: {str(e)}")
    finally:
        db.close()
