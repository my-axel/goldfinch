from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas
from app.api.v1 import deps
from app.crud.pension_state import pension_state
from app.crud.settings import settings
from app.schemas.pension_state import (
    PensionStateCreate,
    PensionStateUpdate,
    PensionStateResponse,
    PensionStateStatementCreate,
    PensionStateStatementUpdate,
    PensionStateStatementResponse,
    StatePensionListSchema,
    PensionStatusUpdate
)
from app.services.pension_state_projection import PensionStateProjectionService, StatePensionProjection
import logging

logger = logging.getLogger("app.api.v1.endpoints.pension.state")

router = APIRouter()

@router.post(
    "",
    response_model=PensionStateResponse,
    status_code=201,
    responses={
        201: {"description": "State pension created successfully"},
        422: {"description": "Validation error"}
    }
)
def create_state_pension(
    *,
    db: Session = Depends(deps.get_db),
    pension_in: PensionStateCreate,
) -> PensionStateResponse:
    """Create a new state pension."""
    return pension_state.create(db=db, obj_in=pension_in)

@router.get(
    "",
    response_model=List[StatePensionListSchema],
    responses={
        200: {"description": "List of state pensions retrieved successfully"}
    }
)
def get_state_pensions(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    member_id: Optional[int] = None,
) -> List[StatePensionListSchema]:
    """
    Get a list of state pensions.
    Optionally filter by member_id.
    """
    return pension_state.get_list(
        db=db,
        skip=skip,
        limit=limit,
        member_id=member_id
    )

@router.get(
    "/{id}",
    response_model=PensionStateResponse,
    responses={
        200: {"description": "State pension retrieved successfully"},
        404: {"description": "State pension not found"}
    }
)
def get_state_pension(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
) -> PensionStateResponse:
    """Get a specific state pension by ID."""
    pension = pension_state.get(db=db, id=id)
    if not pension:
        raise HTTPException(status_code=404, detail="State pension not found")
    return pension

@router.put(
    "/{id}",
    response_model=PensionStateResponse,
    responses={
        200: {"description": "State pension updated successfully"},
        404: {"description": "State pension not found"},
        422: {"description": "Validation error"}
    }
)
def update_state_pension(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    pension_in: PensionStateUpdate,
) -> PensionStateResponse:
    """Update a state pension."""
    pension = pension_state.get(db=db, id=id)
    if not pension:
        raise HTTPException(status_code=404, detail="State pension not found")
    return pension_state.update(db=db, db_obj=pension, obj_in=pension_in)

@router.delete(
    "/{id}",
    responses={
        204: {"description": "State pension deleted successfully"},
        404: {"description": "State pension not found"}
    },
    status_code=204
)
def delete_state_pension(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
) -> None:
    """Delete a state pension."""
    pension = pension_state.get(db=db, id=id)
    if not pension:
        raise HTTPException(status_code=404, detail="State pension not found")
    pension_state.remove(db=db, id=id)

# Statement endpoints
@router.post(
    "/{pension_id}/statements",
    response_model=PensionStateStatementResponse,
    status_code=201,
    responses={
        201: {"description": "Statement created successfully"},
        404: {"description": "State pension not found"},
        422: {"description": "Validation error"}
    }
)
def create_statement(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    statement_in: PensionStateStatementCreate,
) -> PensionStateStatementResponse:
    """Create a new statement for a state pension."""
    try:
        return pension_state.create_statement(
            db=db,
            pension_id=pension_id,
            obj_in=statement_in
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get(
    "/{pension_id}/statements",
    response_model=List[PensionStateStatementResponse],
    responses={
        200: {"description": "List of statements retrieved successfully"},
        404: {"description": "State pension not found"}
    }
)
def get_statements(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    skip: int = 0,
    limit: int = 100,
) -> List[PensionStateStatementResponse]:
    """Get all statements for a state pension."""
    # Verify pension exists
    pension = pension_state.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="State pension not found")
    
    return pension_state.get_statements(
        db=db,
        pension_id=pension_id,
        skip=skip,
        limit=limit
    )

@router.get(
    "/{pension_id}/statements/{statement_id}",
    response_model=PensionStateStatementResponse,
    responses={
        200: {"description": "Statement retrieved successfully"},
        404: {"description": "Statement not found"}
    }
)
def get_statement(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    statement_id: int,
) -> PensionStateStatementResponse:
    """Get a specific statement by ID."""
    # First verify the pension exists
    pension = pension_state.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="State pension not found")
    
    statement = db.query(pension.statements).filter_by(id=statement_id).first()
    if not statement:
        raise HTTPException(status_code=404, detail="Statement not found")
    
    return statement

