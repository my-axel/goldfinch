from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Union
from app.api.v1 import deps
from app.schemas.pension import (
    PensionResponse,
    ETFPensionCreate,
    InsurancePensionCreate,
    CompanyPensionCreate,
    ContributionBase,
    ETFPensionResponse,
    InsurancePensionResponse,
    CompanyPensionResponse,
    ETFPensionUpdate,
    InsurancePensionUpdate,
    CompanyPensionUpdate,
    PensionType
)
from app.crud.pension import pension_crud

router = APIRouter()

@router.get("", response_model=List[Union[ETFPensionResponse, InsurancePensionResponse, CompanyPensionResponse]])
def get_pensions(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    member_id: Optional[int] = None,
):
    """
    Retrieve pensions with their type-specific details.
    """
    filters = {"member_id": member_id} if member_id is not None else None
    pensions = pension_crud.get_pension_with_details(db, skip=skip, limit=limit, filters=filters)
    if not pensions:
        raise HTTPException(status_code=404, detail="No pensions found")
    return pensions

@router.get("/{pension_id}", response_model=Union[ETFPensionResponse, InsurancePensionResponse, CompanyPensionResponse])
def get_pension(
    pension_id: int,
    db: Session = Depends(deps.get_db)
):
    """
    Get a specific pension by ID with its type-specific details.
    """
    pensions = pension_crud.get_pension_with_details(db, filters={"id": pension_id}, limit=1)
    if not pensions:
        raise HTTPException(status_code=404, detail="Pension not found")
    return pensions[0]

@router.post("/etf", response_model=ETFPensionResponse)
def create_etf_pension(
    pension_in: ETFPensionCreate,
    db: Session = Depends(deps.get_db)
):
    """
    Create a new ETF-based pension plan.
    """
    return pension_crud.create_etf_pension(db, obj_in=pension_in)

@router.post("/insurance", response_model=PensionResponse)
def create_insurance_pension(
    pension_in: InsurancePensionCreate,
    db: Session = Depends(deps.get_db)
):
    """
    Create a new insurance-based pension plan.
    """
    return pension_crud.create_insurance_pension(db, obj_in=pension_in)

@router.post("/company", response_model=PensionResponse)
def create_company_pension(
    pension_in: CompanyPensionCreate,
    db: Session = Depends(deps.get_db)
):
    """
    Create a new company pension plan.
    """
    return pension_crud.create_company_pension(db, obj_in=pension_in)

@router.delete("/{pension_id}")
def delete_pension(
    pension_id: int,
    db: Session = Depends(deps.get_db)
):
    """
    Delete a pension plan.
    """
    pension = pension_crud.get(db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Pension not found")
    pension_crud.remove(db, id=pension_id)
    return {"message": "Pension deleted successfully"}

@router.post("/{pension_id}/contributions", response_model=ContributionBase)
def add_contribution(
    pension_id: int,
    contribution_in: ContributionBase,
    db: Session = Depends(deps.get_db)
):
    """
    Add a new contribution to a pension plan.
    """
    pension = pension_crud.get(db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Pension not found")
    return pension_crud.add_contribution(db, pension_id=pension_id, obj_in=contribution_in)

@router.get("/{pension_id}/contributions", response_model=List[ContributionBase])
def get_contributions(
    pension_id: int,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Get all contributions for a specific pension plan.
    """
    pension = pension_crud.get(db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Pension not found")
    return pension_crud.get_contributions(db, pension_id=pension_id, skip=skip, limit=limit)

@router.put("/etf/{pension_id}", response_model=ETFPensionResponse)
def update_etf_pension(
    pension_id: int,
    pension_in: ETFPensionUpdate,
    db: Session = Depends(deps.get_db)
):
    """
    Update an ETF-based pension plan.
    """
    pension = pension_crud.get(db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Pension not found")
    if pension.type != PensionType.ETF_PLAN:
        raise HTTPException(status_code=400, detail="Pension is not an ETF plan")
    return pension_crud.update_etf_pension(db, db_obj=pension, obj_in=pension_in)

@router.put("/insurance/{pension_id}", response_model=InsurancePensionResponse)
def update_insurance_pension(
    pension_id: int,
    pension_in: InsurancePensionUpdate,
    db: Session = Depends(deps.get_db)
):
    """
    Update an insurance-based pension plan.
    """
    pension = pension_crud.get(db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Pension not found")
    if pension.type != PensionType.INSURANCE:
        raise HTTPException(status_code=400, detail="Pension is not an insurance plan")
    return pension_crud.update_insurance_pension(db, db_obj=pension, obj_in=pension_in)

@router.put("/company/{pension_id}", response_model=CompanyPensionResponse)
def update_company_pension(
    pension_id: int,
    pension_in: CompanyPensionUpdate,
    db: Session = Depends(deps.get_db)
):
    """
    Update a company pension plan.
    """
    pension = pension_crud.get(db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="Pension not found")
    if pension.type != PensionType.COMPANY:
        raise HTTPException(status_code=400, detail="Pension is not a company plan")
    return pension_crud.update_company_pension(db, db_obj=pension, obj_in=pension_in) 