from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api.v1 import deps
from app.crud.pension_insurance import pension_insurance
from app import schemas

router = APIRouter(tags=["insurance-pensions"])

@router.post("/", response_model=schemas.pension_insurance.PensionInsuranceResponse)
def create_insurance_pension(
    *,
    db: Session = Depends(deps.get_db),
    pension_in: schemas.pension_insurance.PensionInsuranceCreate,
    member_id: int
) -> schemas.pension_insurance.PensionInsuranceResponse:
    """Create a new insurance pension."""
    return pension_insurance.create(db=db, obj_in=pension_in, member_id=member_id)

@router.get("/{pension_id}", response_model=schemas.pension_insurance.PensionInsuranceResponse)
def get_insurance_pension(
    pension_id: int,
    db: Session = Depends(deps.get_db),
) -> schemas.pension_insurance.PensionInsuranceResponse:
    """Get insurance pension by ID."""
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
    """Update insurance pension."""
    pension = pension_insurance.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Insurance Pension not found")
    return pension_insurance.update(db=db, db_obj=pension, obj_in=pension_in)

@router.delete("/{pension_id}")
def delete_insurance_pension(
    pension_id: int,
    db: Session = Depends(deps.get_db),
) -> dict:
    """Delete insurance pension."""
    pension = pension_insurance.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Insurance Pension not found")
    pension_insurance.remove(db=db, id=pension_id)
    return {"ok": True}

@router.post("/{pension_id}/contribution-plan", response_model=schemas.pension_insurance.ContributionPlanResponse)
def create_insurance_contribution_plan(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    contribution_in: schemas.pension_insurance.ContributionPlanCreate,
) -> schemas.pension_insurance.ContributionPlanResponse:
    """Create a contribution plan for insurance pension."""
    return pension_insurance.create_contribution_plan(
        db=db, pension_id=pension_id, obj_in=contribution_in
    )

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
    member_id: int | None = None,
) -> List[schemas.pension_insurance.PensionInsuranceResponse]:
    """List all insurance pensions."""
    filters = {}
    if member_id is not None:
        filters["member_id"] = member_id
    return pension_insurance.get_multi(db, skip=skip, limit=limit, filters=filters) 