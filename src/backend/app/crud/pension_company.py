from typing import Dict, Any, Union, List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.pension_company import (
    PensionCompany,
    PensionCompanyContributionPlanStep,
    PensionCompanyContributionHistory
)
from app.schemas.pension_company import (
    PensionCompanyCreate,
    PensionCompanyUpdate,
    ContributionHistoryCreate
)
from datetime import date
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

class CRUDPensionCompany(CRUDBase[PensionCompany, PensionCompanyCreate, PensionCompanyUpdate]):
    def create(
        self, db: Session, *, obj_in: PensionCompanyCreate
    ) -> PensionCompany:
        try:
            # Start by creating the pension object
            obj_in_data = obj_in.dict(exclude={"contribution_plan_steps"})
            db_obj = PensionCompany(**obj_in_data)
            
            # Add and flush the pension object to get its ID
            db.add(db_obj)
            db.flush()

            # Create contribution plan steps
            for step in obj_in.contribution_plan_steps:
                db_step = PensionCompanyContributionPlanStep(
                    **step.dict(),
                    pension_company_id=db_obj.id
                )
                db.add(db_step)

            # Commit all changes
            db.commit()
            db.refresh(db_obj)
            return db_obj
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create company pension: {str(e)}")
            raise

    def update(
        self,
        db: Session,
        *,
        db_obj: PensionCompany,
        obj_in: Union[PensionCompanyUpdate, Dict[str, Any]]
    ) -> PensionCompany:
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
                db_step = PensionCompanyContributionPlanStep(
                    **step_data,
                    pension_company_id=db_obj.id
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
    ) -> PensionCompanyContributionHistory:
        # Get the pension
        pension = db.query(PensionCompany).get(pension_id)
        if not pension:
            raise ValueError("Pension not found")

        # Create the contribution history
        db_obj = PensionCompanyContributionHistory(
            **obj_in.dict(),
            pension_company_id=pension_id
        )
        db.add(db_obj)

        # Update pension current value
        pension.current_value += (obj_in.employee_amount + obj_in.employer_amount)

        db.commit()
        db.refresh(db_obj)
        return db_obj

pension_company = CRUDPensionCompany(PensionCompany) 