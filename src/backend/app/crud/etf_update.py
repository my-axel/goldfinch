from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from app.crud.base import CRUDBase
from app.models.etf import ETFUpdate, ETFError
from app.schemas.etf_update import ETFUpdateCreate, ETFUpdateResponse, ETFErrorCreate, ETFErrorResponse

class CRUDETFUpdate(CRUDBase[ETFUpdate, ETFUpdateCreate, ETFUpdateResponse]):
    def create_with_status(
        self,
        db: Session,
        *,
        obj_in: ETFUpdateCreate,
        status: str = "pending"
    ) -> ETFUpdate:
        """Create an ETF update with a specific status."""
        obj_in_data = obj_in.dict()
        db_obj = ETFUpdate(**obj_in_data, status=status)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_status(
        self,
        db: Session,
        *,
        db_obj: ETFUpdate,
        status: str,
        error: Optional[str] = None,
        missing_dates: Optional[List[datetime]] = None
    ) -> ETFUpdate:
        """Update the status of an ETF update."""
        db_obj.status = status
        if status in ["completed", "failed"]:
            db_obj.completed_at = datetime.utcnow()
        if error:
            db_obj.error = error
        if missing_dates:
            db_obj.missing_dates = missing_dates
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_latest_by_etf(
        self,
        db: Session,
        *,
        etf_id: str,
        update_type: Optional[str] = None
    ) -> Optional[ETFUpdate]:
        """Get the latest update for an ETF."""
        query = db.query(ETFUpdate).filter(ETFUpdate.etf_id == etf_id)
        if update_type:
            query = query.filter(ETFUpdate.update_type == update_type)
        return query.order_by(ETFUpdate.created_at.desc()).first()

class CRUDETFError(CRUDBase[ETFError, ETFErrorCreate, ETFErrorResponse]):
    def create_error(
        self,
        db: Session,
        *,
        obj_in: ETFErrorCreate
    ) -> ETFError:
        """Create an ETF error."""
        obj_in_data = obj_in.dict()
        db_obj = ETFError(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def resolve_error(
        self,
        db: Session,
        *,
        db_obj: ETFError
    ) -> ETFError:
        """Mark an ETF error as resolved."""
        db_obj.resolved = True
        db_obj.resolved_at = datetime.utcnow()
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_unresolved_by_etf(
        self,
        db: Session,
        *,
        etf_id: str
    ) -> List[ETFError]:
        """Get all unresolved errors for an ETF."""
        return db.query(ETFError).filter(
            ETFError.etf_id == etf_id,
            ETFError.resolved == False  # noqa: E712
        ).all()

etf_update = CRUDETFUpdate(ETFUpdate)
etf_error = CRUDETFError(ETFError) 