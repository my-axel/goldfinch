from typing import List, Optional, Any, Dict
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi.encoders import jsonable_encoder
from app.crud.base import CRUDBase
from app.models.etf import ETF, ETFPrice
from app.models.exchange_rate import ExchangeRate, ExchangeRateError
from app.schemas.etf import ETFCreate, ETFUpdate, ETFPriceCreate
from app.services.exchange_rate import ExchangeRateService, ExchangeRateNotFoundError
from decimal import Decimal
from fastapi import HTTPException
from app.services.yfinance import get_etf_data
from app.db.session import SessionLocal
import yfinance as yf
import logging

logger = logging.getLogger(__name__)

class CRUDETF(CRUDBase[ETF, ETFCreate, ETFUpdate]):
    def _log_exchange_rate_error(
        self, db: Session, currency: str, date_needed: date, context: str
    ) -> None:
        """Log a missing exchange rate to the database for later resolution.
        If an error for this currency/date already exists, update its context.
        This is a best-effort operation - if it fails, we just log to console and continue."""
        try:
            # Create a new session for error logging to avoid affecting the main transaction
            error_db = SessionLocal()
            try:
                # Check if an error already exists
                existing_error = error_db.query(ExchangeRateError).filter(
                    ExchangeRateError.source_currency == currency,
                    ExchangeRateError.target_currency == 'EUR',
                    ExchangeRateError.date == date_needed
                ).first()

                if existing_error:
                    # Update existing error with new context if different
                    if existing_error.context != context:
                        existing_error.context = f"{existing_error.context}\n{context}"
                        error_db.add(existing_error)
                else:
                    # Create new error log
                    error_log = ExchangeRateError(
                        source_currency=currency,
                        target_currency='EUR',
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

    def _convert_field_to_eur(
        self, db: Session, value: Optional[float], currency: str, date: date
    ) -> Optional[Decimal]:
        """Helper method to convert a field value to EUR if it exists."""
        if value is not None:
            converted_value, _ = self._convert_to_eur(
                db,
                Decimal(str(value)),
                currency,
                date
            )
            return converted_value
        return None

    def add_price(
        self, db: Session, *, etf_id: str, obj_in: ETFPriceCreate
    ) -> ETFPrice:
        # Get the ETF to check its currency
        etf = db.query(ETF).filter(ETF.id == etf_id).first()
        if not etf:
            raise HTTPException(status_code=404, detail="ETF not found")

        # Convert all price-related fields to EUR if they exist
        price_fields = {
            'price': obj_in.price,  # Required field
            'high': getattr(obj_in, 'high', None),
            'low': getattr(obj_in, 'low', None),
            'open': getattr(obj_in, 'open', None),
            'dividends': getattr(obj_in, 'dividends', None),
            'capital_gains': getattr(obj_in, 'capital_gains', None)
        }
        
        converted_fields = {
            field: self._convert_field_to_eur(db, value, etf.currency, obj_in.date)
            for field, value in price_fields.items()
            if value is not None  # Only convert fields that have values
        }

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
            for field, value in converted_fields.items():
                setattr(existing_price, field, value)
            if obj_in.volume is not None:
                existing_price.volume = obj_in.volume  # Volume doesn't need conversion
            if obj_in.stock_splits is not None:
                existing_price.stock_splits = obj_in.stock_splits  # Ratios don't need conversion
            db_obj = existing_price
        else:
            # Create new price entry with only the fields that have values
            db_obj = ETFPrice(
                etf_id=etf_id,
                date=obj_in.date,
                currency="EUR",  # Always store in EUR
                volume=obj_in.volume,  # Volume doesn't need conversion
                stock_splits=obj_in.stock_splits,  # Ratios don't need conversion
                original_currency=etf.currency,  # Store original currency for reference
                **converted_fields  # Unpack all converted fields
            )
            db.add(db_obj)
            
        # Update the ETF's last_price
        etf.last_price = converted_fields['price']
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

    def get_next_available_price(
        self, db: Session, *, etf_id: str, after_date: date
    ) -> Optional[ETFPrice]:
        """Get the next available ETF price after a specific date.
        This is useful for handling non-trading days (weekends, holidays).
        
        Args:
            db: Database session
            etf_id: ETF ID to get price for
            after_date: Get the first price after this date
            
        Returns:
            The next available price or None if no future prices exist
        """
        return (
            db.query(ETFPrice)
            .filter(ETFPrice.etf_id == etf_id)
            .filter(ETFPrice.date > after_date)
            .order_by(ETFPrice.date.asc())  # Get the earliest date after after_date
            .first()
        )

    def _find_price_gaps(
        self, db: Session, etf_id: str, min_gap_days: int = 5
    ) -> List[tuple[date, date]]:
        """Find gaps in the ETF price history."""
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
                gap_start = prev_date + timedelta(days=1)
                gap_end = price.date - timedelta(days=1)
                gaps.append((gap_start, gap_end))
            prev_date = price.date
            
        return gaps

    def get(self, db: Session, id: Any) -> Optional[ETF]:
        """Get an ETF by ID."""
        return super().get(db, id)

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100, filters: Dict = None
    ) -> List[ETF]:
        """Get multiple ETFs."""
        return super().get_multi(db, skip=skip, limit=limit, filters=filters)

    def refresh_full_history(
        self, db: Session, etf_id: str
    ) -> None:
        """Queue a full refresh of ETF price history."""
        # Import here to avoid circular dependency
        from app.tasks.etf import refresh_etf_prices
        refresh_etf_prices.delay(etf_id)

    def update_latest_prices(self, db: Session, etf_id: str) -> None:
        """Queue an update of latest prices for an ETF."""
        # Import here to avoid circular dependency
        from app.tasks.etf import update_etf_latest_prices
        update_etf_latest_prices.delay(etf_id)

    def get_or_create(self, db: Session, *, id: str) -> ETF:
        """Get an ETF by ID, or create it with minimal data if it doesn't exist."""
        etf = super().get(db, id)
        if not etf:
            # Try to get basic info from YFinance without historical data
            try:
                ticker = yf.Ticker(id)
                info = ticker.fast_info
                
                # Create ETF with minimal data
                etf = self.create(db, obj_in=ETFCreate(
                    id=id,
                    symbol=id,
                    name=info.get('longName', info.get('shortName', id)),
                    currency=info.get('currency', 'EUR'),
                    is_active=True
                ))
            except Exception as e:
                logger.error(f"Error getting YFinance data: {e}")
                # If YFinance fails, create with minimal data
                etf = self.create(db, obj_in=ETFCreate(
                    id=id,
                    symbol=id,
                    name=id,
                    currency='EUR',
                    is_active=True
                ))
            
            # Import here to avoid circular dependency
            from app.tasks.etf import fetch_etf_data
            # Queue full data fetch for new ETF
            fetch_etf_data.delay(id)
        else:
            # For existing ETFs, just update latest prices
            self.update_latest_prices(db, id)
        
        return etf

etf_crud = CRUDETF(ETF) 