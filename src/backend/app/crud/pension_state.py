import logging
from typing import Dict, Any, Union, List, Optional
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import desc, func
from app.crud.base import CRUDBase
from app.models.pension_state import PensionState, PensionStateStatement
from app.models.enums import PensionStatus
from app.schemas.pension_state import (
    PensionStateCreate,
    PensionStateUpdate,
    PensionStateStatementCreate,
    PensionStateStatementUpdate,
    PensionStatusUpdate
)
from datetime import date
from decimal import Decimal
from fastapi import HTTPException

logger = logging.getLogger("app.crud.pension_state")

class CRUDPensionState(CRUDBase[PensionState, PensionStateCreate, PensionStateUpdate]):
    """
    CRUD operations for PensionState.
    
    Following the RORO (Receive an Object, Return an Object) pattern:
    - All methods receive objects as parameters (e.g., db session, data objects)
    - All methods return objects as results (e.g., model instances, lists)
    - Named parameters are used for clarity
    """
    
    def get(self, db: Session, id: int) -> Optional[PensionState]:
        """
        Get a state pension by ID with all relationships loaded efficiently.
        
        Args:
            db: Database session object
            id: ID of the state pension to retrieve
            
        Returns:
            PensionState object with all relationships loaded or None if not found
        """
        return (
            db.query(PensionState)
            .options(
                selectinload(PensionState.statements)
            )
            .filter(PensionState.id == id)
            .first()
        )

    def create(
        self,
        db: Session,
        *,
        obj_in: PensionStateCreate
    ) -> PensionState:
        """
        Create a new state pension.
        
        Args:
            db: Database session object
            obj_in: PensionStateCreate object containing all data
            
        Returns:
            Created PensionState object with all relationships loaded
        """
        try:
            # Extract statements if present
            statements_data = None
            obj_dict = obj_in.model_dump()
            
            if "statements" in obj_dict:
                statements_data = obj_dict.pop("statements")
                
            # Create the pension without statements
            db_obj = PensionState(**obj_dict)
            db.add(db_obj)
            db.flush()  # Flush to get the ID without committing
            
            # Add statements if provided
            if statements_data and isinstance(statements_data, list):
                for stmt_data in statements_data:
                    db_stmt = PensionStateStatement(
                        **stmt_data,
                        pension_id=db_obj.id
                    )
                    db.add(db_stmt)
            
            db.commit()
            return self.get(db=db, id=db_obj.id)
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create state pension: {str(e)}")
            raise

    def update(
        self,
        db: Session,
        *,
        db_obj: PensionState,
        obj_in: Union[PensionStateUpdate, Dict[str, Any]]
    ) -> PensionState:
        """
        Update a state pension.
        
        Args:
            db: Database session object
            db_obj: Existing PensionState object to update
            obj_in: PensionStateUpdate object or dict containing update data
            
        Returns:
            Updated PensionState object with all relationships loaded
        """
        try:
            if isinstance(obj_in, dict):
                update_data = obj_in
            else:
                update_data = obj_in.model_dump(exclude_unset=True)

            # Extract statements if present
            statements_data = None
            if "statements" in update_data:
                statements_data = update_data.pop("statements")

            # Update fields directly in the database with a query
            update_values = {}
            for field, value in update_data.items():
                if hasattr(PensionState, field):
                    update_values[field] = value

            if update_values:
                db.query(PensionState).filter(
                    PensionState.id == db_obj.id
                ).update(update_values)
                
            # Process statements if provided
            if statements_data:
                for stmt_data in statements_data:
                    # Check if this is an existing statement (has ID) or new one
                    if "id" in stmt_data and stmt_data["id"]:
                        # Update existing statement
                        stmt_id = stmt_data["id"]
                        stmt = db.get(PensionStateStatement, stmt_id)
                        
                        if stmt and stmt.pension_id == db_obj.id:
                            # Update the statement fields
                            for field, value in stmt_data.items():
                                if hasattr(stmt, field) and field not in ["id", "pension_id"]:
                                    setattr(stmt, field, value)
                            db.add(stmt)
                        else:
                            # Statement not found or belongs to different pension
                            logger.warning(f"Statement {stmt_id} not found or belongs to different pension")
                    else:
                        # Create new statement
                        # Remove id if present and empty
                        if "id" in stmt_data:
                            del stmt_data["id"]
                            
                        # Ensure pension_id is set correctly
                        stmt_data["pension_id"] = db_obj.id
                        
                        # Create the statement
                        db_stmt = PensionStateStatement(**stmt_data)
                        db.add(db_stmt)

            db.commit()
            return self.get(db=db, id=db_obj.id)

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update state pension: {str(e)}")
            raise

    def create_statement(
        self,
        db: Session,
        *,
        pension_id: int,
        obj_in: PensionStateStatementCreate
    ) -> PensionStateStatement:
        """
        Create a new statement for a state pension.
        
        Args:
            db: Database session object
            pension_id: ID of the state pension
            obj_in: StatementCreate object containing the data
            
        Returns:
            Created PensionStateStatement object
            
        Raises:
            ValueError: If pension not found
        """
        # Get the pension
        pension = db.get(PensionState, pension_id)
        if not pension:
            raise ValueError("Pension not found")

        # Create the statement
        db_obj = PensionStateStatement(
            **obj_in.model_dump(),
            pension_id=pension_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_statement(
        self,
        db: Session,
        *,
        statement_id: int,
        obj_in: Union[PensionStateStatementUpdate, Dict[str, Any]]
    ) -> PensionStateStatement:
        """
        Update a state pension statement.
        
        Args:
            db: Database session object
            statement_id: ID of the statement to update
            obj_in: StatementUpdate object or dict containing update data
            
        Returns:
            Updated PensionStateStatement object
        """
        try:
            statement = db.get(PensionStateStatement, statement_id)
            if not statement:
                raise HTTPException(status_code=404, detail="Statement not found")

            if isinstance(obj_in, dict):
                update_data = obj_in
            else:
                update_data = obj_in.model_dump(exclude_unset=True)

            # Update statement fields
            for field, value in update_data.items():
                if hasattr(statement, field) and value is not None:
                    setattr(statement, field, value)

            db.commit()
            db.refresh(statement)
            return statement

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update statement: {str(e)}")
            raise

    def get_statements(
        self,
        db: Session,
        *,
        pension_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[PensionStateStatement]:
        """Get all statements for a state pension with pagination."""
        return db.query(PensionStateStatement).filter(
            PensionStateStatement.pension_id == pension_id
        ).order_by(desc(PensionStateStatement.statement_date)).offset(skip).limit(limit).all()

    def get_latest_statement(
        self,
        db: Session,
        *,
        pension_id: int
    ) -> Optional[PensionStateStatement]:
        """Get the latest statement for a state pension."""
        return db.query(PensionStateStatement).filter(
            PensionStateStatement.pension_id == pension_id
        ).order_by(desc(PensionStateStatement.statement_date)).first()

    def remove_statement(
        self,
        db: Session,
        *,
        statement_id: int
    ) -> bool:
        """Remove a state pension statement."""
        try:
            statement = db.query(PensionStateStatement).get(statement_id)
            if not statement:
                return False

            db.delete(statement)
            db.commit()
            return True

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to delete statement: {str(e)}")
            raise

    def get_list(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        member_id: Optional[int] = None
    ) -> List[dict]:
        """
        Get a lightweight list of state pensions.
        This optimized query avoids loading full statement data.
        """
        # First, get the basic pension information
        query = db.query(
            PensionState.id,
            PensionState.name,
            PensionState.member_id,
            PensionState.start_date,
            PensionState.status,
            PensionState.paused_at,
            PensionState.resume_at
        )
        
        if member_id is not None:
            query = query.filter(PensionState.member_id == member_id)
        
        result = query.offset(skip).limit(limit).all()
        
        # Get all pension IDs from the result
        pension_ids = [row.id for row in result]
        
        # If no pensions found, return empty list
        if not pension_ids:
            return []
            
        # Get statement counts for all pensions in one query
        statement_counts = db.query(
            PensionStateStatement.pension_id,
            func.count(PensionStateStatement.id).label("count")
        ).filter(
            PensionStateStatement.pension_id.in_(pension_ids)
        ).group_by(
            PensionStateStatement.pension_id
        ).all()
        
        # Create a lookup dictionary for statement counts
        statement_count_map = {row.pension_id: row.count for row in statement_counts}
        
        # Get latest statements for all pensions in one query
        latest_statements_subquery = db.query(
            PensionStateStatement.pension_id,
            func.max(PensionStateStatement.statement_date).label("max_date")
        ).filter(
            PensionStateStatement.pension_id.in_(pension_ids)
        ).group_by(
            PensionStateStatement.pension_id
        ).subquery()
        
        latest_statements = db.query(
            PensionStateStatement
        ).join(
            latest_statements_subquery,
            (PensionStateStatement.pension_id == latest_statements_subquery.c.pension_id) &
            (PensionStateStatement.statement_date == latest_statements_subquery.c.max_date)
        ).all()
        
        # Create a lookup dictionary for latest statements
        latest_statements_map = {stmt.pension_id: stmt for stmt in latest_statements}
        
        # Build the final result
        result_list = []
        for row in result:
            pension_dict = {
                "id": row.id,
                "name": row.name,
                "member_id": row.member_id,
                "start_date": row.start_date,
                "status": row.status,
                "paused_at": row.paused_at,
                "resume_at": row.resume_at,
                "statements_count": statement_count_map.get(row.id, 0)  # Get count or default to 0
            }
            
            # Add latest statement information if available
            latest_stmt = latest_statements_map.get(row.id)
            if latest_stmt:
                pension_dict.update({
                    "latest_statement_date": latest_stmt.statement_date,
                    "latest_monthly_amount": latest_stmt.current_monthly_amount,
                    "latest_projected_amount": latest_stmt.projected_monthly_amount,
                    "latest_current_value": latest_stmt.current_value
                })
            
            result_list.append(pension_dict)
            
        return result_list

    def update_status(
        self,
        db: Session,
        *,
        db_obj: PensionState,
        obj_in: PensionStatusUpdate
    ) -> PensionState:
        """Update the status of a state pension."""
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
            for field, value in obj_in.model_dump(exclude_unset=True).items():
                setattr(db_obj, field, value)

            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update pension status: {str(e)}")
            raise

# Create a singleton instance
pension_state = CRUDPensionState(PensionState) 