from typing import Dict, Any, Union
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

class CRUDPensionETF(CRUDBase[PensionETF, PensionETFCreate, PensionETFUpdate]):
    def create(
        self, db: Session, *, obj_in: PensionETFCreate, member_id: int
    ) -> PensionETF:
        # Create the pension
        obj_in_data = obj_in.dict(exclude={"contribution_plan_steps"})
        db_obj = PensionETF(**obj_in_data, member_id=member_id)
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

pension_etf = CRUDPensionETF(PensionETF) 