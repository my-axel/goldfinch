from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.v1 import deps
from app.crud.pension_etf import pension_etf
from app.crud.etf import etf_crud
from app import schemas
from app.schemas.pension_etf import ETFPensionListSchema
from app.schemas.task import TaskStatusResponse
from app.tasks.etf_pension import process_new_etf_pension, calculate_etf_pension_value
from app.models.task import TaskStatus
from app.models.pension_etf import PensionETF
import logging

logger = logging.getLogger(__name__)

# Make the router more explicit
router = APIRouter(
    prefix="",
    tags=["etf-pensions"],
    responses={404: {"description": "Not found"}},
)

@router.post(
    "",
    response_model=schemas.pension_etf.PensionETFResponse,
    status_code=201,
    responses={
        201: {"description": "ETF pension created successfully"},
        422: {"description": "Validation error"}
    }
)
def create_etf_pension(
    *,
    db: Session = Depends(deps.get_db),
    pension_in: schemas.pension_etf.PensionETFCreate,
) -> schemas.pension_etf.PensionETFResponse:
    """Create a new ETF pension."""
    logger.info(f"Creating ETF pension with realize_historical_contributions={pension_in.realize_historical_contributions}")
    
    # Get or create the ETF with minimal data
    etf = etf_crud.get_or_create(db=db, id=pension_in.etf_id)
    
    try:
        # Attempt to create pension normally
        pension = pension_etf.create(db=db, obj_in=pension_in)
        logger.info(f"Created pension with ID {pension.id}")
        
        # Create initial task status
        task_metadata = {"realize_historical_contributions": pension_in.realize_historical_contributions}
        task = TaskStatus(
            task_type="etf_pension_processing",
            status="pending",
            resource_id=pension.id,
            task_metadata=task_metadata
        )
        db.add(task)
        db.commit()
        logger.info(f"Created task with metadata: {task_metadata}")
        
        # Queue the Celery task
        process_new_etf_pension.delay(pension.id)
        
        return pension
    except ValueError as e:
        error_msg = str(e)
        if "No price data available for ETF" in error_msg and pension_in.existing_units and pension_in.existing_units > 0:
            logger.info(f"Creating ETF pension with pending value calculation: {error_msg}")
            
            # Create pension with current_value = 0
            pension = pension_etf.create_with_zero_value(db=db, obj_in=pension_in)
            
            # Create initial task status
            task_metadata = {"realize_historical_contributions": pension_in.realize_historical_contributions}
            task = TaskStatus(
                task_type="etf_pension_processing",
                status="pending",
                resource_id=pension.id,
                task_metadata=task_metadata
            )
            db.add(task)
            db.commit()
            
            # Schedule calculation task
            calculate_etf_pension_value.delay(pension.id)
            
            # Also queue the normal processing task
            process_new_etf_pension.delay(pension.id)
            
            return pension
        else:
            # Re-raise other errors
            raise

@router.get("/{pension_id}", response_model=schemas.pension_etf.PensionETFResponse)
def get_etf_pension(
    pension_id: int,
    db: Session = Depends(deps.get_db),
) -> schemas.pension_etf.PensionETFResponse:
    """Get ETF pension by ID."""
    pension = pension_etf.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="ETF Pension not found")
    return pension

@router.put("/{pension_id}", response_model=schemas.pension_etf.PensionETFResponse)
def update_etf_pension(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    pension_in: schemas.pension_etf.PensionETFUpdate,
) -> schemas.pension_etf.PensionETFResponse:
    """Update ETF pension."""
    pension = pension_etf.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="ETF Pension not found")
    return pension_etf.update(db=db, db_obj=pension, obj_in=pension_in)

@router.delete("/{pension_id}")
def delete_etf_pension(
    pension_id: int,
    db: Session = Depends(deps.get_db),
) -> dict:
    """Delete ETF pension and its associated ETF if no longer used."""
    pension = pension_etf.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="ETF Pension not found")
    
    # Store ETF ID before deleting the pension
    etf_id = pension.etf_id
    
    # Delete the pension
    pension_etf.remove(db=db, id=pension_id)
    
    # Check if the ETF is used by any other pension
    other_pensions = db.query(PensionETF).filter(
        PensionETF.etf_id == etf_id,
        PensionETF.id != pension_id
    ).first()
    
    # If ETF is not used by any other pension, delete it
    if not other_pensions:
        etf = etf_crud.get(db=db, id=etf_id)
        if etf:
            etf_crud.remove(db=db, id=etf_id)
    
    return {"ok": True}

@router.post("/{pension_id}/contribution-history", response_model=schemas.pension_etf.ContributionHistoryResponse)
def create_etf_contribution_history(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    contribution_in: schemas.pension_etf.ContributionHistoryCreate,
) -> schemas.pension_etf.ContributionHistoryResponse:
    """Record a contribution history entry for ETF pension."""
    return pension_etf.create_contribution_history(
        db=db, pension_id=pension_id, obj_in=contribution_in
    )

@router.post("/{pension_id}/one-time-investment", response_model=schemas.pension_etf.ContributionHistoryResponse)
def create_one_time_investment(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    investment_in: schemas.pension.OneTimeInvestmentCreate,
) -> schemas.pension_etf.ContributionHistoryResponse:
    """Record a one-time investment for ETF pension."""
    # First check if the pension exists
    pension = pension_etf.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="ETF Pension not found")
    
    # Create a contribution history entry for the one-time investment
    contribution_data = schemas.pension_etf.ContributionHistoryCreate(
        amount=investment_in.amount,
        contribution_date=investment_in.investment_date,
        note=investment_in.note,
        is_manual=True
    )
    
    return pension_etf.create_contribution_history(
        db=db, pension_id=pension_id, obj_in=contribution_data
    )

@router.get("", response_model=List[schemas.pension_etf.PensionETFResponse])
def list_etf_pensions(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    member_id: int | None = None,
) -> List[schemas.pension_etf.PensionETFResponse]:
    """List all ETF pensions."""
    filters = {}
    if member_id is not None:
        filters["member_id"] = member_id
    return pension_etf.get_multi(db, skip=skip, limit=limit, filters=filters)

@router.get("/{pension_id}/task-status", response_model=TaskStatusResponse)
def get_pension_task_status(
    pension_id: int,
    db: Session = Depends(deps.get_db),
) -> TaskStatusResponse:
    """Get the status of the ETF pension processing task."""
    task = db.query(TaskStatus).filter(
        TaskStatus.resource_id == pension_id,
        TaskStatus.task_type == "etf_pension_processing"
    ).order_by(TaskStatus.created_at.desc()).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task status not found")
        
    return task

@router.put("/{pension_id}/status", response_model=schemas.pension_etf.PensionETFResponse)
def update_etf_pension_status(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    status_in: schemas.pension_etf.PensionStatusUpdate,
) -> schemas.pension_etf.PensionETFResponse:
    """Update the status of an ETF pension."""
    pension = pension_etf.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="ETF Pension not found")
    
    return pension_etf.update_status(db=db, db_obj=pension, obj_in=status_in)

@router.get("/{pension_id}/statistics", response_model=schemas.pension_etf.PensionStatistics)
def get_etf_pension_statistics(
    pension_id: int,
    db: Session = Depends(deps.get_db),
) -> schemas.pension_etf.PensionStatistics:
    """Get statistics for an ETF pension."""
    return pension_etf.get_statistics(db=db, pension_id=pension_id) 