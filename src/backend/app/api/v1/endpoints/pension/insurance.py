from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas
from app.api.v1 import deps
from app.crud.pension_insurance import pension_insurance
from app.schemas.pension_insurance import InsurancePensionListSchema

router = APIRouter()

@router.post(
    "",
    response_model=schemas.pension_insurance.PensionInsuranceResponse,
    status_code=201,
    responses={
        201: {"description": "Insurance pension created successfully"},
        422: {"description": "Validation error"}
    }
)
def create_insurance_pension(
    *,
    db: Session = Depends(deps.get_db),
    pension_in: schemas.pension_insurance.PensionInsuranceCreate,
) -> schemas.pension_insurance.PensionInsuranceResponse:
    """Create a new insurance pension."""
    return pension_insurance.create(db=db, obj_in=pension_in)

@router.get("/{pension_id}", response_model=schemas.pension_insurance.PensionInsuranceResponse)
def get_insurance_pension(
    pension_id: int,
    db: Session = Depends(deps.get_db),
) -> schemas.pension_insurance.PensionInsuranceResponse:
    """Get an insurance pension by ID."""
    pension = pension_insurance.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Insurance Pension not found")
    return pension

@router.put("/{pension_id}", response_model=schemas.pension_insurance.PensionInsuranceResponse)
def update_insurance_pension(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    pension_in: schemas.pension_insurance.PensionInsuranceUpdate,
) -> schemas.pension_insurance.PensionInsuranceResponse:
    """Update an insurance pension."""
    pension = pension_insurance.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Insurance Pension not found")
    return pension_insurance.update(db=db, db_obj=pension, obj_in=pension_in)

@router.delete("/{pension_id}")
def delete_insurance_pension(
    pension_id: int,
    db: Session = Depends(deps.get_db),
) -> dict:
    """Delete an insurance pension."""
    pension = pension_insurance.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Insurance Pension not found")
    pension_insurance.remove(db=db, id=pension_id)
    return {"ok": True}

@router.post("/{pension_id}/contribution-history", response_model=schemas.pension_insurance.ContributionHistoryResponse)
def create_insurance_contribution_history(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    contribution_in: schemas.pension_insurance.ContributionHistoryCreate,
) -> schemas.pension_insurance.ContributionHistoryResponse:
    """Record a contribution history entry for insurance pension."""
    return pension_insurance.create_contribution_history(
        db=db, pension_id=pension_id, obj_in=contribution_in
    )

@router.get("", response_model=List[schemas.pension_insurance.PensionInsuranceResponse])
def list_insurance_pensions(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    member_id: Optional[int] = None,
) -> List[schemas.pension_insurance.PensionInsuranceResponse]:
    """List all insurance pensions."""
    filters = {}
    if member_id is not None:
        filters["member_id"] = member_id
    return pension_insurance.get_multi(db, skip=skip, limit=limit, filters=filters)

@router.put("/{pension_id}/status", response_model=schemas.pension_insurance.PensionInsuranceResponse)
def update_insurance_pension_status(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    status_in: schemas.pension_insurance.PensionStatusUpdate,
) -> schemas.pension_insurance.PensionInsuranceResponse:
    """Update the status of an insurance pension."""
    pension = pension_insurance.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Insurance Pension not found")
    return pension_insurance.update_status(db=db, db_obj=pension, obj_in=status_in)

# New endpoints for statements, benefits, and projections

