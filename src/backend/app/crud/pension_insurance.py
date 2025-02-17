from typing import Dict, Any, Union
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.pension_insurance import (
    PensionInsurance,
    PensionInsuranceContributionPlanStep,
    PensionInsuranceContributionPlan,
    PensionInsuranceContributionHistory
)
from app.schemas.pension_insurance import (
    PensionInsuranceCreate,
    PensionInsuranceUpdate,
    ContributionPlanCreate,
    ContributionHistoryCreate
)

class CRUDPensionInsurance(CRUDBase[PensionInsurance, PensionInsuranceCreate, PensionInsuranceUpdate]):
    def create(
        self, db: Session, *, obj_in: PensionInsuranceCreate, member_id: int
    ) -> PensionInsurance:
        # Create the pension
        obj_in_data = obj_in.dict(exclude={"contribution_plan_steps"})
        db_obj = PensionInsurance(**obj_in_data, member_id=member_id)
        db.add(db_obj)
        db.flush()  # Get the ID without committing

        # Create contribution plan steps
        for step in obj_in.contribution_plan_steps:
            db_step = PensionInsuranceContributionPlanStep(
                **step.dict(),
                pension_insurance_id=db_obj.id
            )
            db.add(db_step)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: PensionInsurance,
        obj_in: Union[PensionInsuranceUpdate, Dict[str, Any]]
    ) -> PensionInsurance:
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
                db_step = PensionInsuranceContributionPlanStep(
                    **step.dict(),
                    pension_insurance_id=db_obj.id
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
    ) -> PensionInsuranceContributionPlan:
        # Create the contribution plan
        db_obj = PensionInsuranceContributionPlan(
            **obj_in.dict(),
            pension_insurance_id=pension_id
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
    ) -> PensionInsuranceContributionHistory:
        # Create the contribution history
        db_obj = PensionInsuranceContributionHistory(
            **obj_in.dict(),
            pension_insurance_id=pension_id
        )
        db.add(db_obj)

        # Update pension current value
        pension = db.query(PensionInsurance).get(pension_id)
        pension.current_value += obj_in.amount

        db.commit()
        db.refresh(db_obj)
        return db_obj

pension_insurance = CRUDPensionInsurance(PensionInsurance) 