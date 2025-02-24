from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas
from app.api.v1 import deps
from app.crud import pension_company

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
    pension = pension_company.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Company Pension not found")
    return pension_company.update(db=db, db_obj=pension, obj_in=pension_in)

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