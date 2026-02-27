from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.v1 import deps
from app.crud.retirement_gap import retirement_gap as gap_crud
from app.crud.household import household as household_crud
from app.schemas.retirement_gap import (
    RetirementGapConfigCreate,
    RetirementGapConfigUpdate,
    RetirementGapConfigResponse,
    GapAnalysisResult,
)
from app.services.gap_analysis import gap_analysis_service

router = APIRouter()


# ── Gap Config CRUD ───────────────────────────────────────────────────────────

@router.get("/gap-config", response_model=List[RetirementGapConfigResponse])
def list_gap_configs(db: Session = Depends(deps.get_db)):
    """List all gap configurations across all household members."""
    return gap_crud.get_all(db)


@router.get("/gap-config/{member_id}", response_model=RetirementGapConfigResponse)
def get_gap_config(member_id: int, db: Session = Depends(deps.get_db)):
    """Get the gap configuration for a specific member."""
    config = gap_crud.get_by_member_id(db, member_id=member_id)
    if config is None:
        raise HTTPException(status_code=404, detail="Gap config not found for this member")
    return config


@router.post("/gap-config/{member_id}", response_model=RetirementGapConfigResponse, status_code=201)
def create_gap_config(
    member_id: int,
    data: RetirementGapConfigCreate,
    db: Session = Depends(deps.get_db),
):
    """Create a gap configuration for a member. Returns 409 if one already exists."""
    member = household_crud.get(db, id=member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    existing = gap_crud.get_by_member_id(db, member_id=member_id)
    if existing is not None:
        raise HTTPException(status_code=409, detail="Gap config already exists for this member. Use PUT to update.")
    return gap_crud.create_for_member(db, member_id=member_id, obj_in=data)


@router.put("/gap-config/{member_id}", response_model=RetirementGapConfigResponse)
def update_gap_config(
    member_id: int,
    data: RetirementGapConfigUpdate,
    db: Session = Depends(deps.get_db),
):
    """Update the gap configuration for a member."""
    config = gap_crud.get_by_member_id(db, member_id=member_id)
    if config is None:
        raise HTTPException(status_code=404, detail="Gap config not found for this member")
    return gap_crud.update(db, db_obj=config, obj_in=data)


@router.delete("/gap-config/{member_id}", status_code=204)
def delete_gap_config(member_id: int, db: Session = Depends(deps.get_db)):
    """Delete the gap configuration for a member."""
    config = gap_crud.get_by_member_id(db, member_id=member_id)
    if config is None:
        raise HTTPException(status_code=404, detail="Gap config not found for this member")
    gap_crud.remove(db, id=config.id)


# ── Gap Analysis ──────────────────────────────────────────────────────────────

@router.get("/gap-analysis/{member_id}", response_model=GapAnalysisResult)
def get_gap_analysis(member_id: int, db: Session = Depends(deps.get_db)):
    """
    Compute and return the full retirement gap analysis for a member.

    Requires a gap config to exist (POST /gap-config/{member_id} first).
    Returns 404 if no config is found.
    """
    try:
        return gap_analysis_service.compute(db, member_id=member_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
