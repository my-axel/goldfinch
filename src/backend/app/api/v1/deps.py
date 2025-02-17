from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.crud.household import household

async def validate_member_exists(
    member_id: int,
    db: Session = Depends(get_db)
) -> None:
    member = household.get(db=db, id=member_id)
    if not member:
        raise HTTPException(
            status_code=404,
            detail=f"Member with ID {member_id} not found"
        ) 