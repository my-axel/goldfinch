from typing import List, Optional, Dict, Any
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi.encoders import jsonable_encoder
from app.crud.base import CRUDBase
from app.models.etf import ETF, ETFPrice
from app.schemas.etf import ETFCreate, ETFUpdate, ETFPriceCreate

class CRUDETF(CRUDBase[ETF, ETFCreate, ETFUpdate]):
    def add_price(
        self, db: Session, *, etf_id: str, obj_in: ETFPriceCreate
    ) -> ETFPrice:
        # Check if a price already exists for this date
        existing_price = (
            db.query(ETFPrice)
            .filter(
                ETFPrice.etf_id == etf_id,
                ETFPrice.date == obj_in.date
            )
            .first()
        )
        
        if existing_price:
            # Update existing price
            for key, value in obj_in.dict().items():
                setattr(existing_price, key, value)
            db_obj = existing_price
        else:
            # Create new price entry
            db_obj = ETFPrice(
                etf_id=etf_id,
                **obj_in.dict()
            )
            db.add(db_obj)
            
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_prices(
        self,
        db: Session,
        *,
        etf_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[ETFPrice]:
        query = db.query(ETFPrice).filter(ETFPrice.etf_id == etf_id)
        
        if start_date:
            query = query.filter(ETFPrice.date >= start_date)
        if end_date:
            query = query.filter(ETFPrice.date <= end_date)
            
        return query.order_by(ETFPrice.date.desc()).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: ETFCreate) -> ETF:
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: ETF, obj_in: ETFUpdate
    ) -> ETF:
        obj_data = jsonable_encoder(db_obj)
        update_data = obj_in.dict(exclude_unset=True)
        
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
                
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def search(self, db: Session, *, query: str) -> List[ETF]:
        return db.query(self.model).filter(
            or_(
                self.model.symbol.ilike(f"%{query}%"),
                self.model.isin.ilike(f"%{query}%"),
                self.model.name.ilike(f"%{query}%")
            )
        ).all()

etf_crud = CRUDETF(ETF) 