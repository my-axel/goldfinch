from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
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
    ETFPensionResponseWithHistory,
    InsurancePensionResponse,
    CompanyPensionResponse,
    ETFPensionUpdate,
    InsurancePensionUpdate,
    CompanyPensionUpdate,
    PensionType,
    OneTimeInvestmentCreate
)
from app.crud.pension import pension_crud
import logging
from decimal import Decimal, InvalidOperation
from datetime import date

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("", response_model=List[Union[ETFPensionResponse, InsurancePensionResponse, CompanyPensionResponse]])
def get_pensions(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    member_id: Optional[int] = None,
    include_historical_prices: bool = False,
):
    """
    Retrieve pensions with their type-specific details.
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        member_id: Optional member ID to filter by
        include_historical_prices: Whether to include historical ETF prices (defaults to False)
    """
    filters = {"member_id": member_id} if member_id is not None else None
    pensions = pension_crud.get_pension_with_details(
        db, 
        skip=skip, 
        limit=limit, 
        filters=filters,
        include_historical_prices=include_historical_prices
    )
    return pensions

@router.get("/{pension_id}", response_model=Union[ETFPensionResponseWithHistory, InsurancePensionResponse, CompanyPensionResponse])
def get_pension(
    pension_id: int,
    include_historical_prices: bool = False,
    db: Session = Depends(deps.get_db)
):
    """
    Get a specific pension by ID with its type-specific details.
    
    Args:
        pension_id: ID of the pension to retrieve
        include_historical_prices: Whether to include historical ETF prices (defaults to False)
    """
    pensions = pension_crud.get_pension_with_details(
        db, 
        filters={"id": pension_id}, 
        limit=1,
        include_historical_prices=include_historical_prices
    )
    if not pensions:
        raise HTTPException(status_code=404, detail="Pension not found")
    return pensions[0]

@router.post("/etf", response_model=ETFPensionResponse)
def create_etf_pension(
    pension_in: ETFPensionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db)
):
    """
    Create a new ETF-based pension plan.
    The ETF's historical prices will be fetched asynchronously in the background.
    """
    return pension_crud.create_etf_pension(
        db, 
        obj_in=pension_in,
        background_tasks=background_tasks
    )

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

@router.post("/{pension_id}/one-time-investment", response_model=ContributionBase)
def add_one_time_investment(
    pension_id: int,
    investment_in: OneTimeInvestmentCreate,
    db: Session = Depends(deps.get_db)
):
    """
    Add a one-time investment to an ETF pension plan.
    This is useful for special cases like investing bonuses or making extra investments.
    
    The investment will be:
    - Marked as realized (immediate investment)
    - Have a note indicating it's a one-time investment
    - Calculate units based on the investment date's price
    - Update the pension's total units and current value
    """
    try:
        logger.info(f"Processing one-time investment for pension {pension_id}: {investment_in}")
        
        # Validate amount is positive
        if investment_in.amount <= 0:
            raise ValueError("Investment amount must be positive")

        contribution = pension_crud.add_one_time_investment(
            db,
            pension_id=pension_id,
            amount=investment_in.amount,
            investment_date=investment_in.investment_date,
            user_note=investment_in.note
        )
        return contribution
    except HTTPException as e:
        logger.error(f"HTTP error processing one-time investment: {str(e)}")
        raise
    except InvalidOperation as e:
        logger.error(f"Invalid decimal operation: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid amount format: {str(e)}"
        )
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error processing one-time investment: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )

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

@router.post("/{pension_id}/realize-historical", response_model=List[ContributionBase])
def realize_historical_contributions(
    pension_id: int,
    end_date: Optional[date] = None,
    db: Session = Depends(deps.get_db)
):
    """
    Realize all planned contributions up to a specific date.
    If no end_date is provided, uses current date.
    
    This will:
    1. Find all planned contributions up to the specified date
    2. Calculate units based on historical prices
    3. Mark contributions as realized
    4. Update pension's total units and current value
    
    Returns the list of realized contributions.
    """
    try:
        logger.info(f"Realizing historical contributions for pension {pension_id} up to {end_date or 'today'}")
        
        realized = pension_crud.realize_historical_contributions(
            db,
            pension_id=pension_id,
            end_date=end_date
        )
        
        return realized
        
    except HTTPException as e:
        logger.error(f"HTTP error realizing historical contributions: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error realizing historical contributions: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        ) 