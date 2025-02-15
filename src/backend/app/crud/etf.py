from typing import List, Optional, Dict, Any
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi.encoders import jsonable_encoder
from app.crud.base import CRUDBase
from app.models.etf import ETF, ETFPrice
from app.schemas.etf import ETFCreate, ETFUpdate, ETFPriceCreate
from app.services.exchange_rate import ExchangeRateService
from decimal import Decimal
from fastapi import HTTPException

class CRUDETF(CRUDBase[ETF, ETFCreate, ETFUpdate]):
    def _convert_to_eur(
        self, db: Session, price: Decimal, currency: str, price_date: date
    ) -> Decimal:
        """Convert a price from given currency to EUR using stored exchange rates.
        Special handling for GBp (British pence) to convert to GBP first."""
        if currency == "EUR":
            return price
            
        # Handle GBp (British pence) special case
        if currency == "GBp":
            # Convert pence to pounds first (divide by 100)
            price = price / Decimal('100')
            # Use GBP for the exchange rate lookup
            currency = "GBP"
            
        rate = ExchangeRateService.get_rate(db, currency, price_date)
        if not rate:
            raise HTTPException(
                status_code=400,
                detail=f"No exchange rate found for {currency} on {price_date}"
            )
            
        # For EUR/XXX rates, we need to divide by the rate to get XXX/EUR
        return price / rate.rate

    def add_price(
        self, db: Session, *, etf_id: str, obj_in: ETFPriceCreate
    ) -> ETFPrice:
        # Get the ETF to check its currency
        etf = db.query(ETF).filter(ETF.id == etf_id).first()
        if not etf:
            raise HTTPException(status_code=404, detail="ETF not found")

        # Convert price to EUR if necessary
        price_in_eur = self._convert_to_eur(
            db,
            Decimal(str(obj_in.price)),
            etf.currency,
            obj_in.date
        )

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
            existing_price.price = price_in_eur
            db_obj = existing_price
        else:
            # Create new price entry
            db_obj = ETFPrice(
                etf_id=etf_id,
                date=obj_in.date,
                price=price_in_eur,
                currency="EUR"  # Always store in EUR
            )
            db.add(db_obj)
            
        # Update the ETF's last_price
        etf.last_price = price_in_eur
        etf.last_update = obj_in.date
            
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

    def get_price_for_date(
        self, db: Session, *, etf_id: str, date: date
    ) -> Optional[ETFPrice]:
        """Get the ETF price for a specific date."""
        return (
            db.query(ETFPrice)
            .filter(
                ETFPrice.etf_id == etf_id,
                ETFPrice.date == date
            )
            .first()
        )

    def get_latest_price(
        self, db: Session, *, etf_id: str
    ) -> Optional[ETFPrice]:
        """Get the most recent price for an ETF."""
        return (
            db.query(ETFPrice)
            .filter(ETFPrice.etf_id == etf_id)
            .order_by(ETFPrice.date.desc())
            .first()
        )

etf_crud = CRUDETF(ETF) 