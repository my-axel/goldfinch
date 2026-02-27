from typing import List, Optional
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.retirement_gap import RetirementGapConfig
from app.schemas.retirement_gap import RetirementGapConfigCreate, RetirementGapConfigUpdate


class CRUDRetirementGap(CRUDBase[RetirementGapConfig, RetirementGapConfigCreate, RetirementGapConfigUpdate]):

    def get_by_member_id(self, db: Session, member_id: int) -> Optional[RetirementGapConfig]:
        return db.query(self.model).filter(self.model.member_id == member_id).first()

    def get_all(self, db: Session) -> List[RetirementGapConfig]:
        return db.query(self.model).all()

    def create_for_member(self, db: Session, member_id: int, obj_in: RetirementGapConfigCreate) -> RetirementGapConfig:
        db_obj = RetirementGapConfig(
            member_id=member_id,
            net_monthly_income=obj_in.net_monthly_income,
            desired_monthly_pension=obj_in.desired_monthly_pension,
            replacement_rate=obj_in.replacement_rate,
            withdrawal_rate=obj_in.withdrawal_rate,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


retirement_gap = CRUDRetirementGap(RetirementGapConfig)
