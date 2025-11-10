from datetime import date
from typing import Dict, List, Optional, Union, Any
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, and_, or_

from app.crud.base import CRUDBase
from app.models.pension_savings import PensionSavings, PensionSavingsStatement, PensionSavingsContributionPlanStep
from app.schemas.pension_savings import (
    PensionSavingsCreate,
    PensionSavingsUpdate,
    PensionSavingsStatementCreate,
    PensionSavingsStatementUpdate,
    ContributionPlanStepCreate
)
from app.models.enums import PensionStatus
import logging

logger = logging.getLogger(__name__)

class CRUDPensionSavings(CRUDBase[PensionSavings, PensionSavingsCreate, PensionSavingsUpdate]):
    def create(self, db: Session, *, obj_in: PensionSavingsCreate) -> PensionSavings:
        """Create a new savings pension with contribution plan steps."""
        # Extract the contribution plan steps to create separately
        contribution_steps = obj_in.contribution_plan_steps
        obj_in_data = obj_in.model_dump(exclude={"contribution_plan_steps"})
        
        # Create the pension
        db_obj = PensionSavings(**obj_in_data)
        db.add(db_obj)
        db.flush()  # Flush to get the ID
        
        # Create contribution plan steps
        for step_data in contribution_steps:
            step = PensionSavingsContributionPlanStep(
                pension_savings_id=db_obj.id,
                **step_data.model_dump()
            )
            db.add(step)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self, 
        db: Session, 
        *, 
        db_obj: PensionSavings, 
        obj_in: Union[PensionSavingsUpdate, Dict[str, Any]]
    ) -> PensionSavings:
        """Update a savings pension."""
        # Convert to dict if it's a schema object
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        
        # Handle contribution plan steps separately
        contribution_steps = update_data.pop("contribution_plan_steps", None)
        
        # Update the pension object
        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])
        
        # Update contribution plan steps if provided
        if contribution_steps is not None:
            # Delete existing steps - we need to clear the relationship before deleting
            db_obj.contribution_plan_steps = []
            db.flush()
            
            # Now delete any remaining steps from the database
            db.query(PensionSavingsContributionPlanStep).filter(
                PensionSavingsContributionPlanStep.pension_savings_id == db_obj.id
            ).delete()
            db.flush()
            
            # Create new steps
            for step_data in contribution_steps:
                if isinstance(step_data, dict):
                    step = PensionSavingsContributionPlanStep(
                        pension_savings_id=db_obj.id,
                        **step_data
                    )
                else:
                    step = PensionSavingsContributionPlanStep(
                        pension_savings_id=db_obj.id,
                        **step_data.model_dump()
                    )
                db.add(step)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get(self, db: Session, id: int) -> Optional[PensionSavings]:
        """Get a savings pension by ID, including its statements and contribution steps."""
        return db.query(PensionSavings).options(
            joinedload(PensionSavings.statements),
            joinedload(PensionSavings.contribution_plan_steps)
        ).filter(PensionSavings.id == id).first()
    
    def get_by_member(self, db: Session, member_id: int) -> List[PensionSavings]:
        """Get all savings pensions for a specific member."""
        return db.query(PensionSavings).filter(
            PensionSavings.member_id == member_id
        ).all()
    
    def add_statement(
        self, 
        db: Session, 
        *, 
        pension_id: int, 
        statement_in: PensionSavingsStatementCreate
    ) -> PensionSavingsStatement:
        """Add a statement to a savings pension."""
        # Check if pension exists
        pension = db.query(PensionSavings).filter(PensionSavings.id == pension_id).first()
        if not pension:
            raise ValueError(f"Pension with ID {pension_id} not found")
        
        # Create statement
        statement = PensionSavingsStatement(
            pension_id=pension_id,
            **statement_in.model_dump()
        )
        db.add(statement)
        db.commit()
        
        # Explicitly expire the pension object to ensure relationships are refreshed
        db.expire(pension)
        
        # Now refresh both objects
        db.refresh(statement)
        
        return statement
    
    def get_latest_statement(
        self, 
        db: Session, 
        *, 
        pension_id: int
    ) -> Optional[PensionSavingsStatement]:
        """Get the latest statement for a savings pension."""
        return db.query(PensionSavingsStatement).filter(
            PensionSavingsStatement.pension_id == pension_id
        ).order_by(desc(PensionSavingsStatement.statement_date)).first()
    
    def get_current_contribution_step(
        self, 
        db: Session, 
        *, 
        pension_id: int, 
        reference_date: date = None
    ) -> Optional[PensionSavingsContributionPlanStep]:
        """
        Get the current contribution step for a savings pension.
        
        Returns the step that's active on the reference date.
        If no reference date is provided, uses the current date.
        """
        if reference_date is None:
            reference_date = date.today()
        
        # Find step where reference_date is between start_date and end_date
        # (or end_date is null for ongoing contributions)
        return db.query(PensionSavingsContributionPlanStep).filter(
            PensionSavingsContributionPlanStep.pension_savings_id == pension_id,
            PensionSavingsContributionPlanStep.start_date <= reference_date,
            or_(
                PensionSavingsContributionPlanStep.end_date >= reference_date,
                PensionSavingsContributionPlanStep.end_date == None
            )
        ).first()
    
    def update_status(
        self, 
        db: Session, 
        *, 
        pension_id: int, 
        status: PensionStatus, 
        paused_at: Optional[date] = None, 
        resume_at: Optional[date] = None
    ) -> PensionSavings:
        """Update the status of a savings pension."""
        pension = self.get(db=db, id=pension_id)
        if not pension:
            raise ValueError(f"Pension with ID {pension_id} not found")
        
        pension.status = status
        
        # If we're activating the pension, clear the pause dates
        if status == PensionStatus.ACTIVE:
            pension.paused_at = None
            pension.resume_at = None
        # If we're pausing the pension, set the dates
        elif status == PensionStatus.PAUSED:
            pension.paused_at = paused_at
            pension.resume_at = resume_at
        
        db.add(pension)
        db.commit()
        db.refresh(pension)
        return pension
    
    def get_statements(
        self,
        db: Session,
        *,
        pension_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[PensionSavingsStatement]:
        """Get all statements for a savings pension with pagination."""
        return db.query(PensionSavingsStatement).filter(
            PensionSavingsStatement.pension_id == pension_id
        ).order_by(desc(PensionSavingsStatement.statement_date)).offset(skip).limit(limit).all()

    def update_statement(
        self,
        db: Session,
        *,
        statement_id: int,
        obj_in: Union[PensionSavingsStatementUpdate, Dict[str, Any]]
    ) -> PensionSavingsStatement:
        """Update a statement."""
        statement = db.query(PensionSavingsStatement).get(statement_id)
        if not statement:
            raise ValueError(f"Statement with ID {statement_id} not found")

        # Convert to dict if it's a schema object
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        # Update statement fields
        for field, value in update_data.items():
            if hasattr(statement, field):
                setattr(statement, field, value)

        db.add(statement)
        db.commit()
        db.refresh(statement)
        return statement

    def remove_statement(
        self,
        db: Session,
        *,
        statement_id: int
    ) -> bool:
        """Remove a savings pension statement."""
        try:
            statement = db.query(PensionSavingsStatement).get(statement_id)
            if not statement:
                return False

            db.delete(statement)
            db.commit()
            return True

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to delete statement: {str(e)}")
            raise

    def get_list(self, db: Session, *, member_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[Dict]:
        """
        Get savings pensions in a lightweight format for list views.

        Includes the latest statement balance and the current contribution step.
        If member_id is provided, filters to that member's pensions.
        """
        query = db.query(PensionSavings)
        
        if member_id:
            query = query.filter(PensionSavings.member_id == member_id)
        
        pensions = query.all()
        result = []
        
        for pension in pensions:
            # Get latest statement if any
            latest_statement = self.get_latest_statement(db=db, pension_id=pension.id)
            
            # Get current contribution step if any
            current_step = self.get_current_contribution_step(
                db=db, 
                pension_id=pension.id, 
                reference_date=date.today()
            )
            
            pension_dict = {
                "id": pension.id,
                "name": pension.name,
                "member_id": pension.member_id,
                "status": pension.status,
                "paused_at": pension.paused_at,
                "resume_at": pension.resume_at,
                "pessimistic_rate": pension.pessimistic_rate,
                "realistic_rate": pension.realistic_rate,
                "optimistic_rate": pension.optimistic_rate,
                "compounding_frequency": pension.compounding_frequency,
                "latest_balance": latest_statement.balance if latest_statement else None,
                "latest_statement_date": latest_statement.statement_date if latest_statement else None,
                "current_step_amount": current_step.amount if current_step else None,
                "current_step_frequency": current_step.frequency if current_step else None
            }
            result.append(pension_dict)
        
        return result


# Create a singleton instance
pension_savings = CRUDPensionSavings(PensionSavings) 