from typing import Dict, Any, Union, List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.pension_etf import (
    PensionETF,
    PensionETFContributionPlanStep,
    PensionETFContributionPlan,
    PensionETFContributionHistory,
    PensionETFAllocationPlan,
    PensionETFAllocationHistory
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
        # Create the pension
        obj_in_data = obj_in.dict(exclude={"contribution_plan_steps", "realize_historical_contributions"})
        db_obj = PensionETF(**obj_in_data)
        db.add(db_obj)
        db.flush()  # Get the ID without committing

        # Create contribution plan steps
        for step in obj_in.contribution_plan_steps:
            db_step = PensionETFContributionPlanStep(
                **step.dict(),
                pension_etf_id=db_obj.id
            )
            db.add(db_step)

        db.commit()
        db.refresh(db_obj)
        return db_obj

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
        obj_in_data = obj_in.dict(exclude={"allocations"})
        db_obj = PensionETFContributionPlan(
            **obj_in_data,
            pension_etf_id=pension_id
        )
        db.add(db_obj)
        db.flush()  # Get the ID without committing

        # Create allocations
        total_percentage = 0
        for allocation in obj_in.allocations:
            total_percentage += allocation.percentage
            db_allocation = PensionETFAllocationPlan(
                **allocation.dict(),
                pension_etf_contribution_plan_id=db_obj.id
            )
            db.add(db_allocation)

        if total_percentage != 100:
            db.rollback()
            raise ValueError("Total allocation percentage must be 100%")

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
        # Create the contribution history
        obj_in_data = obj_in.dict(exclude={"allocations"})
        db_obj = PensionETFContributionHistory(
            **obj_in_data,
            pension_etf_id=pension_id
        )
        db.add(db_obj)
        db.flush()  # Get the ID without committing

        # Create allocations
        total_percentage = 0
        total_amount = 0
        for allocation in obj_in.allocations:
            total_percentage += allocation.percentage
            total_amount += allocation.amount
            db_allocation = PensionETFAllocationHistory(
                **allocation.dict(),
                pension_etf_contribution_history_id=db_obj.id
            )
            db.add(db_allocation)

        if total_percentage != 100:
            db.rollback()
            raise ValueError("Total allocation percentage must be 100%")

        if total_amount != obj_in.amount:
            db.rollback()
            raise ValueError("Total allocation amount must match contribution amount")

        # Update pension total units and current value
        pension = db.query(PensionETF).get(pension_id)
        for allocation in obj_in.allocations:
            pension.total_units += allocation.units
            pension.current_value += allocation.amount

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

        try:
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
                            logger.warning(
                                f"No price found for ETF {pension.etf_id} on or after {contribution_date}. "
                                "Skipping contribution realization."
                            )
                            continue
                        else:
                            logger.info(
                                f"Using next available price from {price.date} for contribution on {contribution_date}"
                            )

                    # Calculate units based on contribution amount and price
                    units = Decimal(str(step.amount)) / Decimal(str(price.price))
                    
                    # Create contribution history entry
                    history = PensionETFContributionHistory(
                        pension_etf_id=pension_id,
                        date=contribution_date,
                        amount=step.amount,
                        is_manual=False,
                        notes=f"Using ETF price from {price.date}" if price.date != contribution_date else None
                    )
                    db.add(history)
                    db.flush()  # Get the history ID

                    # Create allocation history entry
                    allocation = PensionETFAllocationHistory(
                        pension_etf_contribution_history_id=history.id,
                        etf_id=pension.etf_id,
                        amount=step.amount,
                        units=units,
                        price_per_unit=price.price,
                        percentage=Decimal('100.0')  # Single ETF gets 100%
                    )
                    db.add(allocation)

                    # Update pension totals
                    pension.total_units += units
                    pension.current_value = pension.total_units * price.price

            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Error realizing historical contributions: {str(e)}")
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
            
            if frequency == "monthly":
                if current_date.month == 12:
                    current_date = date(current_date.year + 1, 1, current_date.day)
                else:
                    current_date = date(current_date.year, current_date.month + 1, current_date.day)
            elif frequency == "quarterly":
                if current_date.month >= 10:
                    current_date = date(current_date.year + 1, (current_date.month + 3) % 12 or 12, current_date.day)
                else:
                    current_date = date(current_date.year, current_date.month + 3, current_date.day)
            elif frequency == "semi_annually":
                if current_date.month > 6:
                    current_date = date(current_date.year + 1, (current_date.month + 6) % 12 or 12, current_date.day)
                else:
                    current_date = date(current_date.year, current_date.month + 6, current_date.day)
            elif frequency == "annually":
                current_date = date(current_date.year + 1, current_date.month, current_date.day)
            elif frequency == "one_time":
                break

        return dates

pension_etf = CRUDPensionETF(PensionETF) 