@router.put(
    "/{pension_id}/statements/{statement_id}",
    response_model=PensionStateStatementResponse,
    responses={
        200: {"description": "Statement updated successfully"},
        404: {"description": "Statement not found"},
        422: {"description": "Validation error"}
    }
)
def update_statement(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    statement_id: int,
    statement_in: PensionStateStatementUpdate,
) -> PensionStateStatementResponse:
    """Update a statement."""
    # First verify the pension exists
    pension = pension_state.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="State pension not found")
    
    return pension_state.update_statement(
        db=db,
        statement_id=statement_id,
        obj_in=statement_in
    )

@router.delete(
    "/{pension_id}/statements/{statement_id}",
    responses={
        204: {"description": "Statement deleted successfully"},
        404: {"description": "Statement not found"}
    },
    status_code=204
)
def delete_statement(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    statement_id: int,
) -> None:
    """Delete a statement."""
    # First verify the pension exists
    pension = pension_state.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="State pension not found")
    
    result = pension_state.remove_statement(db=db, statement_id=statement_id)
    if not result:
        raise HTTPException(status_code=404, detail="Statement not found")

@router.get(
    "/{pension_id}/scenarios",
    response_model=StatePensionProjection,
    responses={
        200: {"description": "Scenarios calculated successfully"},
        404: {"description": "State pension not found"},
        400: {"description": "Cannot calculate scenarios (no statements or member)"}
    }
)
async def calculate_pension_scenarios(
    pension_id: int,
    reference_date: Optional[date] = None,
    db: Session = Depends(deps.get_db)
) -> StatePensionProjection:
    """
    Calculate projection scenarios for a state pension based on:
    - Latest statement values
    - Member's planned and possible retirement ages
    - Configured growth rates from settings
    
    Returns scenarios for both planned and possible retirement dates,
    each containing pessimistic, realistic, and optimistic projections.
    
    Example response:
    ```json
    {
        "planned": {
            "pessimistic": {
                "monthly_amount": 2500.00,
                "annual_amount": 30000.00,
                "retirement_age": 67,
                "years_to_retirement": 20,
                "growth_rate": 2.0
            },
            "realistic": {
                "monthly_amount": 3000.00,
                "annual_amount": 36000.00,
                "retirement_age": 67,
                "years_to_retirement": 20,
                "growth_rate": 3.0
            },
            "optimistic": {
                "monthly_amount": 3500.00,
                "annual_amount": 42000.00,
                "retirement_age": 67,
                "years_to_retirement": 20,
                "growth_rate": 4.0
            }
        },
        "possible": {
            "pessimistic": {
                "monthly_amount": 2200.00,
                "annual_amount": 26400.00,
                "retirement_age": 63,
                "years_to_retirement": 16,
                "growth_rate": 2.0
            },
            "realistic": {
                "monthly_amount": 2600.00,
                "annual_amount": 31200.00,
                "retirement_age": 63,
                "years_to_retirement": 16,
                "growth_rate": 3.0
            },
            "optimistic": {
                "monthly_amount": 3000.00,
                "annual_amount": 36000.00,
                "retirement_age": 63,
                "years_to_retirement": 16,
                "growth_rate": 4.0
            }
        }
    }
    ```
    """
    # Get pension with statements
    pension = pension_state.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="State pension not found")
        
    if not pension.statements:
        raise HTTPException(
            status_code=400,
            detail="Cannot calculate scenarios without any statements"
        )
    
    # Get member for retirement age
    member = pension.member
    if not member:
        raise HTTPException(
            status_code=400,
            detail="Cannot calculate scenarios without associated member"
        )
    
    # Get settings for rates
    current_settings = settings.get_settings(db)
    
    # Calculate scenarios
    projection_service = PensionStateProjectionService()
    return projection_service.calculate_scenarios(
        pension=pension,
        member=member,
        settings=current_settings,
        reference_date=reference_date
    )

@router.put("/{pension_id}/status", response_model=PensionStateResponse)
def update_state_pension_status(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    status_in: PensionStatusUpdate,
) -> PensionStateResponse:
    """Update the status of a state pension."""
    pension = pension_state.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="State Pension not found")
    return pension_state.update_status(db=db, db_obj=pension, obj_in=status_in) 