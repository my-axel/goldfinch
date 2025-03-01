from typing import Dict, Any, Union, List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.pension_company import (
    PensionCompany,
    PensionCompanyContributionPlanStep,
    PensionCompanyContributionHistory,
    PensionCompanyProjection
)
from app.schemas.pension_company import (
    PensionCompanyCreate,
    PensionCompanyUpdate,
    ContributionHistoryCreate,
    ProjectionCreate,
    PensionStatusUpdate
)
from app.models.enums import PensionStatus
from datetime import date
from decimal import Decimal
import logging
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class CRUDPensionCompany(CRUDBase[PensionCompany, PensionCompanyCreate, PensionCompanyUpdate]):
    def create(
        self, db: Session, *, obj_in: PensionCompanyCreate
    ) -> PensionCompany:
        try:
            # Start by creating the pension object
            obj_in_data = obj_in.dict(exclude={"contribution_plan_steps", "projections"})
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
                
            # Create projections if provided
            if obj_in.projections:
                for projection in obj_in.projections:
                    db_projection = PensionCompanyProjection(
                        **projection.dict(),
                        pension_company_id=db_obj.id
                    )
                    db.add(db_projection)

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
                
        # Handle projections separately
        if "projections" in update_data:
            # Remove old projections
            for projection in db_obj.projections:
                db.delete(projection)
            
            # Add new projections
            projections = update_data.pop("projections")
            if projections:
                for projection in projections:
                    projection_data = projection.dict() if hasattr(projection, 'dict') else projection
                    db_projection = PensionCompanyProjection(
                        **projection_data,
                        pension_company_id=db_obj.id
                    )
                    db.add(db_projection)

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
        pension.current_value += obj_in.amount

        db.commit()
        db.refresh(db_obj)
        return db_obj
        
    def create_projection(
        self,
        db: Session,
        *,
        pension_id: int,
        obj_in: ProjectionCreate
    ) -> PensionCompanyProjection:
        # Get the pension
        pension = db.query(PensionCompany).get(pension_id)
        if not pension:
            raise ValueError("Pension not found")

        # Create the projection
        db_obj = PensionCompanyProjection(
            **obj_in.dict(),
            pension_company_id=pension_id
        )
        db.add(db_obj)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_status(
        self,
        db: Session,
        *,
        db_obj: PensionCompany,
        obj_in: PensionStatusUpdate
    ) -> PensionCompany:
        """Update the status of a company pension."""
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

pension_company = CRUDPensionCompany(PensionCompany) 