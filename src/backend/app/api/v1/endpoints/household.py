from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.crud import household
from app.schemas.household import HouseholdMember, HouseholdMemberCreate
from app.db.session import get_db
from app.api.v1.deps import validate_member_exists

router = APIRouter()

@router.get("", response_model=List[HouseholdMember])
def read_members(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    members = household.get_members(db, skip=skip, limit=limit)
    return members

@router.post("", response_model=HouseholdMember)
def create_member(member: HouseholdMemberCreate, db: Session = Depends(get_db)):
    return household.create_member(db, member)

@router.get("/{member_id}", response_model=HouseholdMember)
def read_member(member_id: int, db: Session = Depends(get_db)):
    db_member = household.get_member(db, member_id)
    if db_member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return db_member

@router.put("/{member_id}", response_model=HouseholdMember)
def update_member(member_id: int, member: HouseholdMemberCreate, db: Session = Depends(get_db)):
    db_member = household.update_member(db, member_id, member)
    if db_member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return db_member

@router.delete("/{member_id}")
def delete_member(member_id: int, db: Session = Depends(get_db)):
    success = household.delete_member(db, member_id)
    if not success:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"ok": True} 