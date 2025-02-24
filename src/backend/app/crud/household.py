from typing import Dict, Any, Union, List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.household import HouseholdMember
from app.schemas.household import HouseholdMemberCreate, HouseholdMemberUpdate

class CRUDHouseholdMember(CRUDBase[HouseholdMember, HouseholdMemberCreate, HouseholdMemberUpdate]):
    def create(self, db: Session, *, obj_in: HouseholdMemberCreate) -> HouseholdMember:
        db_obj = HouseholdMember(
            first_name=obj_in.first_name,
            last_name=obj_in.last_name,
            birthday=obj_in.birthday,
            retirement_age_planned=obj_in.retirement_age_planned,
            retirement_age_possible=obj_in.retirement_age_possible
        )
        # Calculate retirement dates before saving
        db_obj.calculate_retirement_dates()
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: HouseholdMember,
        obj_in: Union[HouseholdMemberUpdate, Dict[str, Any]]
    ) -> HouseholdMember:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        needs_recalculation = any(
            field in update_data 
            for field in ['birthday', 'retirement_age_planned', 'retirement_age_possible']
        )
        
        for field in update_data:
            setattr(db_obj, field, update_data[field])
            
        if needs_recalculation:
            db_obj.calculate_retirement_dates()
            
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100, filters: Dict = None
    ) -> List[HouseholdMember]:
        return super().get_multi(db=db, skip=skip, limit=limit, filters=filters)

household = CRUDHouseholdMember(HouseholdMember) 