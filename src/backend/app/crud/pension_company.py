from typing import Dict, Any, Union, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.crud.base import CRUDBase
from app.models.pension_company import (
    PensionCompany,
    PensionCompanyContributionPlanStep,
    PensionCompanyContributionHistory,
    PensionCompanyStatement,
    PensionCompanyRetirementProjection
)
from app.schemas.pension_company import (
    PensionCompanyCreate,
    PensionCompanyUpdate,
    ContributionHistoryCreate,
    PensionStatusUpdate,
    PensionCompanyStatementCreate,
    PensionCompanyStatementUpdate
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
        pension.current_value += obj_in.amount

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

    def create_statement(
        self,
        db: Session,
        *,
        pension_id: int,
        obj_in: PensionCompanyStatementCreate
    ) -> PensionCompanyStatement:
        """Create a new statement for a company pension."""
        try:
            # Create the statement object
            obj_in_data = obj_in.dict(exclude={"projections"})
            db_obj = PensionCompanyStatement(**obj_in_data, pension_id=pension_id)
            
            # Add and flush the statement object to get its ID
            db.add(db_obj)
            db.flush()

            # Create projections if provided
            if obj_in.projections:
                for projection in obj_in.projections:
                    db_projection = PensionCompanyRetirementProjection(
                        **projection.dict(),
                        statement_id=db_obj.id
                    )
                    db.add(db_projection)

            # Commit all changes
            db.commit()
            db.refresh(db_obj)
            return db_obj
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create company pension statement: {str(e)}")
            raise

    def update_statement(
        self,
        db: Session,
        *,
        db_obj: PensionCompanyStatement,
        obj_in: Union[PensionCompanyStatementUpdate, Dict[str, Any]]
    ) -> PensionCompanyStatement:
        """Update an existing pension company statement."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)

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
                    db_projection = PensionCompanyRetirementProjection(
                        **projection_data,
                        statement_id=db_obj.id
                    )
                    db.add(db_projection)

        # Update other fields
        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_statement(
        self,
        db: Session,
        *,
        statement_id: int
    ) -> Optional[PensionCompanyStatement]:
        """Get a statement by ID."""
        return db.query(PensionCompanyStatement).filter(
            PensionCompanyStatement.id == statement_id
        ).first()

    def get_statements(
        self,
        db: Session,
        *,
        pension_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[PensionCompanyStatement]:
        """Get all statements for a pension company with pagination."""
        return db.query(PensionCompanyStatement).filter(
            PensionCompanyStatement.pension_id == pension_id
        ).order_by(desc(PensionCompanyStatement.statement_date)).offset(skip).limit(limit).all()

    def get_latest_statement(
        self,
        db: Session,
        *,
        pension_id: int
    ) -> Optional[PensionCompanyStatement]:
        """Get the latest statement for a pension company."""
        return db.query(PensionCompanyStatement).filter(
            PensionCompanyStatement.pension_id == pension_id
        ).order_by(desc(PensionCompanyStatement.statement_date)).first()

pension_company = CRUDPensionCompany(PensionCompany) 