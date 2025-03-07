from typing import Dict, Any, Union, List, Optional
from sqlalchemy.orm import Session, selectinload
from app.crud.base import CRUDBase
from app.models.pension_insurance import (
    PensionInsurance,
    PensionInsuranceContributionPlanStep,
    PensionInsuranceContributionHistory,
    PensionInsuranceBenefit,
    PensionInsuranceStatement,
    PensionInsuranceProjection
)
from app.schemas.pension_insurance import (
    PensionInsuranceCreate,
    PensionInsuranceUpdate,
    ContributionHistoryCreate,
    BenefitCreate,
    StatementCreate,
    ProjectionCreate
)
from datetime import date
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

class CRUDPensionInsurance(CRUDBase[PensionInsurance, PensionInsuranceCreate, PensionInsuranceUpdate]):
    """
    CRUD operations for PensionInsurance.
    
    Following the RORO (Receive an Object, Return an Object) pattern:
    - All methods receive objects as parameters (e.g., db session, data objects)
    - All methods return objects as results (e.g., model instances, lists)
    - Named parameters are used for clarity
    """
    
    def get(self, db: Session, id: int) -> Optional[PensionInsurance]:
        """
        Get a pension insurance by ID with all relationships loaded efficiently.
        
        Args:
            db: Database session object
            id: ID of the pension insurance to retrieve
            
        Returns:
            PensionInsurance object with all relationships loaded or None if not found
        """
        return (
            db.query(PensionInsurance)
            .options(
                selectinload(PensionInsurance.contribution_plan_steps),
                selectinload(PensionInsurance.contribution_history),
                selectinload(PensionInsurance.benefits),
                selectinload(PensionInsurance.statements).selectinload(PensionInsuranceStatement.projections)
            )
            .filter(PensionInsurance.id == id)
            .first()
        )

    def create(
        self, db: Session, *, obj_in: PensionInsuranceCreate
    ) -> PensionInsurance:
        """
        Create a new pension insurance with related objects.
        
        Args:
            db: Database session object
            obj_in: PensionInsuranceCreate object containing all data
            
        Returns:
            Created PensionInsurance object with all relationships loaded
        """
        try:
            # Start by creating the pension object
            obj_in_data = obj_in.dict(exclude={"contribution_plan_steps", "benefits", "statements"})
            db_obj = PensionInsurance(**obj_in_data)
            
            # Add and flush the pension object to get its ID
            db.add(db_obj)
            db.flush()

            # Create contribution plan steps
            for step in obj_in.contribution_plan_steps:
                db_step = PensionInsuranceContributionPlanStep(
                    **step.dict(),
                    pension_insurance_id=db_obj.id
                )
                db.add(db_step)
            
            # Create benefits if provided
            if obj_in.benefits:
                for benefit in obj_in.benefits:
                    db_benefit = PensionInsuranceBenefit(
                        **benefit.dict(),
                        pension_insurance_id=db_obj.id
                    )
                    db.add(db_benefit)

            # Commit all changes
            db.commit()
            
            # Instead of using db.refresh, get a fresh instance with all relationships loaded
            return self.get(db=db, id=db_obj.id)
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create insurance pension: {str(e)}")
            raise

    def update(
        self,
        db: Session,
        *,
        db_obj: PensionInsurance,
        obj_in: Union[PensionInsuranceUpdate, Dict[str, Any]]
    ) -> PensionInsurance:
        """
        Update a pension insurance with related objects.
        
        Args:
            db: Database session object
            db_obj: Existing PensionInsurance object to update
            obj_in: PensionInsuranceUpdate object or dict containing update data
            
        Returns:
            Updated PensionInsurance object with all relationships loaded
        """
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
                db_step = PensionInsuranceContributionPlanStep(
                    **step_data,
                    pension_insurance_id=db_obj.id
                )
                db.add(db_step)
        
        # Handle benefits separately
        if "benefits" in update_data:
            # Remove old benefits
            for benefit in db_obj.benefits:
                db.delete(benefit)
            
            # Add new benefits
            for benefit in update_data.pop("benefits"):
                benefit_data = benefit.dict() if hasattr(benefit, 'dict') else benefit
                db_benefit = PensionInsuranceBenefit(
                    **benefit_data,
                    pension_insurance_id=db_obj.id
                )
                db.add(db_benefit)

        # Update other fields
        result = super().update(db=db, db_obj=db_obj, obj_in=update_data)
        
        # Return a fresh instance with all relationships loaded
        return self.get(db=db, id=result.id)

    def create_contribution_history(
        self,
        db: Session,
        *,
        pension_id: int,
        obj_in: ContributionHistoryCreate
    ) -> PensionInsuranceContributionHistory:
        """
        Create a contribution history entry for a pension insurance.
        
        Args:
            db: Database session object
            pension_id: ID of the pension insurance
            obj_in: ContributionHistoryCreate object containing the data
            
        Returns:
            Created PensionInsuranceContributionHistory object
            
        Raises:
            ValueError: If pension not found
        """
        # Get the pension
        pension = db.query(PensionInsurance).get(pension_id)
        if not pension:
            raise ValueError("Pension not found")

        # Create the contribution history
        contribution_data = obj_in.dict()
        # Map contribution_date to date field in the model
        if 'contribution_date' in contribution_data:
            contribution_data['date'] = contribution_data.pop('contribution_date')
            
        db_obj = PensionInsuranceContributionHistory(
            **contribution_data,
            pension_insurance_id=pension_id
        )
        db.add(db_obj)

        # Update pension current value
        pension.current_value += obj_in.amount

        db.commit()
        
        # Instead of using db.refresh, query the object directly
        return (
            db.query(PensionInsuranceContributionHistory)
            .filter(PensionInsuranceContributionHistory.id == db_obj.id)
            .first()
        )
    
    def create_benefit(
        self,
        db: Session,
        *,
        pension_id: int,
        obj_in: BenefitCreate
    ) -> PensionInsuranceBenefit:
        """
        Create a new benefit for an insurance pension.
        
        Args:
            db: Database session object
            pension_id: ID of the pension insurance
            obj_in: BenefitCreate object containing the data
            
        Returns:
            Created PensionInsuranceBenefit object
            
        Raises:
            ValueError: If pension not found
        """
        # Get the pension
        pension = db.query(PensionInsurance).get(pension_id)
        if not pension:
            raise ValueError("Pension not found")

        # Create the benefit
        db_obj = PensionInsuranceBenefit(
            **obj_in.dict(),
            pension_insurance_id=pension_id
        )
        db.add(db_obj)
        db.commit()
        
        # Instead of using db.refresh, query the object directly
        return (
            db.query(PensionInsuranceBenefit)
            .filter(PensionInsuranceBenefit.id == db_obj.id)
            .first()
        )
    
    def create_statement(
        self,
        db: Session,
        *,
        pension_id: int,
        obj_in: StatementCreate
    ) -> PensionInsuranceStatement:
        """
        Create a new statement with projections for an insurance pension.
        
        Args:
            db: Database session object
            pension_id: ID of the pension insurance
            obj_in: StatementCreate object containing the data
            
        Returns:
            Created PensionInsuranceStatement object with projections
            
        Raises:
            ValueError: If pension not found
        """
        # Get the pension
        pension = db.query(PensionInsurance).get(pension_id)
        if not pension:
            raise ValueError("Pension not found")
        
        return self._create_statement_with_projections(db=db, pension_id=pension_id, statement_data=obj_in)
    
    def _create_statement_with_projections(
        self,
        db: Session,
        pension_id: int,
        statement_data: StatementCreate
    ) -> PensionInsuranceStatement:
        """
        Helper method to create a statement with its projections.
        
        Args:
            db: Database session object
            pension_id: ID of the pension insurance
            statement_data: StatementCreate object containing the data
            
        Returns:
            Created PensionInsuranceStatement object with projections
        """
        try:
            # Create statement without projections first
            statement_dict = statement_data.dict(exclude={"projections"})
            statement = PensionInsuranceStatement(
                **statement_dict,
                pension_insurance_id=pension_id
            )
            db.add(statement)
            db.flush()  # Flush to get the statement ID
            
            # Create projections if provided
            if statement_data.projections:
                for projection in statement_data.projections:
                    # Convert ProjectionCreate to dict
                    projection_dict = projection.dict()
                    db_projection = PensionInsuranceProjection(
                        **projection_dict,
                        statement_id=statement.id
                    )
                    db.add(db_projection)
            
            # Update pension current value
            pension = db.query(PensionInsurance).get(pension_id)
            if pension:
                pension.current_value = statement_data.value
            
            db.commit()
            
            # Return fresh instance with projections loaded
            return (
                db.query(PensionInsuranceStatement)
                .options(
                    selectinload(PensionInsuranceStatement.projections)
                )
                .filter(PensionInsuranceStatement.id == statement.id)
                .first()
            )
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create statement with projections: {str(e)}")
            raise
    
    def get_latest_statement(
        self,
        db: Session,
        *,
        pension_id: int
    ) -> Optional[PensionInsuranceStatement]:
        """
        Get the latest statement for a pension.
        
        Args:
            db: Database session object
            pension_id: ID of the pension insurance
            
        Returns:
            Latest PensionInsuranceStatement object with projections or None if no statements
        """
        return (
            db.query(PensionInsuranceStatement)
            .options(
                selectinload(PensionInsuranceStatement.projections)
            )
            .filter(PensionInsuranceStatement.pension_insurance_id == pension_id)
            .order_by(PensionInsuranceStatement.statement_date.desc())
            .first()
        )
    
    def delete_statement(
        self,
        db: Session,
        *,
        statement_id: int
    ) -> bool:
        """
        Delete a statement and its projections.
        
        Args:
            db: Database session object
            statement_id: ID of the statement to delete
            
        Returns:
            True if statement was deleted, False if statement not found
        """
        statement = db.query(PensionInsuranceStatement).get(statement_id)
        if not statement:
            return False
        
        # Get the pension to update its current value
        pension = db.query(PensionInsurance).get(statement.pension_insurance_id)
        
        # Delete the statement (projections will be deleted via cascade)
        db.delete(statement)
        
        # Update pension current value to the next latest statement if exists
        latest_statement = (
            db.query(PensionInsuranceStatement)
            .filter(PensionInsuranceStatement.pension_insurance_id == statement.pension_insurance_id)
            .filter(PensionInsuranceStatement.id != statement_id)
            .order_by(PensionInsuranceStatement.statement_date.desc())
            .first()
        )
        
        if latest_statement:
            pension.current_value = latest_statement.value
        else:
            # If no statements left, set to 0 or some default value
            pension.current_value = 0
        
        db.commit()
        return True

pension_insurance = CRUDPensionInsurance(PensionInsurance) 