@router.post(
    "/{pension_id}/statements",
    response_model=schemas.pension_insurance.StatementResponse,
    status_code=201,
    responses={
        201: {"description": "Statement created successfully"},
        404: {"description": "Insurance Pension not found"},
        422: {"description": "Validation error"}
    }
)
def create_insurance_statement(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    statement_in: schemas.pension_insurance.StatementCreate,
) -> schemas.pension_insurance.StatementResponse:
    """Create a new statement for an insurance pension."""
    try:
        return pension_insurance.create_statement(
            db=db, pension_id=pension_id, obj_in=statement_in
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get(
    "/{pension_id}/statements",
    response_model=List[schemas.pension_insurance.StatementResponse],
    responses={
        200: {"description": "List of statements retrieved successfully"},
        404: {"description": "Insurance Pension not found"}
    }
)
def list_insurance_statements(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
) -> List[schemas.pension_insurance.StatementResponse]:
    """List all statements for an insurance pension."""
    pension = pension_insurance.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Insurance Pension not found")
    return pension.statements

@router.get(
    "/{pension_id}/statements/latest",
    response_model=schemas.pension_insurance.StatementResponse,
    responses={
        200: {"description": "Latest statement retrieved successfully"},
        404: {"description": "Insurance Pension or statement not found"}
    }
)
def get_latest_insurance_statement(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
) -> schemas.pension_insurance.StatementResponse:
    """Get the latest statement for an insurance pension."""
    statement = pension_insurance.get_latest_statement(db=db, pension_id=pension_id)
    if not statement:
        raise HTTPException(status_code=404, detail="No statements found for this pension")
    return statement

@router.delete(
    "/statements/{statement_id}",
    responses={
        200: {"description": "Statement deleted successfully"},
        404: {"description": "Statement not found"}
    }
)
def delete_insurance_statement(
    *,
    db: Session = Depends(deps.get_db),
    statement_id: int,
) -> dict:
    """Delete a statement from an insurance pension."""
    success = pension_insurance.delete_statement(db=db, statement_id=statement_id)
    if not success:
        raise HTTPException(status_code=404, detail="Statement not found")
    return {"ok": True}

@router.put(
    "/{pension_id}/statements/{statement_id}",
    response_model=schemas.pension_insurance.StatementResponse,
    responses={
        200: {"description": "Statement updated successfully"},
        404: {"description": "Insurance Pension or Statement not found"},
        422: {"description": "Validation error"}
    }
)
def update_insurance_statement(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    statement_id: int,
    statement_in: schemas.pension_insurance.StatementUpdate,
) -> schemas.pension_insurance.StatementResponse:
    """Update a statement for an insurance pension."""
    # Check if pension exists
    pension = pension_insurance.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Insurance Pension not found")
    
    # Check if statement exists and belongs to the pension
    statement = pension_insurance.get_statement(db=db, statement_id=statement_id)
    if not statement or statement.pension_insurance_id != pension_id:
        raise HTTPException(status_code=404, detail="Statement not found")
    
    # Update the statement
    updated_statement = pension_insurance.update_statement(
        db=db,
        statement_id=statement_id,
        obj_in=statement_in
    )
    
    return updated_statement

@router.post(
    "/{pension_id}/benefits",
    response_model=schemas.pension_insurance.BenefitResponse,
    status_code=201,
    responses={
        201: {"description": "Benefit created successfully"},
        404: {"description": "Insurance Pension not found"},
        422: {"description": "Validation error"}
    }
)
def create_insurance_benefit(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    benefit_in: schemas.pension_insurance.BenefitCreate,
) -> schemas.pension_insurance.BenefitResponse:
    """
    Create a new benefit for an insurance pension.
    
    NOTE: This endpoint is currently not used by the frontend.
    The PensionInsuranceBenefit model exists in the database but is not populated through the UI.
    Currently, only the total_benefits field in PensionInsuranceStatement is used as a summary value.
    """
    try:
        return pension_insurance.create_benefit(
            db=db, pension_id=pension_id, obj_in=benefit_in
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get(
    "/{pension_id}/benefits",
    response_model=List[schemas.pension_insurance.BenefitResponse],
    responses={
        200: {"description": "List of benefits retrieved successfully"},
        404: {"description": "Insurance Pension not found"}
    }
)
def list_insurance_benefits(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
) -> List[schemas.pension_insurance.BenefitResponse]:
    """
    List all benefits for an insurance pension.
    
    NOTE: This endpoint is currently not used by the frontend.
    The PensionInsuranceBenefit model exists in the database but is not populated through the UI.
    Currently, only the total_benefits field in PensionInsuranceStatement is used as a summary value.
    """
    pension = pension_insurance.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Insurance Pension not found")
    return pension.benefits 