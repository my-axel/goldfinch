import logging
from typing import Dict, Any, Union, List, Optional
from sqlalchemy.orm import Session, selectinload, noload
from sqlalchemy import desc, func
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
from fastapi import HTTPException

# Use the app.crud logger namespace to ensure logs go to the right place
logger = logging.getLogger("app.crud.pension_company")

class CRUDPensionCompany(CRUDBase[PensionCompany, PensionCompanyCreate, PensionCompanyUpdate]):
    def create(
        self,
        db: Session,
        *,
        obj_in: PensionCompanyCreate
    ) -> PensionCompany:
        try:
            # Start by creating the pension object
            obj_in_data = obj_in.dict(exclude={"contribution_plan_steps"})
            db_obj = PensionCompany(**obj_in_data)
            
            # Add and flush the pension object to get its ID
            db.add(db_obj)
            db.flush()
            
            # Now handle contribution plan steps if provided
            if obj_in.contribution_plan_steps:
                for step_data in obj_in.contribution_plan_steps:
                    step = PensionCompanyContributionPlanStep(
                        **step_data.dict(),
                        pension_company_id=db_obj.id
                    )
                    db.add(step)
            
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
        try:
            logger.debug(f"CRUD: Starting update for company pension ID: {db_obj.id}")
            
            if isinstance(obj_in, dict):
                update_data = obj_in
            else:
                update_data = obj_in.dict(exclude_unset=True)
            
            logger.debug(f"CRUD: Update data: {update_data}")
            
            # Store the ID for later query
            pension_id = db_obj.id

            # Handle contribution plan steps separately
            if "contribution_plan_steps" in update_data:
                logger.debug(f"CRUD: Processing contribution plan steps")
                # Remove old steps
                db.query(PensionCompanyContributionPlanStep).filter(
                    PensionCompanyContributionPlanStep.pension_company_id == pension_id
                ).delete()
                db.flush()
                logger.debug("CRUD: Deleted old steps")
                
                # Add new steps
                steps = update_data.pop("contribution_plan_steps")
                if steps:
                    logger.debug(f"CRUD: Adding {len(steps)} new steps")
                    for step in steps:
                        if hasattr(step, 'dict'):
                            step_data = step.dict()
                        elif isinstance(step, dict):
                            step_data = step
                        else:
                            raise ValueError("Invalid contribution plan step format")
                        
                        logger.debug(f"CRUD: New step data: {step_data}")
                        db_step = PensionCompanyContributionPlanStep(
                            **step_data,
                            pension_company_id=pension_id
                        )
                        db.add(db_step)
                        logger.debug(f"CRUD: Added new step with start_date: {step_data.get('start_date')}")

            # Update fields directly in the database with a query
            logger.debug("CRUD: Updating base fields with direct query")
            
            # Create a dictionary with only the fields that should be updated
            update_values = {}
            for field, value in update_data.items():
                if hasattr(PensionCompany, field):
                    update_values[field] = value
            
            # Execute direct update query
            if update_values:
                db.query(PensionCompany).filter(
                    PensionCompany.id == pension_id
                ).update(update_values)
            
            logger.debug("CRUD: Committing changes to database")
            db.commit()
            
            # IMPORTANT: DO NOT USE db.refresh(result) here as it causes recursion
            # by loading all relationships including statements which loads pension which loads statements...
            
            logger.debug("CRUD: Getting updated pension with a focused query")
            # Instead of refreshing the entire object with all relationships,
            # just get the updated pension with only the necessary relationships
            # and explicitly avoid loading statements to avoid recursion
            updated_pension = (
                db.query(PensionCompany)
                .filter(PensionCompany.id == pension_id)
                .options(
                    selectinload(PensionCompany.contribution_plan_steps),
                    noload(PensionCompany.statements)
                )
                .first()
            )
            
            logger.debug(f"CRUD: Successfully updated company pension ID: {updated_pension.id}")
            return updated_pension
            
        except Exception as e:
            db.rollback()
            logger.error(f"CRUD: Failed to update company pension: {str(e)}", exc_info=True)
            raise

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
        """Create a new pension company statement."""
        try:
            logger.debug(f"CRUD: Creating new statement for pension ID: {pension_id}")
            
            # Start by creating the statement object
            obj_in_data = obj_in.dict(exclude={"retirement_projections"})
            db_obj = PensionCompanyStatement(**obj_in_data, pension_id=pension_id)
            
            # Add and flush the statement object to get its ID
            db.add(db_obj)
            db.flush()
            logger.debug(f"CRUD: Created statement with ID: {db_obj.id}")
            
            # Now handle retirement projections if provided
            if obj_in.retirement_projections:
                logger.debug(f"CRUD: Adding {len(obj_in.retirement_projections)} retirement projections")
                for projection in obj_in.retirement_projections:
                    projection_data = projection.dict()
                    db_projection = PensionCompanyRetirementProjection(
                        **projection_data,
                        statement_id=db_obj.id
                    )
                    db.add(db_projection)
                    logger.debug(f"CRUD: Added projection with retirement_age: {projection_data.get('retirement_age')}")
            
            # Commit all changes
            logger.debug("CRUD: Committing changes to database")
            db.commit()
            
            # IMPORTANT: DO NOT USE db.refresh(db_obj) here as it causes recursion
            # by loading all relationships including pension which loads statements which loads pension...
            
            logger.debug("CRUD: Getting created statement with a focused query")
            # Instead of refreshing the entire object with all relationships,
            # just get the created statement with only the projections relationship
            created_statement = (
                db.query(PensionCompanyStatement)
                .filter(PensionCompanyStatement.id == db_obj.id)
                .options(
                    selectinload(PensionCompanyStatement.retirement_projections)
                )
                .first()
            )
            
            logger.debug(f"CRUD: Successfully created statement ID: {created_statement.id} with {len(created_statement.retirement_projections)} projections")
            return created_statement
            
        except Exception as e:
            db.rollback()
            logger.error(f"CRUD: Failed to create company pension statement: {str(e)}", exc_info=True)
            raise

    def update_statement(
        self,
        db: Session,
        *,
        statement_id: int,
        obj_in: Union[PensionCompanyStatementUpdate, Dict[str, Any]]
    ) -> PensionCompanyStatement:
        """Update a pension company statement."""
        try:
            logger.debug(f"CRUD: Starting update of statement ID: {statement_id}")
            
            # Get the existing statement
            db_obj = db.query(PensionCompanyStatement).filter(
                PensionCompanyStatement.id == statement_id
            ).first()
            
            if not db_obj:
                logger.warning(f"CRUD: Statement with ID {statement_id} not found")
                raise ValueError(f"Statement with ID {statement_id} not found")
            
            # Convert input to dict if it's a Pydantic model
            if isinstance(obj_in, dict):
                update_data = obj_in
            else:
                update_data = obj_in.dict(exclude_unset=True)
            
            logger.debug(f"CRUD: Update data for statement: {update_data}")
            
            # Handle retirement projections separately
            retirement_projections = update_data.pop("retirement_projections", None)
            
            # Log whether retirement projections are present
            if retirement_projections is not None:
                logger.debug(f"CRUD: Found {len(retirement_projections)} retirement projections to update")
            else:
                logger.debug("CRUD: No retirement projections provided in update data")
            
            # Update statement fields directly with a query
            logger.debug("CRUD: Updating statement fields with direct query")
            
            # Create a dictionary with only the fields that should be updated
            statement_update_values = {}
            for field, value in update_data.items():
                if hasattr(PensionCompanyStatement, field):
                    statement_update_values[field] = value
            
            # Execute direct update query for statement
            if statement_update_values:
                db.query(PensionCompanyStatement).filter(
                    PensionCompanyStatement.id == statement_id
                ).update(statement_update_values)
                logger.debug(f"CRUD: Updated statement fields: {list(statement_update_values.keys())}")
            
            # Update retirement projections if provided
            if retirement_projections is not None:
                logger.debug(f"CRUD: Updating retirement projections for statement ID: {statement_id}")
                
                # Delete existing projections
                deleted_count = db.query(PensionCompanyRetirementProjection).filter(
                    PensionCompanyRetirementProjection.statement_id == statement_id
                ).delete()
                logger.debug(f"CRUD: Deleted {deleted_count} existing retirement projections")
                
                # Create new projections
                for projection in retirement_projections:
                    if isinstance(projection, dict):
                        projection_data = projection
                    else:
                        projection_data = projection.dict()
                    
                    # Remove id if present
                    projection_data.pop("id", None)
                    
                    logger.debug(f"CRUD: Adding retirement projection with retirement_age: {projection_data.get('retirement_age')}")
                    db_projection = PensionCompanyRetirementProjection(
                        **projection_data,
                        statement_id=statement_id
                    )
                    db.add(db_projection)
                    logger.debug(f"CRUD: Added retirement projection with retirement_age: {projection_data.get('retirement_age')}")
            
            # Commit changes
            logger.debug("CRUD: Committing statement update to database")
            db.commit()
            
            # IMPORTANT: DO NOT USE db.refresh(db_obj) here as it causes recursion
            # by loading all relationships including pension which loads statements which loads pension...
            
            logger.debug("CRUD: Getting updated statement with a focused query")
            # Instead of refreshing the entire object with all relationships,
            # just get the updated statement with only the projections relationship
            updated_statement = (
                db.query(PensionCompanyStatement)
                .filter(PensionCompanyStatement.id == statement_id)
                .options(
                    selectinload(PensionCompanyStatement.retirement_projections)
                )
                .first()
            )
            
            logger.debug(f"CRUD: Successfully updated statement ID: {updated_statement.id} with {len(updated_statement.retirement_projections)} projections")
            return updated_statement
            
        except Exception as e:
            db.rollback()
            logger.error(f"CRUD: Failed to update company pension statement: {str(e)}", exc_info=True)
            raise

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

    def remove_statement(
        self,
        db: Session,
        *,
        statement_id: int
    ) -> bool:
        """Remove a pension company statement."""
        try:
            logger.debug(f"CRUD: Starting deletion of statement ID: {statement_id}")
            
            # Get the statement to delete
            statement = db.query(PensionCompanyStatement).filter(
                PensionCompanyStatement.id == statement_id
            ).first()
            
            if not statement:
                logger.warning(f"CRUD: Statement with ID {statement_id} not found")
                return False
            
            # Delete the statement
            # Note: retirement_projections will be deleted automatically due to cascade
            db.delete(statement)
            db.commit()
            
            logger.debug(f"CRUD: Successfully deleted statement ID: {statement_id}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"CRUD: Failed to delete statement: {str(e)}", exc_info=True)
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
        Get a lightweight list of company pensions.
        This optimized query avoids loading full contribution data and statements.
        """
        from datetime import date
        from sqlalchemy import desc, func
        today = date.today()
        
        # First, get the basic pension information
        query = db.query(
            PensionCompany.id,
            PensionCompany.name,
            PensionCompany.member_id,
            PensionCompany.current_value,
            PensionCompany.employer,
            PensionCompany.start_date,
            PensionCompany.contribution_amount,
            PensionCompany.contribution_frequency,
            PensionCompany.status,
            PensionCompany.paused_at,
            PensionCompany.resume_at
        )
        
        if member_id is not None:
            query = query.filter(PensionCompany.member_id == member_id)
        
        result = query.offset(skip).limit(limit).all()
        
        # Get all pension IDs from the result
        pension_ids = [row.id for row in result]
        
        # If no pensions found, return empty list
        if not pension_ids:
            return []
        
        # Get current contribution steps for all pensions in one query
        current_steps_query = db.query(
            PensionCompanyContributionPlanStep.pension_company_id,
            PensionCompanyContributionPlanStep.amount,
            PensionCompanyContributionPlanStep.frequency
        ).filter(
            PensionCompanyContributionPlanStep.pension_company_id.in_(pension_ids),
            PensionCompanyContributionPlanStep.start_date <= today,
            (PensionCompanyContributionPlanStep.end_date >= today) | (PensionCompanyContributionPlanStep.end_date.is_(None))
        )
        
        # Create a dictionary mapping pension_id to current step
        current_steps = {}
        for step in current_steps_query:
            current_steps[step.pension_company_id] = {
                "amount": step.amount,
                "frequency": step.frequency
            }
        
        # Get latest statements for all pensions in one query
        latest_statements_subquery = db.query(
            PensionCompanyStatement.pension_id,
            func.max(PensionCompanyStatement.statement_date).label("max_date")
        ).filter(
            PensionCompanyStatement.pension_id.in_(pension_ids)
        ).group_by(
            PensionCompanyStatement.pension_id
        ).subquery()
        
        latest_statements_query = db.query(
            PensionCompanyStatement.pension_id,
            PensionCompanyStatement.id.label("statement_id"),
            PensionCompanyStatement.statement_date
        ).join(
            latest_statements_subquery,
            (PensionCompanyStatement.pension_id == latest_statements_subquery.c.pension_id) &
            (PensionCompanyStatement.statement_date == latest_statements_subquery.c.max_date)
        )
        
        # Create a dictionary mapping pension_id to latest statement
        latest_statements = {}
        for stmt in latest_statements_query:
            latest_statements[stmt.pension_id] = {
                "statement_id": stmt.statement_id,
                "statement_date": stmt.statement_date
            }
        
        # Get latest projections for the latest statements
        statement_ids = [stmt["statement_id"] for stmt in latest_statements.values() if stmt["statement_id"]]
        
        latest_projections = {}
        if statement_ids:
            projections_query = db.query(
                PensionCompanyRetirementProjection.statement_id,
                PensionCompanyRetirementProjection.retirement_age,
                PensionCompanyRetirementProjection.monthly_payout
            ).filter(
                PensionCompanyRetirementProjection.statement_id.in_(statement_ids)
            )
            
            # Group projections by statement_id
            for proj in projections_query:
                if proj.statement_id not in latest_projections:
                    latest_projections[proj.statement_id] = []
                latest_projections[proj.statement_id].append({
                    "retirement_age": proj.retirement_age,
                    "monthly_payout": proj.monthly_payout
                })
        
        # Convert SQLAlchemy Row objects to dictionaries with additional information
        return [
            {
                "id": row.id,
                "name": row.name,
                "member_id": row.member_id,
                "current_value": row.current_value,
                "employer": row.employer,
                "start_date": row.start_date,
                "contribution_amount": row.contribution_amount,
                "contribution_frequency": row.contribution_frequency,
                "status": row.status,
                "paused_at": row.paused_at,
                "resume_at": row.resume_at,
                "current_step_amount": current_steps.get(row.id, {}).get("amount"),
                "current_step_frequency": current_steps.get(row.id, {}).get("frequency"),
                "latest_statement_date": latest_statements.get(row.id, {}).get("statement_date"),
                "latest_projections": latest_projections.get(
                    latest_statements.get(row.id, {}).get("statement_id"), []
                )
            }
            for row in result
        ]

pension_company = CRUDPensionCompany(PensionCompany) 