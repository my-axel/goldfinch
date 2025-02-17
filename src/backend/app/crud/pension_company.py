from typing import Dict, Any, Union
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.pension_company import (
    PensionCompany,
    PensionCompanyContributionPlanStep,
    PensionCompanyContributionPlan,
    PensionCompanyContributionHistory
)
from app.schemas.pension_company import (
    PensionCompanyCreate,
    PensionCompanyUpdate,
    ContributionPlanCreate,
    ContributionHistoryCreate
)

class CRUDPensionCompany(CRUDBase[PensionCompany, PensionCompanyCreate, PensionCompanyUpdate]):
    def create(
        self, db: Session, *, obj_in: PensionCompanyCreate, member_id: int
    ) -> PensionCompany:
        # Create the pension
        obj_in_data = obj_in.dict(exclude={"contribution_plan_steps"})
        db_obj = PensionCompany(**obj_in_data, member_id=member_id)
        db.add(db_obj)
        db.flush()  # Get the ID without committing

        # Create contribution plan steps
        for step in obj_in.contribution_plan_steps:
            db_step = PensionCompanyContributionPlanStep(
                **step.dict(),
                pension_company_id=db_obj.id
            )
            db.add(db_step)

        db.commit()
        db.refresh(db_obj)
        return db_obj

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
                db_step = PensionCompanyContributionPlanStep(
                    **step.dict(),
                    pension_company_id=db_obj.id
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
    ) -> PensionCompanyContributionPlan:
        # Get the pension to calculate employer contribution
        pension = db.query(PensionCompany).get(pension_id)
        
        # Calculate employer contribution based on matching percentage and max contribution
        employer_amount = 0
        if pension.matching_percentage:
            employer_amount = min(
                obj_in.employee_amount * (pension.matching_percentage / 100),
                pension.max_employer_contribution or float('inf')
            )

        # Create the contribution plan
        db_obj = PensionCompanyContributionPlan(
            **obj_in.dict(),
            pension_company_id=pension_id,
            employer_amount=employer_amount
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
    ) -> PensionCompanyContributionHistory:
        # Create the contribution history
        db_obj = PensionCompanyContributionHistory(
            **obj_in.dict(),
            pension_company_id=pension_id
        )
        db.add(db_obj)

        # Update pension current value
        pension = db.query(PensionCompany).get(pension_id)
        pension.current_value += (obj_in.employee_amount + obj_in.employer_amount)

        db.commit()
        db.refresh(db_obj)
        return db_obj

pension_company = CRUDPensionCompany(PensionCompany) 