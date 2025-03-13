from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Union, Optional
from datetime import date
from app.api.v1 import deps
from app import crud, schemas
from app.models.enums import PensionType

router = APIRouter(tags=["pensions"])

@router.get("/member/{member_id}", response_model=List[Union[
    schemas.pension_etf.PensionETFResponse,
    schemas.pension_insurance.PensionInsuranceResponse,
    schemas.pension_company.PensionCompanyResponse
]])
def get_member_pensions(
    member_id: int,
    db: Session = Depends(deps.get_db),
):
    """Get all pensions for a member."""
    member = db.query(crud.household.HouseholdMember).get(member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member.pensions

@router.post("/{pension_id}/realize-historical")
def realize_historical_contributions(
    pension_id: int,
    end_date: Optional[date] = None,
    db: Session = Depends(deps.get_db)
):
    """
    Realize all planned contributions up to a specific date.
    If no end_date is provided, uses current date.
    """
    # Try to find the pension in each type
    pension_etf = crud.pension_etf.get(db=db, id=pension_id)
    if pension_etf:
        return crud.pension_etf.realize_historical_contributions(
            db=db,
            pension_id=pension_id,
            end_date=end_date
        )
        
    pension_insurance = crud.pension_insurance.get(db=db, id=pension_id)
    if pension_insurance:
        return crud.pension_insurance.realize_historical_contributions(
            db=db,
            pension_id=pension_id,
            end_date=end_date
        )
        
    pension_company = crud.pension_company.get(db=db, id=pension_id)
    if pension_company:
        return crud.pension_company.realize_historical_contributions(
            db=db,
            pension_id=pension_id,
            end_date=end_date
        )
        
    raise HTTPException(status_code=404, detail="Pension not found")

@router.get("/list", response_model=List[Union[
    schemas.pension_etf.PensionETFListResponse,
    schemas.pension_insurance.PensionInsuranceListResponse,
    schemas.pension_company.PensionCompanyListResponse
]])
def get_all_pension_lists(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user),
    member_id: Optional[int] = None,
):
    """Get a combined lightweight list of all pension types"""
    from app.crud.pension_etf import pension_etf
    from app.crud.pension_insurance import pension_insurance
    from app.crud.pension_company import pension_company
    
    # Get all pension types
    etf_pensions = pension_etf.get_list_by_owner(db=db, owner_id=current_user.id)
    insurance_pensions = pension_insurance.get_list_by_owner(db=db, owner_id=current_user.id)
    company_pensions = pension_company.get_list_by_owner(db=db, owner_id=current_user.id)
    
    # Filter by member_id if provided
    if member_id is not None:
        etf_pensions = [p for p in etf_pensions if p["member_id"] == member_id]
        insurance_pensions = [p for p in insurance_pensions if p["member_id"] == member_id]
        company_pensions = [p for p in company_pensions if p["member_id"] == member_id]
    
    # Combine all pension types
    return etf_pensions + insurance_pensions + company_pensions 