from typing import Dict, Any, Union, List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.pension_etf import (
    PensionETF,
    PensionETFContributionPlanStep,
    PensionETFContributionHistory
)
from app.models.etf import ETF
from app.schemas.pension_etf import (
    PensionETFCreate,
    PensionETFUpdate,
    ContributionHistoryCreate,
    PensionStatusUpdate,
    PensionStatistics
)
from datetime import date, timedelta
from decimal import Decimal
import logging
from app.crud.etf import etf_crud
from app.models.enums import PensionStatus
from fastapi import HTTPException
from sqlalchemy import func

logger = logging.getLogger(__name__)

def needs_value_calculation(pension: PensionETF) -> bool:
    """
    Check if an ETF pension needs its value calculated.
    
    Returns True if:
    - It's an existing investment (implied by having existing_units)
    - Has existing units
    - Has a reference date
    - Current value is 0 (indicating pending calculation)
    """
    return (
        pension.existing_units is not None and
        pension.existing_units > 0 and
        pension.reference_date is not None and
        pension.current_value == 0
    )

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
            for step_data in obj_in.contribution_plan_steps:
                step = PensionETFContributionPlanStep(
                    pension_etf_id=db_obj.id,
                    **step_data.dict()
                )
                db.add(step)

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
                step_data = step.dict() if hasattr(step, 'dict') else step
                db_step = PensionETFContributionPlanStep(
                    **step_data,
                    pension_etf_id=db_obj.id
                )
                db.add(db_step)

        # Update other fields
        return super().update(db=db, db_obj=db_obj, obj_in=update_data)

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

    def update_status(
        self,
        db: Session,
        *,
        db_obj: PensionETF,
        obj_in: PensionStatusUpdate
    ) -> PensionETF:
        """Update the status of a pension ETF."""
        try:
            # Validate status transition
            if obj_in.status == PensionStatus.PAUSED:
                if not obj_in.paused_at:
                    obj_in.paused_at = date.today()
                if db_obj.status == PensionStatus.PAUSED:
                    raise HTTPException(status_code=400, detail="Pension is already paused")
            elif obj_in.status == PensionStatus.ACTIVE:
                if db_obj.status == PensionStatus.ACTIVE:
                    raise HTTPException(status_code=400, detail="Pension is already active")
                if not obj_in.resume_at and not db_obj.resume_at:
                    obj_in.resume_at = date.today()

            # Update status and related fields
            for field, value in obj_in.dict(exclude_unset=True).items():
                setattr(db_obj, field, value)

            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update pension status: {str(e)}")
            raise

    def _should_skip_contribution(
        self,
        db_obj: PensionETF,
        contribution_date: date
    ) -> bool:
        """Check if a contribution should be skipped based on pension status."""
        if db_obj.status == PensionStatus.ACTIVE:
            return False
        
        if db_obj.status == PensionStatus.PAUSED:
            # Skip if contribution date is after pause date
            if db_obj.paused_at and contribution_date >= db_obj.paused_at:
                # Unless there's a resume date and the contribution is after it
                if db_obj.resume_at and contribution_date >= db_obj.resume_at:
                    return False
                return True
        
        return False

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
        realized_dates = set(ch.contribution_date for ch in pension.contribution_history)
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
                    # Skip if already realized or should be skipped due to status
                    if contribution_date in realized_dates or self._should_skip_contribution(pension, contribution_date):
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
                        contribution_date=contribution_date,
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
            else:
                logger.warning(f"No latest price found for ETF {pension.etf_id}")

            db.commit()
            logger.info(f"Successfully realized historical contributions for pension {pension_id}")

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

    def get_statistics(
        self,
        db: Session,
        *,
        pension_id: int
    ) -> PensionStatistics:
        """Calculate statistics for an ETF pension."""
        try:
            # Get the pension with all its relationships
            pension = db.query(PensionETF).get(pension_id)
            if not pension:
                raise HTTPException(status_code=404, detail="ETF Pension not found")

            # Calculate total invested amount from contribution history
            total_invested = db.query(func.sum(PensionETFContributionHistory.amount))\
                .filter(PensionETFContributionHistory.pension_etf_id == pension_id)\
                .scalar() or Decimal('0')

            # Get current value
            current_value = pension.current_value

            # Calculate total return
            total_return = current_value - total_invested

            # Calculate annual return if we have enough history
            annual_return = None
            if pension.contribution_history:
                first_contribution = min(ch.contribution_date for ch in pension.contribution_history)
                days_invested = (date.today() - first_contribution).days
                if days_invested > 0:
                    # Use the time-weighted return formula
                    days_ratio = Decimal(str(365)) / Decimal(str(days_invested))
                    value_ratio = current_value / total_invested
                    annual_return = (value_ratio ** days_ratio - Decimal('1')) * Decimal('100')
                    annual_return = round(annual_return, 2)

            # Get value history
            # For now, we'll use contribution dates as value points
            # In a real implementation, you might want to get actual ETF prices for each date
            value_history = []
            if pension.contribution_history:
                running_units = Decimal('0')
                for ch in sorted(pension.contribution_history, key=lambda x: x.contribution_date):
                    # Get ETF price for this date
                    price = etf_crud.get_price_for_date(db=db, etf_id=pension.etf_id, date=ch.contribution_date)
                    if not price:
                        price = etf_crud.get_next_available_price(db=db, etf_id=pension.etf_id, after_date=ch.contribution_date)
                    
                    if price:
                        # Calculate units bought
                        units = ch.amount / price.price
                        running_units += units
                        value = running_units * price.price
                        value_history.append({
                            "date": ch.contribution_date.isoformat(),
                            "value": str(value)
                        })

            return PensionStatistics(
                total_invested_amount=total_invested,
                current_value=current_value,
                total_return=total_return,
                annual_return=annual_return,
                contribution_history=pension.contribution_history,
                value_history=value_history
            )

        except Exception as e:
            logger.error(f"Failed to calculate pension statistics: {str(e)}")
            raise

    def get_list(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        member_id: int = None
    ) -> List[dict]:
        """
        Get a lightweight list of ETF pensions with ETF names.
        This optimized query avoids loading full ETF details and contribution data.
        """
        from datetime import date
        today = date.today()
        
        # First, get the basic pension information with ETF names
        query = db.query(
            PensionETF.id,
            PensionETF.name,
            PensionETF.member_id,
            PensionETF.current_value,
            PensionETF.total_units,
            PensionETF.etf_id,
            ETF.name.label("etf_name"),
            PensionETF.status,
            PensionETF.paused_at,
            PensionETF.resume_at,
            PensionETF.existing_units,
            PensionETF.reference_date
        ).join(ETF, PensionETF.etf_id == ETF.id)
        
        if member_id is not None:
            query = query.filter(PensionETF.member_id == member_id)
        
        result = query.offset(skip).limit(limit).all()
        
        # Get all pension IDs from the result
        pension_ids = [row.id for row in result]
        
        # If no pensions found, return empty list
        if not pension_ids:
            return []
        
        # Get current contribution steps for all pensions in one query
        current_steps_query = db.query(
            PensionETFContributionPlanStep.pension_etf_id,
            PensionETFContributionPlanStep.amount,
            PensionETFContributionPlanStep.frequency
        ).filter(
            PensionETFContributionPlanStep.pension_etf_id.in_(pension_ids),
            PensionETFContributionPlanStep.start_date <= today,
            (PensionETFContributionPlanStep.end_date >= today) | (PensionETFContributionPlanStep.end_date.is_(None))
        )
        
        # Create a dictionary mapping pension_id to current step
        current_steps = {}
        for step in current_steps_query:
            current_steps[step.pension_etf_id] = {
                "amount": step.amount,
                "frequency": step.frequency
            }
        
        # Convert SQLAlchemy Row objects to dictionaries with current step information
        return [
            {
                "id": row.id,
                "name": row.name,
                "member_id": row.member_id,
                "current_value": row.current_value,
                "total_units": row.total_units,
                "etf_id": row.etf_id,
                "etf_name": row.etf_name,
                "status": row.status,
                "paused_at": row.paused_at,
                "resume_at": row.resume_at,
                "is_existing_investment": row.existing_units is not None and row.existing_units > 0 and row.reference_date is not None,
                "existing_units": row.existing_units,
                "current_step_amount": current_steps.get(row.id, {}).get("amount"),
                "current_step_frequency": current_steps.get(row.id, {}).get("frequency")
            }
            for row in result
        ]

    def create_with_zero_value(self, db: Session, *, obj_in: PensionETFCreate) -> PensionETF:
        """
        Create an ETF pension with zero current value for async calculation.
        This is used when price data is not immediately available.
        """
        try:
            # Start by creating the pension object
            obj_in_data = obj_in.dict(exclude={"contribution_plan_steps", "realize_historical_contributions"})
            db_obj = PensionETF(**obj_in_data)
            
            # Set initial values for async calculation
            if db_obj.existing_units and db_obj.reference_date:
                # Set initial total units
                db_obj.total_units = Decimal(str(db_obj.existing_units))
                # Set current value to 0 for pending calculation
                db_obj.current_value = 0
            
            # Add and flush the pension object to get its ID
            db.add(db_obj)
            db.flush()
            
            # Create contribution plan steps
            for step_data in obj_in.contribution_plan_steps:
                step = PensionETFContributionPlanStep(
                    pension_etf_id=db_obj.id,
                    **step_data.dict()
                )
                db.add(step)
            
            db.commit()
            db.refresh(db_obj)
            logger.info(f"Created ETF pension with ID {db_obj.id} with zero value for async calculation")
            return db_obj
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating ETF pension with zero value: {str(e)}")
            raise

pension_etf = CRUDPensionETF(PensionETF) 