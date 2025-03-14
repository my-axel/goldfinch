from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas
from app.api.v1 import deps
from app.crud.pension_company import pension_company
from app.schemas.pension_company import CompanyPensionListSchema
import logging

# Use the app.api namespace to ensure logs go to the right place
logger = logging.getLogger("app.api.v1.endpoints.pension.company")

router = APIRouter()

@router.post(
    "",
    response_model=schemas.pension_company.PensionCompanyResponse,
    status_code=201,
    responses={
        201: {"description": "Company pension created successfully"},
        422: {"description": "Validation error"}
    }
)
def create_company_pension(
    *,
    db: Session = Depends(deps.get_db),
    pension_in: schemas.pension_company.PensionCompanyCreate,
) -> schemas.pension_company.PensionCompanyResponse:
    """Create a new company pension."""
    return pension_company.create(db=db, obj_in=pension_in)

@router.get("/{pension_id}", response_model=schemas.pension_company.PensionCompanyResponse)
def get_company_pension(
    pension_id: int,
    db: Session = Depends(deps.get_db),
) -> schemas.pension_company.PensionCompanyResponse:
    """Get a company pension by ID."""
    pension = pension_company.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Company Pension not found")
    return pension

@router.put("/{pension_id}", response_model=schemas.pension_company.PensionCompanyResponse)
def update_company_pension(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    pension_in: schemas.pension_company.PensionCompanyUpdate,
) -> schemas.pension_company.PensionCompanyResponse:
    """Update a company pension."""
    logger.info(f"API: Updating company pension {pension_id}")
    
    try:
        # Check if pension exists
        pension = pension_company.get(db=db, id=pension_id)
        if not pension:
            logger.warning(f"API: Company Pension {pension_id} not found")
            raise HTTPException(status_code=404, detail="Company Pension not found")
        
        # Log the pension data being sent for update
        logger.debug(f"API: Pension update data: {pension_in.dict(exclude_unset=True)}")
        
        # Call the CRUD operation with the new signature
        updated_pension = pension_company.update(
            db=db, 
            db_obj=pension, 
            obj_in=pension_in
        )
        
        # Log successful update
        logger.info(f"API: Company pension updated successfully. Pension ID: {updated_pension.id}")
        
        # Return the updated pension
        return updated_pension
        
    except Exception as e:
        logger.error(f"API: Failed to update company pension: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update company pension: {str(e)}",
        )

@router.delete("/{pension_id}")
def delete_company_pension(
    pension_id: int,
    db: Session = Depends(deps.get_db),
) -> dict:
    """Delete a company pension."""
    pension = pension_company.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Company Pension not found")
    pension_company.remove(db=db, id=pension_id)
    return {"ok": True}

@router.post("/{pension_id}/contribution-history", response_model=schemas.pension_company.ContributionHistoryResponse)
def create_company_contribution_history(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    contribution_in: schemas.pension_company.ContributionHistoryCreate,
) -> schemas.pension_company.ContributionHistoryResponse:
    """Record a contribution history entry for company pension."""
    return pension_company.create_contribution_history(
        db=db, pension_id=pension_id, obj_in=contribution_in
    )

@router.get("", response_model=List[schemas.pension_company.PensionCompanyResponse])
def list_company_pensions(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    member_id: int | None = None,
) -> List[schemas.pension_company.PensionCompanyResponse]:
    """List all company pensions."""
    filters = {}
    if member_id is not None:
        filters["member_id"] = member_id
    return pension_company.get_multi(db, skip=skip, limit=limit, filters=filters)

@router.put("/{pension_id}/status", response_model=schemas.pension_company.PensionCompanyResponse)
def update_company_pension_status(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    status_in: schemas.pension_company.PensionStatusUpdate,
) -> schemas.pension_company.PensionCompanyResponse:
    """Update the status of a company pension."""
    pension = pension_company.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Company Pension not found")
    return pension_company.update_status(db=db, db_obj=pension, obj_in=status_in)

@router.post(
    "/{pension_id}/statements",
    response_model=schemas.pension_company.PensionCompanyStatementResponse,
    status_code=201,
    responses={
        201: {"description": "Statement created successfully"},
        404: {"description": "Company Pension not found"},
        422: {"description": "Validation error"}
    }
)
def create_company_pension_statement(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    statement_in: schemas.pension_company.PensionCompanyStatementCreate,
) -> schemas.pension_company.PensionCompanyStatementResponse:
    """Create a new statement for a company pension."""
    pension = pension_company.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Company Pension not found")
    return pension_company.create_statement(db=db, pension_id=pension_id, obj_in=statement_in)

@router.get(
    "/{pension_id}/statements",
    response_model=List[schemas.pension_company.PensionCompanyStatementResponse],
    responses={
        200: {"description": "List of statements"},
        404: {"description": "Company Pension not found"}
    }
)
def list_company_pension_statements(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
) -> List[schemas.pension_company.PensionCompanyStatementResponse]:
    """Get all statements for a company pension."""
    pension = pension_company.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Company Pension not found")
    return pension_company.get_statements(db=db, pension_id=pension_id)

