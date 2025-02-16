from typing import List, Optional, Dict, Any
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi.encoders import jsonable_encoder
from app.crud.base import CRUDBase
from app.models.etf import ETF, ETFPrice, ExchangeRateError
from app.schemas.etf import ETFCreate, ETFUpdate, ETFPriceCreate
from app.services.exchange_rate import ExchangeRateService, ExchangeRateNotFoundError
from decimal import Decimal
from fastapi import HTTPException
from app.services.yfinance import get_etf_data
from app.db.session import SessionLocal

class CRUDETF(CRUDBase[ETF, ETFCreate, ETFUpdate]):
    def _log_exchange_rate_error(
        self, db: Session, currency: str, date_needed: date, context: str
    ) -> None:
        """Log a missing exchange rate to the database for later resolution.
        This is a best-effort operation - if it fails, we just log to console and continue."""
        try:
            # Create a new session for error logging to avoid affecting the main transaction
            error_db = SessionLocal()
            try:
                error_log = ExchangeRateError(
                    source_currency=currency,
                    date=date_needed,
                    context=context
                )
                error_db.add(error_log)
                error_db.commit()
            except Exception as e:
                # If we fail to log the error, just print it and continue
                print(f"Failed to log exchange rate error: {str(e)}")
                error_db.rollback()
            finally:
                error_db.close()
        except Exception as e:
            # Catch any other errors that might occur
            print(f"Error in exchange rate error logging: {str(e)}")

    def _convert_to_eur(
        self, db: Session, price: Decimal, currency: str, price_date: date
    ) -> tuple[Decimal, bool]:
        """Convert a price from given currency to EUR using stored exchange rates.
        Special handling for GBp (British pence) to convert to GBP first.
        
        Returns:
            tuple: (converted_price, used_fallback)
            - converted_price: The price in EUR
            - used_fallback: True if a fallback rate was used due to missing exchange rate
        """
        if currency == "EUR":
            return price, False
            
        # Handle GBp (British pence) special case
        if currency == "GBp":
            # Convert pence to pounds first (divide by 100)
            price = price / Decimal('100')
            # Use GBP for the exchange rate lookup
            currency = "GBP"
            
        try:
            rate = ExchangeRateService.get_closest_rate(db, currency, price_date)
            if not rate:
                # Log the missing rate for later resolution
                self._log_exchange_rate_error(
                    db, 
                    currency, 
                    price_date,
                    f"No exchange rate found within +/- 1 day when converting ETF price from {currency}"
                )
                # Use 1:1 as last resort fallback rate
                return price, True
                
            # If we're using a rate from a different date, log it but don't mark as fallback
            if rate.date != price_date:
                self._log_exchange_rate_error(
                    db,
                    currency,
                    price_date,
                    f"Using exchange rate from {rate.date} for {currency}"
                )
                
            # Rate is stored as XXX/EUR (how many EUR you get for 1 XXX)
            # To convert XXX to EUR, we multiply by the rate
            # Example: 100 USD with rate 0.954381 (1 USD = 0.954381 EUR)
            # 100 USD * 0.954381 = 95.4381 EUR
            return price * rate.rate, False
            
        except Exception as e:
            # Log any errors but continue with fallback rate
            self._log_exchange_rate_error(
                db, 
                currency, 
                price_date,
                f"Error getting exchange rate: {str(e)}"
            )
            return price, True

    def add_price(
        self, db: Session, *, etf_id: str, obj_in: ETFPriceCreate
    ) -> ETFPrice:
        # Get the ETF to check its currency
        etf = db.query(ETF).filter(ETF.id == etf_id).first()
        if not etf:
            raise HTTPException(status_code=404, detail="ETF not found")

        # Convert price to EUR if necessary
        price_in_eur, used_fallback = self._convert_to_eur(
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
                currency="EUR",  # Always store in EUR
                original_currency=etf.currency  # Store original currency for reference
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
        self, db: Session, *, etf_id: str, date: Optional[date] = None
    ) -> Optional[ETFPrice]:
        """Get the ETF price for a specific date.
        If no date is provided or no price is found for the exact date,
        returns the most recent price before that date.
        """
        query = db.query(ETFPrice).filter(ETFPrice.etf_id == etf_id)
        
        if date is not None:
            query = query.filter(ETFPrice.date <= date)
            
        return query.order_by(ETFPrice.date.desc()).first()

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

    def _find_price_gaps(
        self, db: Session, etf_id: str, min_gap_days: int = 5
    ) -> List[tuple[date, date]]:
        """
        Find gaps in the ETF price history.
        Returns a list of (start_date, end_date) tuples representing gaps.
        
        Args:
            db: Database session
            etf_id: ETF ID to check
            min_gap_days: Minimum number of days to consider as a gap
        """
        prices = (
            db.query(ETFPrice)
            .filter(ETFPrice.etf_id == etf_id)
            .order_by(ETFPrice.date.asc())
            .all()
        )
        
        if not prices:
            return []
            
        gaps = []
        prev_date = prices[0].date
        
        for price in prices[1:]:
            date_diff = (price.date - prev_date).days
            if date_diff > min_gap_days:
                # Found a gap
                gap_start = prev_date + timedelta(days=1)
                gap_end = price.date - timedelta(days=1)
                gaps.append((gap_start, gap_end))
            prev_date = price.date
            
        return gaps

    def _fetch_missing_prices(
        self, db: Session, etf: ETF, force_full_history: bool = False
    ) -> None:
        """
        Fetch missing historical prices for an ETF.
        
        Args:
            db: Database session
            etf: ETF to fetch prices for
            force_full_history: If True, fetches the full history from YFinance
                              If False, only fills gaps in existing data
        """
        if force_full_history:
            # Fetch full history from YFinance
            price_data = get_etf_data(etf.id)
            if not price_data or not price_data.get("historical_prices"):
                return
                
            for price in price_data["historical_prices"]:
                price_in = ETFPriceCreate(
                    etf_id=etf.id,
                    date=price["date"],
                    price=Decimal(str(price["price"])),
                    volume=price.get("volume"),
                    high=price.get("high"),
                    low=price.get("low"),
                    open=price.get("open")
                )
                # add_price handles checking for existing prices
                self.add_price(db, etf_id=etf.id, obj_in=price_in)
        else:
            # Find and fill gaps
            gaps = self._find_price_gaps(db, etf.id)
            
            for gap_start, gap_end in gaps:
                # Fetch prices for each gap
                price_data = get_etf_data(
                    etf.id,
                    start_date=gap_start,
                    end_date=gap_end
                )
                
                if price_data and price_data.get("historical_prices"):
                    for price in price_data["historical_prices"]:
                        price_in = ETFPriceCreate(
                            etf_id=etf.id,
                            date=price["date"],
                            price=Decimal(str(price["price"])),
                            volume=price.get("volume"),
                            high=price.get("high"),
                            low=price.get("low"),
                            open=price.get("open")
                        )
                        self.add_price(db, etf_id=etf.id, obj_in=price_in)

    def get(self, db: Session, id: Any) -> Optional[ETF]:
        """Get an ETF by ID and fill any gaps in its price history."""
        etf = super().get(db, id)
        if etf:
            self._fetch_missing_prices(db, etf)
        return etf

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[ETF]:
        """Get multiple ETFs and fill any gaps in their price histories."""
        etfs = super().get_multi(db, skip=skip, limit=limit)
        for etf in etfs:
            self._fetch_missing_prices(db, etf)
        return etfs

    def refresh_full_history(
        self, db: Session, etf_id: str
    ) -> None:
        """
        Force refresh the complete price history for an ETF.
        This will fetch all historical data from YFinance.
        """
        etf = self.get(db, etf_id)
        if etf:
            self._fetch_missing_prices(db, etf, force_full_history=True)

etf_crud = CRUDETF(ETF) 