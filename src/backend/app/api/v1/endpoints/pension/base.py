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