@router.get(
    "/{pension_id}/statements/latest",
    response_model=schemas.pension_company.PensionCompanyStatementResponse,
    responses={
        200: {"description": "Latest statement"},
        404: {"description": "Company Pension not found or no statements available"}
    }
)
def get_latest_company_pension_statement(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
) -> schemas.pension_company.PensionCompanyStatementResponse:
    """Get the latest statement for a company pension."""
    pension = pension_company.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Company Pension not found")
    
    latest_statement = pension_company.get_latest_statement(db=db, pension_id=pension_id)
    if not latest_statement:
        raise HTTPException(status_code=404, detail="No statements found for this pension")
    
    return latest_statement

@router.get(
    "/{pension_id}/statements/{statement_id}",
    response_model=schemas.pension_company.PensionCompanyStatementResponse,
    responses={
        200: {"description": "Statement details"},
        404: {"description": "Company Pension or Statement not found"}
    }
)
def get_company_pension_statement(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    statement_id: int,
) -> schemas.pension_company.PensionCompanyStatementResponse:
    """Get a specific statement for a company pension."""
    pension = pension_company.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Company Pension not found")
    
    statement = pension_company.get_statement(db=db, statement_id=statement_id)
    if not statement or statement.pension_id != pension_id:
        raise HTTPException(status_code=404, detail="Statement not found")
    
    return statement

@router.put(
    "/{pension_id}/statements/{statement_id}",
    response_model=schemas.pension_company.PensionCompanyStatementResponse,
    responses={
        200: {"description": "Statement updated"},
        404: {"description": "Company Pension or Statement not found"},
        422: {"description": "Validation error"}
    }
)
def update_company_pension_statement(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    statement_id: int,
    statement_in: schemas.pension_company.PensionCompanyStatementUpdate,
) -> schemas.pension_company.PensionCompanyStatementResponse:
    """Update a statement for a company pension."""
    logger.info(f"API: Updating statement {statement_id} for pension {pension_id}")
    
    try:
        # Check if pension exists
        pension = pension_company.get(db=db, id=pension_id)
        if not pension:
            logger.warning(f"API: Company Pension {pension_id} not found")
            raise HTTPException(status_code=404, detail="Company Pension not found")
        
        # Check if statement exists and belongs to the pension
        statement = pension_company.get_statement(db=db, statement_id=statement_id)
        if not statement or statement.pension_id != pension_id:
            logger.warning(f"API: Statement {statement_id} not found for pension {pension_id}")
            raise HTTPException(status_code=404, detail="Statement not found")
        
        # Log the statement data being sent for update
        update_data = statement_in.dict(exclude_unset=True)
        logger.debug(f"API: Statement update data: {update_data}")
        
        # Log retirement projections specifically
        if "retirement_projections" in update_data:
            projections = update_data["retirement_projections"]
            logger.debug(f"API: Statement update includes {len(projections)} retirement projections")
            for i, proj in enumerate(projections):
                logger.debug(f"API: Projection {i+1}: retirement_age={proj.get('retirement_age')}, monthly_payout={proj.get('monthly_payout')}, total_capital={proj.get('total_capital')}")
        else:
            logger.debug("API: Statement update does not include retirement projections")
        
        # Call the CRUD operation with the new signature
        updated_statement = pension_company.update_statement(
            db=db, 
            statement_id=statement_id,
            obj_in=statement_in
        )
        
        # Log successful update
        logger.info(f"API: Statement updated successfully. Statement ID: {updated_statement.id}")
        logger.debug(f"API: Updated statement has {len(updated_statement.retirement_projections)} retirement projections")
        
        # Return the updated statement
        return updated_statement
        
    except Exception as e:
        logger.error(f"API: Failed to update statement: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update statement: {str(e)}"
        )

@router.delete(
    "/{pension_id}/statements/{statement_id}",
    response_model=dict,
    responses={
        200: {"description": "Statement deleted"},
        404: {"description": "Company Pension or Statement not found"}
    }
)
def delete_company_pension_statement(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    statement_id: int,
) -> dict:
    """Delete a statement for a company pension."""
    logger.info(f"API: Deleting statement {statement_id} for pension {pension_id}")
    
    try:
        # Check if pension exists
        pension = pension_company.get(db=db, id=pension_id)
        if not pension:
            logger.warning(f"API: Company Pension {pension_id} not found")
            raise HTTPException(status_code=404, detail="Company Pension not found")
        
        # Check if statement exists and belongs to the pension
        statement = pension_company.get_statement(db=db, statement_id=statement_id)
        if not statement or statement.pension_id != pension_id:
            logger.warning(f"API: Statement {statement_id} not found for pension {pension_id}")
            raise HTTPException(status_code=404, detail="Statement not found")
        
        # Delete the statement using the CRUD method
        if not pension_company.remove_statement(db=db, statement_id=statement_id):
            raise HTTPException(status_code=404, detail="Statement not found")
        
        logger.info(f"API: Successfully deleted statement {statement_id}")
        return {"ok": True}
        
    except Exception as e:
        logger.error(f"API: Failed to delete statement: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete statement: {str(e)}"
        ) 