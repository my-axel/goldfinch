from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.v1 import deps
from app.crud.pension_etf import pension_etf
from app.crud.pension_company import pension_company
from app.crud.pension_insurance import pension_insurance
from app.schemas.pension_etf import ETFPensionListSchema
from app.schemas.pension_company import CompanyPensionListSchema
from app.schemas.pension_insurance import InsurancePensionListSchema
import logging

# Use the app.api namespace to ensure logs go to the right place
logger = logging.getLogger("app.api.v1.endpoints.pension_summaries")

router = APIRouter(
    prefix="/pension-summaries",
    tags=["pension-summaries"],
    responses={404: {"description": "Not found"}},
)

@router.get("/etf", response_model=List[ETFPensionListSchema])
async def get_etf_pension_summaries(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    member_id: Optional[int] = None,
) -> List[ETFPensionListSchema]:
    """
    Get a lightweight list of ETF pensions with summary information.
    This endpoint is optimized for list views and returns only essential data.
    """
    return pension_etf.get_list(
        db=db, 
        skip=skip, 
        limit=limit, 
        member_id=member_id
    )

@router.get("/company", response_model=List[CompanyPensionListSchema])
async def get_company_pension_summaries(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    member_id: Optional[int] = None,
) -> List[CompanyPensionListSchema]:
    """
    Get a lightweight list of company pensions with summary information.
    This endpoint is optimized for list views and returns only essential data.
    """
    return pension_company.get_list(
        db=db, 
        skip=skip, 
        limit=limit, 
        member_id=member_id
    )

@router.get("/insurance", response_model=List[InsurancePensionListSchema])
async def get_insurance_pension_summaries(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    member_id: Optional[int] = None,
) -> List[InsurancePensionListSchema]:
    """
    Get a lightweight list of insurance pensions with summary information.
    This endpoint is optimized for list views and returns only essential data.
    """
    return pension_insurance.get_list(
        db=db, 
        skip=skip, 
        limit=limit, 
        member_id=member_id
    ) 