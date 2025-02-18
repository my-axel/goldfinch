from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.api.v1 import deps
from app.crud.pension_etf import pension_etf
from app import schemas
from app.schemas.task import TaskStatusResponse
from app.tasks.etf_pension import process_new_etf_pension
from app.models.task import TaskStatus

router = APIRouter(tags=["etf-pensions"])

@router.post("/", response_model=schemas.pension_etf.PensionETFResponse)
def create_etf_pension(
    *,
    db: Session = Depends(deps.get_db),
    pension_in: schemas.pension_etf.PensionETFCreate,
    background_tasks: BackgroundTasks
) -> schemas.pension_etf.PensionETFResponse:
    """Create a new ETF pension."""
    # Create the pension first
    pension = pension_etf.create(db=db, obj_in=pension_in, member_id=pension_in.member_id)
    
    # Create initial task status
    task = TaskStatus(
        task_type="etf_pension_processing",
        status="pending",
        resource_id=pension.id
    )
    db.add(task)
    db.commit()
    
    # Add background task to fetch prices and realize contributions
    background_tasks.add_task(process_new_etf_pension, pension.id)
    
    return pension

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
    """Delete ETF pension."""
    pension = pension_etf.get(db=db, id=pension_id)
    if not pension:
        raise HTTPException(status_code=404, detail="ETF Pension not found")
    pension_etf.remove(db=db, id=pension_id)
    return {"ok": True}

@router.post("/{pension_id}/contribution-plan", response_model=schemas.pension_etf.ContributionPlanResponse)
def create_etf_contribution_plan(
    *,
    db: Session = Depends(deps.get_db),
    pension_id: int,
    contribution_in: schemas.pension_etf.ContributionPlanCreate,
) -> schemas.pension_etf.ContributionPlanResponse:
    """Create a contribution plan for ETF pension."""
    return pension_etf.create_contribution_plan(
        db=db, pension_id=pension_id, obj_in=contribution_in
    )

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