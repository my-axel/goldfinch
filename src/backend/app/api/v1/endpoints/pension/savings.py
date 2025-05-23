from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session

from app.api.v1.deps import get_db
from app.crud.pension_savings import pension_savings
from app.schemas.pension_savings import (
    PensionSavingsCreate,
    PensionSavingsUpdate,
    PensionSavingsResponse,
    PensionSavingsStatementCreate,
    PensionSavingsStatementResponse,
    PensionSavingsListSchema,
    PensionSavingsProjection
)
from app.models.enums import PensionStatus
from app.services.pension_savings_projection import PensionSavingsProjectionService

router = APIRouter()

@router.get("", response_model=List[PensionSavingsListSchema])
def get_savings_pensions(
    member_id: Optional[int] = Query(None, description="Filter by member ID"),
    db: Session = Depends(get_db)
):
    """
    Get a list of all savings pensions, optionally filtered by member ID.
    Returns a lightweight representation for list views.
    """
    pensions = pension_savings.get_for_list_view(db, member_id=member_id)
    return pensions

@router.get("/{id}", response_model=PensionSavingsResponse)
def get_savings_pension(
    id: int = Path(..., description="The ID of the savings pension to retrieve"),
    db: Session = Depends(get_db)
):
    """
    Get a specific savings pension by ID.
    Returns the full pension data including statements and contribution plan steps.
    """
    pension = pension_savings.get(db=db, id=id)
    if not pension:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Savings pension with ID {id} not found"
        )
    return pension

@router.post("", response_model=PensionSavingsResponse, status_code=status.HTTP_201_CREATED)
def create_savings_pension(
    pension_in: PensionSavingsCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new savings pension.
    """
    try:
        return pension_savings.create(db=db, obj_in=pension_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )

@router.put("/{id}", response_model=PensionSavingsResponse)
def update_savings_pension(
    pension_in: PensionSavingsUpdate,
    id: int = Path(..., description="The ID of the savings pension to update"),
    db: Session = Depends(get_db)
):
    """
    Update an existing savings pension.
    """
    pension = pension_savings.get(db=db, id=id)
    if not pension:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Savings pension with ID {id} not found"
        )
    
    try:
        return pension_savings.update(db=db, db_obj=pension, obj_in=pension_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )

@router.delete("/{id}", response_model=dict)
def delete_savings_pension(
    id: int = Path(..., description="The ID of the savings pension to delete"),
    db: Session = Depends(get_db)
):
    """
    Delete a savings pension and all related data.
    """
    pension = pension_savings.get(db=db, id=id)
    if not pension:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Savings pension with ID {id} not found"
        )
    
    pension_savings.remove(db=db, id=id)
    return {"success": True}

@router.post("/{id}/statements", response_model=PensionSavingsStatementResponse, status_code=status.HTTP_201_CREATED)
def create_savings_statement(
    statement_in: PensionSavingsStatementCreate,
    id: int = Path(..., description="The ID of the savings pension to add a statement to"),
    db: Session = Depends(get_db)
):
    """
    Add a new statement to a savings pension.
    """
    pension = pension_savings.get(db=db, id=id)
    if not pension:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Savings pension with ID {id} not found"
        )
    
    try:
        return pension_savings.add_statement(
            db=db, 
            pension_id=id, 
            statement_in=statement_in
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )

@router.put("/{id}/status", response_model=PensionSavingsResponse)
def update_savings_pension_status(
    status_update: dict,
    id: int = Path(..., description="The ID of the savings pension to update status"),
    db: Session = Depends(get_db)
):
    """
    Update the status of a savings pension.
    
    To pause: {"status": "PAUSED", "paused_at": "2023-01-01", "resume_at": "2024-01-01"}
    To resume: {"status": "ACTIVE"}
    """
    pension = pension_savings.get(db=db, id=id)
    if not pension:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Savings pension with ID {id} not found"
        )
    
    try:
        status_value = PensionStatus(status_update.get("status"))
        paused_at = status_update.get("paused_at")
        resume_at = status_update.get("resume_at")
        
        return pension_savings.update_status(
            db=db,
            pension_id=id,
            status=status_value,
            paused_at=paused_at,
            resume_at=resume_at
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )

@router.get(
    "/{id}/scenarios",
    response_model=PensionSavingsProjection,
    responses={
        200: {"description": "Scenarios calculated successfully"},
        404: {"description": "Savings pension not found"},
        400: {"description": "Cannot calculate scenarios without associated member"}
    }
)
def calculate_pension_scenarios(
    id: int = Path(..., description="The ID of the savings pension to calculate scenarios for"),
    reference_date: Optional[date] = None,
    db: Session = Depends(get_db)
) -> PensionSavingsProjection:
    """
    Calculate projection scenarios for a savings pension based on:
    - Latest statement balance
    - Interest rates (pessimistic, realistic, optimistic)
    - Compounding frequency
    - Contribution plan steps
    - Member's planned and possible retirement dates
    
    Returns scenarios for both planned and possible retirement dates,
    each containing pessimistic, realistic, and optimistic projections.
    
    If the pension has no statements, returns an empty projection structure.
    
    Example response:
    ```json
    {
        "planned": {
            "pessimistic": {
                "balance": 25000.00,
                "retirement_age": 67,
                "years_to_retirement": 20,
                "growth_rate": 1.0,
                "total_contributions": 15000.00,
                "balance_without_contributions": 10000.00
            },
            "realistic": {
                "balance": 30000.00,
                "retirement_age": 67,
                "years_to_retirement": 20,
                "growth_rate": 2.0,
                "total_contributions": 15000.00,
                "balance_without_contributions": 15000.00
            },
            "optimistic": {
                "balance": 35000.00,
                "retirement_age": 67,
                "years_to_retirement": 20,
                "growth_rate": 3.0,
                "total_contributions": 15000.00,
                "balance_without_contributions": 20000.00
            }
        },
        "possible": {
            "pessimistic": {
                "balance": 20000.00,
                "retirement_age": 63,
                "years_to_retirement": 16,
                "growth_rate": 1.0,
                "total_contributions": 12000.00,
                "balance_without_contributions": 8000.00
            },
            "realistic": {
                "balance": 24000.00,
                "retirement_age": 63,
                "years_to_retirement": 16,
                "growth_rate": 2.0,
                "total_contributions": 12000.00,
                "balance_without_contributions": 12000.00
            },
            "optimistic": {
                "balance": 28000.00,
                "retirement_age": 63,
                "years_to_retirement": 16,
                "growth_rate": 3.0,
                "total_contributions": 12000.00,
                "balance_without_contributions": 16000.00
            }
        }
    }
    ```
    """
    # Get pension with statements
    pension = pension_savings.get(db=db, id=id)
    if not pension:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Savings pension with ID {id} not found"
        )
    
    # Get member for retirement age
    member = pension.member
    if not member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot calculate scenarios without associated member"
        )
    
    # Calculate scenarios
    projection_service = PensionSavingsProjectionService()
    return projection_service.calculate_scenarios(
        pension=pension,
        member=member,
        reference_date=reference_date
    ) 