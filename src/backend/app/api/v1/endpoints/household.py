from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.crud import household
from app.schemas.household import HouseholdMemberResponse, HouseholdMemberCreate
from app.db.session import get_db
from app.api.v1.deps import validate_member_exists

router = APIRouter()

@router.get("", response_model=List[HouseholdMemberResponse])
def read_members(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        return household.get_multi(db, skip=skip, limit=limit)
    except Exception as e:
        # Log the error here if you have logging set up
        return []

@router.post("", response_model=HouseholdMemberResponse)
def create_member(member: HouseholdMemberCreate, db: Session = Depends(get_db)):
    return household.create(db=db, obj_in=member)

@router.get("/{member_id}", response_model=HouseholdMemberResponse)
def read_member(member_id: int, db: Session = Depends(get_db)):
    db_member = household.get(db=db, id=member_id)
    if db_member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return db_member

@router.put("/{member_id}", response_model=HouseholdMemberResponse)
def update_member(member_id: int, member: HouseholdMemberCreate, db: Session = Depends(get_db)):
    db_member = household.get(db=db, id=member_id)
    if db_member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return household.update(db=db, db_obj=db_member, obj_in=member)

@router.delete("/{member_id}")
def delete_member(member_id: int, db: Session = Depends(get_db)):
    db_member = household.get(db=db, id=member_id)
    if db_member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    household.remove(db=db, id=member_id)
    return {"ok": True} 