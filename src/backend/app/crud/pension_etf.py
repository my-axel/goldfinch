from typing import Dict, Any, Union, List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.pension_etf import (
    PensionETF,
    PensionETFContributionPlanStep,
    PensionETFContributionPlan,
    PensionETFContributionHistory
)
from app.schemas.pension_etf import (
    PensionETFCreate,
    PensionETFUpdate,
    ContributionPlanCreate,
    ContributionHistoryCreate
)
from datetime import date
from decimal import Decimal
import logging
from app.crud.etf import etf_crud

logger = logging.getLogger(__name__)

class CRUDPensionETF(CRUDBase[PensionETF, PensionETFCreate, PensionETFUpdate]):
    def create(
        self, db: Session, *, obj_in: PensionETFCreate
    ) -> PensionETF:
        try:
            # Start by creating the pension object
            obj_in_data = obj_in.dict(exclude={"contribution_plan_steps", "realize_historical_contributions"})
            db_obj = PensionETF(**obj_in_data)
            
            # Handle existing investment initialization
            if db_obj.existing_units and db_obj.reference_date:
                # Set initial total units
                db_obj.total_units = Decimal(str(db_obj.existing_units))
                
                # Get ETF price at reference date
                price = etf_crud.get_price_for_date(db=db, etf_id=db_obj.etf_id, date=db_obj.reference_date)
                if not price:
                    # Try to get next available price
                    price = etf_crud.get_next_available_price(db=db, etf_id=db_obj.etf_id, after_date=db_obj.reference_date)
                
                if price:
                    # Calculate initial current value
                    db_obj.current_value = db_obj.total_units * price.price
                else:
                    # Use latest price as fallback
                    latest_price = etf_crud.get_latest_price(db=db, etf_id=db_obj.etf_id)
                    if not latest_price:
                        logger.error(f"No price data available for ETF {db_obj.etf_id}")
                        raise ValueError(f"No price data available for ETF {db_obj.etf_id}")
                    db_obj.current_value = db_obj.total_units * latest_price.price
                    price = latest_price

            # Add and flush the pension object to get its ID
            db.add(db_obj)
            db.flush()

            # Now that we have the pension ID, create the contribution history for existing investment
            if db_obj.existing_units and db_obj.reference_date and price:
                contribution = PensionETFContributionHistory(
                    pension_etf_id=db_obj.id,  # Now we have the ID
                    date=db_obj.reference_date,
                    amount=db_obj.current_value,
                    is_manual=True,
                    note=f"Initial investment (price from {price.date})"
                )
                db.add(contribution)

            # Create contribution plan steps
            for step in obj_in.contribution_plan_steps:
                db_step = PensionETFContributionPlanStep(
                    **step.dict(),
                    pension_etf_id=db_obj.id
                )
                db.add(db_step)

            # Commit all changes
            db.commit()
            db.refresh(db_obj)
            return db_obj
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create ETF pension: {str(e)}")
            raise

    def update(
        self,
        db: Session,
        *,
        db_obj: PensionETF,
        obj_in: Union[PensionETFUpdate, Dict[str, Any]]
    ) -> PensionETF:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)

        # Handle contribution plan steps separately
        if "contribution_plan_steps" in update_data:
            # Remove old steps
            for step in db_obj.contribution_plan_steps:
                db.delete(step)
            
            # Add new steps
            for step in update_data.pop("contribution_plan_steps"):
                db_step = PensionETFContributionPlanStep(
                    **step.dict(),
                    pension_etf_id=db_obj.id
                )
                db.add(db_step)

        # Update other fields
        return super().update(db=db, db_obj=db_obj, obj_in=update_data)

    def create_contribution_plan(
        self,
        db: Session,
        *,
        pension_id: int,
        obj_in: ContributionPlanCreate
    ) -> PensionETFContributionPlan:
        # Create the contribution plan
        db_obj = PensionETFContributionPlan(
            **obj_in.dict(),
            pension_etf_id=pension_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def create_contribution_history(
        self,
        db: Session,
        *,
        pension_id: int,
        obj_in: ContributionHistoryCreate
    ) -> PensionETFContributionHistory:
        # Get the pension and its ETF
        pension = db.query(PensionETF).get(pension_id)
        if not pension:
            raise ValueError("Pension not found")

        # Get the latest ETF price
        latest_price = etf_crud.get_latest_price(db=db, etf_id=pension.etf_id)
        if not latest_price:
            raise ValueError(f"No price found for ETF {pension.etf_id}")

        # Calculate units bought
        units = obj_in.amount / latest_price.price

        # Create the contribution history
        db_obj = PensionETFContributionHistory(
            **obj_in.dict(),
            pension_etf_id=pension_id
        )
        db.add(db_obj)

        # Update pension total units and current value
        pension.total_units += units
        pension.current_value = pension.total_units * latest_price.price

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def realize_historical_contributions(
        self,
        db: Session,
        *,
        pension_id: int
    ) -> None:
        """
        Realize historical contributions for an ETF pension.
        This will:
        1. Calculate contribution dates based on plan steps
        2. Get ETF prices for each contribution date
        3. Create contribution history entries and update total units
        """
        pension = self.get(db=db, id=pension_id)
        if not pension:
            raise ValueError(f"ETF Pension {pension_id} not found")

        today = date.today()
        realized_dates = set(ch.date for ch in pension.contribution_history)
        logger.info(f"Realizing historical contributions for pension {pension_id}")

        try:
            # Reset totals before processing
            pension.total_units = Decimal('0')
            pension.current_value = Decimal('0')

            # Process contribution plan steps
            for step in pension.contribution_plan_steps:
                # Skip future contributions
                if step.start_date > today:
                    continue

                # Calculate contribution dates
                dates = self._calculate_contribution_dates(
                    start_date=step.start_date,
                    end_date=min(step.end_date or today, today),
                    frequency=step.frequency
                )

                # Create contribution history for each date
                for contribution_date in dates:
                    # Skip if already realized
                    if contribution_date in realized_dates:
                        continue

                    # Get ETF price for the date or next available
                    price = etf_crud.get_price_for_date(
                        db=db,
                        etf_id=pension.etf_id,
                        date=contribution_date
                    )
                    
                    if not price:
                        # Try to get next available price (e.g., next trading day)
                        price = etf_crud.get_next_available_price(
                            db=db,
                            etf_id=pension.etf_id,
                            after_date=contribution_date
                        )
                        
                        if not price:
                            logger.warning(f"No price found for ETF {pension.etf_id} on or after {contribution_date}")
                            continue

                    # Calculate units based on contribution amount and price
                    units = Decimal(str(step.amount)) / Decimal(str(price.price))
                    
                    # Create contribution history entry
                    history = PensionETFContributionHistory(
                        pension_etf_id=pension_id,
                        date=contribution_date,
                        amount=step.amount,
                        is_manual=False,
                        note=f"Using ETF price from {price.date}" if price.date != contribution_date else None
                    )
                    db.add(history)

                    # Update pension total units
                    pension.total_units += units

            # After all contributions are processed, get the latest price to calculate current value
            latest_price = etf_crud.get_latest_price(db=db, etf_id=pension.etf_id)
            if latest_price:
                pension.current_value = pension.total_units * latest_price.price
                logger.info(f"Completed with {pension.total_units:.4f} units, current value {pension.current_value:.2f} EUR")
            else:
                logger.warning(f"No latest price found for ETF {pension.etf_id}, cannot calculate current value")

            db.commit()

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to realize historical contributions: {str(e)}")
            raise

    def _calculate_contribution_dates(
        self,
        *,
        start_date: date,
        end_date: date,
        frequency: str
    ) -> List[date]:
        """Calculate contribution dates based on frequency."""
        dates = []
        current_date = start_date

        while current_date <= end_date:
            dates.append(current_date)
            
            if frequency == "MONTHLY":
                if current_date.month == 12:
                    current_date = date(current_date.year + 1, 1, current_date.day)
                else:
                    current_date = date(current_date.year, current_date.month + 1, current_date.day)
            elif frequency == "QUARTERLY":
                if current_date.month >= 10:
                    current_date = date(current_date.year + 1, (current_date.month + 3) % 12 or 12, current_date.day)
                else:
                    current_date = date(current_date.year, current_date.month + 3, current_date.day)
            elif frequency == "SEMI_ANNUALLY":
                if current_date.month > 6:
                    current_date = date(current_date.year + 1, (current_date.month + 6) % 12 or 12, current_date.day)
                else:
                    current_date = date(current_date.year, current_date.month + 6, current_date.day)
            elif frequency == "ANNUALLY":
                current_date = date(current_date.year + 1, current_date.month, current_date.day)
            elif frequency == "ONE_TIME":
                break
            else:
                logger.warning(f"Unknown frequency: {frequency}")
                break

        return dates

pension_etf = CRUDPensionETF(PensionETF) 