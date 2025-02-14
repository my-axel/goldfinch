from sqlalchemy.orm import Session
from app.models.household import HouseholdMember
from app.schemas.household import HouseholdMemberCreate

def get_member(db: Session, member_id: int) -> HouseholdMember:
    return db.query(HouseholdMember).filter(HouseholdMember.id == member_id).first()

def get_members(db: Session, skip: int = 0, limit: int = 100):
    return db.query(HouseholdMember).offset(skip).limit(limit).all()

def create_member(db: Session, member: HouseholdMemberCreate) -> HouseholdMember:
    db_member = HouseholdMember(**member.model_dump())
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

def delete_member(db: Session, member_id: int) -> bool:
    member = get_member(db, member_id)
    if member:
        db.delete(member)
        db.commit()
        return True
    return False

def update_member(db: Session, member_id: int, member: HouseholdMemberCreate) -> HouseholdMember:
    db_member = get_member(db, member_id)
    if db_member:
        for key, value in member.model_dump().items():
            setattr(db_member, key, value)
        db.commit()
        db.refresh(db_member)
    return db_member 