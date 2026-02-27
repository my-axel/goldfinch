from typing import List, Optional, Any, Dict
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc, func
from fastapi.encoders import jsonable_encoder
from app.crud.base import CRUDBase
from app.models.etf import ETF, ETFPrice
from app.models.data_source import DataSourceConfig
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

# Constants
EARLIEST_DATA_DATE = date(1999, 1, 1)  # Euro introduction date, earliest possible date for exchange rates

class CRUDETF(CRUDBase[ETF, ETFCreate, ETFUpdate]):
    def _log_exchange_rate_error(
        self, db: Session, currency: str, date_needed: date, context: str
    ) -> None:
        """Log a missing exchange rate to the database for later resolution.
        If an error for this currency/date already exists, update its context.
        This is a best-effort operation - if it fails, we just log to console and continue."""
        try:
            error = db.query(ExchangeRateError).filter(
                ExchangeRateError.source_currency == currency,
                ExchangeRateError.target_currency == "EUR",
                ExchangeRateError.date == date_needed,
                ExchangeRateError.resolved == False  # noqa: E712
            ).first()
            
            if error:
                # Update existing error with additional context
                error.context = f"{error.context}\n{context}"
            else:
                # Create new error
                error = ExchangeRateError(
                    source_currency=currency,
                    target_currency="EUR",
                    date=date_needed,
                    context=context
                )
                db.add(error)
            
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log exchange rate error: {str(e)}")

    def _convert_field_to_eur(
        self, db: Session, value: float, currency: str, price_date: date
    ) -> Decimal:
        """Convert a field value from given currency to EUR."""
        if not value:
            return Decimal('0')
        
        if currency == "EUR":
            return Decimal(str(value))
            
        converted, is_fallback = self._convert_to_eur(
            db, Decimal(str(value)), currency, price_date
        )
        return converted

    def _convert_to_eur(
        self, db: Session, price: Decimal, currency: str, price_date: date
    ) -> tuple[Decimal, bool]:
        """Convert a price from given currency to EUR using stored exchange rates.
        Special handling for GBp (British pence) to convert to GBP first.
        
        Returns a tuple of (converted_price, is_fallback) where is_fallback indicates
        whether a fallback rate was used due to missing exchange rate data.
        """
        if not price:
            return Decimal('0'), False
            
        if currency == "EUR":
            return price, False
            
        original_currency = currency
        
        # Don't try to convert prices before exchange rates are available
        if price_date < EARLIEST_DATA_DATE:
            error_msg = f"Cannot convert price from {original_currency} to EUR for date {price_date} - before Euro introduction"
            logger.error(error_msg)
            self._log_exchange_rate_error(
                db,
                original_currency,
                price_date,
                error_msg
            )
            return price, True

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
                error_msg = f"No exchange rate found within +/- 1 day when converting price from {original_currency} ({price} {currency}) to EUR"
                logger.error(error_msg)
                self._log_exchange_rate_error(
                    db, 
                    original_currency,  # Log the original currency for clarity
                    price_date,
                    error_msg
                )
                # Use 1:1 as last resort fallback rate
                return price, True
                
            # If we're using a rate from a different date, log it but don't mark as fallback
            if rate.date != price_date:
                log_msg = f"Using exchange rate from {rate.date} for {original_currency} price on {price_date}"
                self._log_exchange_rate_error(
                    db,
                    original_currency,  # Log the original currency for clarity
                    price_date,
                    log_msg
                )
                
            # Rate is stored as XXX/EUR (how many EUR you get for 1 XXX)
            converted_price = price * rate.rate
            return converted_price, False
            
        except Exception as e:
            error_msg = f"Error converting {price} {original_currency} to EUR: {str(e)}"
            logger.error(error_msg)
            self._log_exchange_rate_error(
                db,
                original_currency,
                price_date,
                error_msg
            )
            return price, True

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
        If multiple sources exist for a date, returns the one from the highest-priority
        (lowest priority number) enabled source. Falls back to most recent before date.
        """
        query = (
            db.query(ETFPrice)
            .outerjoin(DataSourceConfig, ETFPrice.source == DataSourceConfig.source_id)
            .filter(ETFPrice.etf_id == etf_id)
        )
        if date is not None:
            query = query.filter(ETFPrice.date <= date)
        return query.order_by(
            ETFPrice.date.desc(),
            func.coalesce(DataSourceConfig.priority, 999).asc(),
        ).first()

    def get_latest_price(
        self, db: Session, *, etf_id: str
    ) -> Optional[ETFPrice]:
        """Get the most recent price for an ETF."""
        return (
            db.query(ETFPrice)
            .filter(ETFPrice.etf_id == etf_id)
            .order_by(desc(ETFPrice.date))
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
            .order_by(asc(ETFPrice.date))  # Get the earliest date after after_date
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

    def get_prices_between_dates(self, db: Session, etf_id: str, start_date: date, end_date: date) -> List[ETFPrice]:
        """
        Get ETF prices between two dates, inclusive.
        When multiple sources exist for the same date, returns one price per date
        from the highest-priority (lowest priority number) enabled source.
        """
        # Subquery: for each date, find the minimum (best) source priority
        priority_subq = (
            db.query(
                ETFPrice.date.label("p_date"),
                func.min(func.coalesce(DataSourceConfig.priority, 999)).label("min_priority"),
            )
            .outerjoin(DataSourceConfig, ETFPrice.source == DataSourceConfig.source_id)
            .filter(
                ETFPrice.etf_id == etf_id,
                ETFPrice.date >= start_date,
                ETFPrice.date <= end_date,
            )
            .group_by(ETFPrice.date)
            .subquery()
        )

        return (
            db.query(ETFPrice)
            .outerjoin(DataSourceConfig, ETFPrice.source == DataSourceConfig.source_id)
            .join(
                priority_subq,
                (ETFPrice.date == priority_subq.c.p_date)
                & (func.coalesce(DataSourceConfig.priority, 999) == priority_subq.c.min_priority),
            )
            .filter(
                ETFPrice.etf_id == etf_id,
                ETFPrice.date >= start_date,
                ETFPrice.date <= end_date,
            )
            .order_by(asc(ETFPrice.date))
            .all()
        )

etf_crud = CRUDETF(ETF) 