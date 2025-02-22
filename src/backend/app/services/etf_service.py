from sqlalchemy.orm import Session
from app.models.etf import ETF, ETFPrice
import yfinance as yf
from datetime import date, datetime, timedelta
from app.crud.etf import etf_crud
from app.crud.etf_update import etf_update, etf_error
from app.schemas.etf_update import ETFUpdateCreate, ETFErrorCreate
from decimal import Decimal
import pandas as pd
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Constants
EARLIEST_DATA_DATE = date(1999, 1, 1)  # Euro introduction date, earliest possible date for exchange rates
CHUNK_SIZE_DAYS = 90  # Process data in 90-day chunks to avoid memory issues
MAX_RETRIES = 3  # Maximum number of retries for failed operations
RETRY_DELAY = 60  # Base delay in seconds for retry backoff

class ETFServiceError(Exception):
    """Base exception for ETF service errors."""
    pass

class ETFNotFoundError(ETFServiceError):
    """Raised when an ETF is not found."""
    pass

class ETFDataError(ETFServiceError):
    """Raised when there's an error fetching or processing ETF data."""
    pass

def extract_etf_info(info: Dict[str, Any]) -> Dict[str, Any]:
    """Extract and validate ETF information from YFinance data."""
    try:
        # Basic info with fallbacks
        result = {
            'name': info.get('longName') or info.get('shortName') or info.get('symbol', ''),
            'symbol': info.get('symbol'),
            'currency': info.get('currency', 'EUR'),  # Default to EUR if not specified
            'isin': info.get('isin'),
            
            # Asset info with validation
            'asset_class': validate_asset_class(info.get('quoteType')),
            'domicile': info.get('market') or info.get('exchange'),
            
            # Fund details
            'inception_date': None,
            'fund_size': None,
            'ter': None,
            'distribution_policy': 'ACCUMULATING' if info.get('dividendRate', 0) == 0 else 'DISTRIBUTING',
            
            # Performance metrics
            'ytd_return': validate_percentage(info.get('ytdReturn')),
            'one_year_return': validate_percentage(info.get('oneYearReturn')) or validate_percentage(info.get('52WeekChange')),
            'volatility_30d': validate_percentage(info.get('thirtyDayVolatility')),
            'sharpe_ratio': validate_number(info.get('sharpeRatio'))
        }
        
        # Convert inception date with validation
        if info.get('fundInceptionDate'):
            try:
                result['inception_date'] = datetime.fromtimestamp(info['fundInceptionDate']).date()
            except (TypeError, ValueError) as e:
                logger.warning(f"Failed to parse inception date: {e}")

        # Convert fund size with validation
        if info.get('totalAssets'):
            try:
                result['fund_size'] = validate_number(info['totalAssets'])
            except (TypeError, ValueError) as e:
                logger.warning(f"Failed to parse fund size: {e}")

        # Convert TER with validation
        if info.get('annualReportExpenseRatio'):
            try:
                result['ter'] = validate_percentage(info['annualReportExpenseRatio'])
            except (TypeError, ValueError) as e:
                logger.warning(f"Failed to parse TER: {e}")

        return result
    except Exception as e:
        logger.error(f"Error extracting ETF info: {e}")
        # Return minimal required data
        return {
            'name': info.get('longName', info.get('shortName', info.get('symbol', ''))),
            'symbol': info.get('symbol', ''),
            'currency': info.get('currency', 'EUR')
        }

def validate_asset_class(quote_type: Optional[str]) -> str:
    """Validate and normalize asset class."""
    if not quote_type:
        return 'Mixed'
    
    quote_type = quote_type.upper()
    if 'ETF' in quote_type:
        return 'Equity'  # Most ETFs are equity
    if 'BOND' in quote_type or 'FIXED' in quote_type:
        return 'Fixed Income'
    if 'REIT' in quote_type or 'REAL' in quote_type:
        return 'Real Estate'
    if 'COMMODITY' in quote_type:
        return 'Commodity'
    return 'Mixed'

def validate_percentage(value: Optional[float]) -> Optional[Decimal]:
    """Validate and convert percentage values."""
    if value is None:
        return None
    try:
        decimal_value = Decimal(str(value))
        if decimal_value < -1 or decimal_value > 1:
            logger.warning(f"Percentage value {value} out of expected range [-1, 1]")
        return decimal_value
    except (TypeError, ValueError, Decimal.InvalidOperation):
        return None

def validate_number(value: Optional[float]) -> Optional[Decimal]:
    """Validate and convert numeric values."""
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (TypeError, ValueError, Decimal.InvalidOperation):
        return None

def update_etf_info(db: Session, etf: ETF, info: Dict[str, Any]) -> None:
    """Update ETF information with data from YFinance."""
    try:
        etf_data = extract_etf_info(info)
        
        # Update all fields that have values
        for field, value in etf_data.items():
            if value is not None:
                setattr(etf, field, value)
        
        db.add(etf)
    except Exception as e:
        logger.error(f"Failed to update ETF info: {e}")
        # Create error record
        etf_error.create_error(
            db=db,
            obj_in=ETFErrorCreate(
                etf_id=etf.id,
                error_type="info_incomplete",
                context=str(e)
            )
        )

def process_price_chunk(
    db: Session,
    etf_id: str,
    hist_chunk: 'pd.DataFrame',
    currency: str,
    missing_dates: list
) -> None:
    """Process a chunk of historical prices."""
    logger.info(f"Processing price chunk for ETF {etf_id}: {len(hist_chunk)} prices")
    
    # Get existing prices for this date range to avoid duplicates
    dates = [idx.date() for idx in hist_chunk.index]
    existing_prices = {
        p.date: p for p in db.query(ETFPrice).filter(
            ETFPrice.etf_id == etf_id,
            ETFPrice.date.in_(dates)
        ).all()
    }
    
    new_prices = 0
    skipped_prices = 0
    
    for date_idx, row in hist_chunk.iterrows():
        try:
            date_val = date_idx.date()
            # Skip dates before Euro introduction
            if date_val < EARLIEST_DATA_DATE:
                skipped_prices += 1
                continue
                
            # Skip if we already have this price
            if date_val in existing_prices:
                skipped_prices += 1
                continue
                
            # Validate price data
            close_price = validate_price(row["Close"])
            if close_price is None:
                missing_dates.append(date_val)
                continue
                
            # Convert all prices to EUR before storing
            try:
                price = etf_crud._convert_field_to_eur(
                    db,
                    close_price,
                    currency,
                    date_val
                )
                
                # Create price object with validated data
                price_obj = ETFPrice(
                    etf_id=etf_id,
                    date=date_val,
                    price=price,
                    volume=validate_number(row.get("Volume", 0)),
                    high=etf_crud._convert_field_to_eur(
                        db, 
                        validate_price(row.get("High", row["Close"])), 
                        currency, 
                        date_val
                    ),
                    low=etf_crud._convert_field_to_eur(
                        db, 
                        validate_price(row.get("Low", row["Close"])), 
                        currency, 
                        date_val
                    ),
                    open=etf_crud._convert_field_to_eur(
                        db, 
                        validate_price(row.get("Open", row["Close"])), 
                        currency, 
                        date_val
                    ),
                    dividends=etf_crud._convert_field_to_eur(
                        db, 
                        validate_number(row.get("Dividends", 0)), 
                        currency, 
                        date_val
                    ),
                    stock_splits=validate_number(row.get("Stock Splits", 0)),
                    currency="EUR",
                    original_currency=currency
                )
                db.add(price_obj)
                new_prices += 1
            except Exception as e:
                missing_dates.append(date_val)
                if not isinstance(e, (ValueError, TypeError)):
                    logger.error(f"Error converting price for date {date_val}: {str(e)}")
                continue

        except Exception as e:
            missing_dates.append(date_val)
            if not isinstance(e, (ValueError, TypeError)):
                logger.error(f"Error processing price for date {date_val}: {str(e)}")

    try:
        db.commit()
    except Exception as e:
        logger.error(f"Error committing price chunk: {str(e)}")
        db.rollback()
        # Add all dates to missing_dates
        missing_dates.extend(dates)

    logger.info(f"Completed chunk for ETF {etf_id}: {new_prices} new prices, {skipped_prices} skipped, {len(missing_dates)} missing")

def validate_price(value: Optional[float]) -> Optional[float]:
    """Validate price values."""
    if value is None:
        return None
    try:
        float_value = float(value)
        if float_value < 0:
            logger.warning(f"Negative price value: {float_value}")
            return None
        return float_value
    except (TypeError, ValueError):
        return None

def update_etf_data(db: Session, etf_id: str) -> None:
    """Update complete ETF data and historical prices."""
    logger.info(f"Starting full update for ETF {etf_id}")
    update_record = None
    try:
        # Create update tracking record
        update_record = etf_update.create_with_status(
            db=db,
            obj_in=ETFUpdateCreate(
                etf_id=etf_id,
                update_type="full",
                start_date=EARLIEST_DATA_DATE,
                end_date=date.today(),
                notes="Full ETF data update"
            ),
            status="processing"
        )

        # Get the ETF
        etf = db.query(ETF).filter(ETF.id == etf_id).first()
        if not etf:
            raise ETFNotFoundError(f"ETF {etf_id} not found")

        # Get YFinance data with retries
        for attempt in range(MAX_RETRIES):
            try:
                ticker = yf.Ticker(etf_id)
                info = ticker.info
                hist = ticker.history(period="max")
                break
            except Exception as e:
                if attempt == MAX_RETRIES - 1:
                    raise ETFDataError(f"Failed to fetch YFinance data after {MAX_RETRIES} attempts: {str(e)}")
                logger.warning(f"YFinance fetch attempt {attempt + 1} failed, retrying...")
                import time
                time.sleep(RETRY_DELAY * (2 ** attempt))

        logger.info(f"Retrieved {len(hist)} historical prices for ETF {etf_id}")

        # Update ETF info with complete data
        update_etf_info(db, etf, info)
        currency = info.get('currency', etf.currency)

        missing_dates = []
        # Process historical prices in chunks
        chunk_size = len(hist) // (len(hist) // CHUNK_SIZE_DAYS + 1)
        total_chunks = (len(hist) + chunk_size - 1) // chunk_size
        
        logger.info(f"Processing {total_chunks} chunks of {chunk_size} prices each")
        
        for chunk_start in range(0, len(hist), chunk_size):
            chunk_end = min(chunk_start + chunk_size, len(hist))
            hist_chunk = hist.iloc[chunk_start:chunk_end]
            
            try:
                process_price_chunk(db, etf_id, hist_chunk, currency, missing_dates)
                db.commit()
            except Exception as e:
                logger.error(f"Failed to process chunk {chunk_start}-{chunk_end}: {str(e)}")
                db.rollback()
                for date_idx in hist_chunk.index:
                    missing_dates.append(date_idx.date())

        # Update ETF's last price if we got any data
        if not hist.empty:
            last_row = hist.iloc[-1]
            last_date = hist.index[-1].date()
            etf.last_price = etf_crud._convert_field_to_eur(
                db,
                float(last_row["Close"]),
                currency,
                last_date
            )
            etf.last_update = last_date
            db.add(etf)

        # Update task status
        if missing_dates:
            logger.warning(f"Update completed with {len(missing_dates)} missing dates")
            etf_update.update_status(
                db=db,
                db_obj=update_record,
                status="completed_with_errors",
                missing_dates=missing_dates
            )
        else:
            logger.info("Update completed successfully")
            etf_update.update_status(
                db=db,
                db_obj=update_record,
                status="completed"
            )

        db.commit()

    except Exception as e:
        logger.error(f"Failed to update ETF data: {str(e)}")
        db.rollback()
        if update_record:
            etf_update.update_status(
                db=db,
                db_obj=update_record,
                status="failed",
                error=str(e)
            )
        raise ETFServiceError(f"Failed to update ETF data: {str(e)}")

def update_latest_prices(db: Session, etf_id: str) -> None:
    """Update only missing recent prices for an ETF."""
    update_record = None
    try:
        # Get the ETF
        etf = db.query(ETF).filter(ETF.id == etf_id).first()
        if not etf:
            raise ETFNotFoundError(f"ETF {etf_id} not found")

        # Get the latest price date
        latest_price = (
            db.query(ETFPrice)
            .filter(ETFPrice.etf_id == etf_id)
            .order_by(ETFPrice.date.desc())
            .first()
        )

        # If we have no prices at all, fall back to complete history
        if not latest_price:
            return update_etf_data(db, etf_id)

        # Calculate the date range we need to fetch
        start_date = latest_price.date + timedelta(days=1)
        today = date.today()

        # If we're already up to date, no need to fetch
        if start_date > today:
            return

        # Create update tracking record
        update_record = etf_update.create_with_status(
            db=db,
            obj_in=ETFUpdateCreate(
                etf_id=etf_id,
                update_type="prices_only",
                start_date=start_date,
                end_date=today,
                notes="Latest prices update"
            ),
            status="processing"
        )

        # Get YFinance data with retries
        for attempt in range(MAX_RETRIES):
            try:
                ticker = yf.Ticker(etf_id)
                info = ticker.info  # Use full info to update ETF data
                hist = ticker.history(start=start_date, end=today + timedelta(days=1))
                break
            except Exception as e:
                if attempt == MAX_RETRIES - 1:
                    raise ETFDataError(f"Failed to fetch YFinance data after {MAX_RETRIES} attempts: {str(e)}")
                logger.warning(f"Attempt {attempt + 1} failed, retrying in {RETRY_DELAY * (2 ** attempt)} seconds")
                import time
                time.sleep(RETRY_DELAY * (2 ** attempt))

        # Update ETF info with complete data
        update_etf_info(db, etf, info)
        currency = info.get('currency', etf.currency)

        missing_dates = []
        # Process new prices in chunks if we have a lot of data
        if len(hist) > CHUNK_SIZE_DAYS:
            chunk_size = len(hist) // (len(hist) // CHUNK_SIZE_DAYS + 1)
            for chunk_start in range(0, len(hist), chunk_size):
                chunk_end = min(chunk_start + chunk_size, len(hist))
                hist_chunk = hist.iloc[chunk_start:chunk_end]
                
                try:
                    process_price_chunk(db, etf_id, hist_chunk, currency, missing_dates)
                    db.commit()  # Commit each chunk
                except Exception as e:
                    logger.error(f"Failed to process chunk {chunk_start}-{chunk_end}: {str(e)}")
                    db.rollback()
                    # Add all dates in the chunk to missing_dates
                    for date_idx in hist_chunk.index:
                        missing_dates.append(date_idx.date())
        else:
            # Process all at once for small updates
            process_price_chunk(db, etf_id, hist, currency, missing_dates)

        # Update ETF's last price if we got new data
        if not hist.empty:
            last_row = hist.iloc[-1]
            last_date = hist.index[-1].date()
            etf.last_price = etf_crud._convert_field_to_eur(
                db,
                float(last_row["Close"]),
                currency,
                last_date
            )
            etf.last_update = last_date
            db.add(etf)

        # Update task status
        if missing_dates:
            etf_update.update_status(
                db=db,
                db_obj=update_record,
                status="completed_with_errors",
                missing_dates=missing_dates
            )
        else:
            etf_update.update_status(
                db=db,
                db_obj=update_record,
                status="completed"
            )

        db.commit()

    except Exception as e:
        db.rollback()
        if update_record:
            etf_update.update_status(
                db=db,
                db_obj=update_record,
                status="failed",
                error=str(e)
            )
        raise ETFServiceError(f"Failed to update latest prices: {str(e)}")

def refresh_prices(db: Session, etf_id: str) -> None:
    """Refresh all ETF prices."""
    update_record = None
    try:
        # Create update tracking record
        update_record = etf_update.create_with_status(
            db=db,
            obj_in=ETFUpdateCreate(
                etf_id=etf_id,
                update_type="prices_refresh",
                start_date=EARLIEST_DATA_DATE,
                end_date=date.today(),
                notes="Full price history refresh"
            ),
            status="processing"
        )

        # Get YFinance data with retries
        for attempt in range(MAX_RETRIES):
            try:
                ticker = yf.Ticker(etf_id)
                info = ticker.info  # Use full info to update ETF data
                hist = ticker.history(period="max")
                break
            except Exception as e:
                if attempt == MAX_RETRIES - 1:
                    raise ETFDataError(f"Failed to fetch YFinance data after {MAX_RETRIES} attempts: {str(e)}")
                logger.warning(f"Attempt {attempt + 1} failed, retrying in {RETRY_DELAY * (2 ** attempt)} seconds")
                import time
                time.sleep(RETRY_DELAY * (2 ** attempt))

        # Get the ETF to update its last price
        etf = db.query(ETF).filter(ETF.id == etf_id).first()
        if not etf:
            raise ETFNotFoundError(f"ETF {etf_id} not found")

        # Update ETF info with complete data
        update_etf_info(db, etf, info)
        currency = info.get('currency', etf.currency)

        missing_dates = []
        # Process historical prices in chunks
        chunk_size = len(hist) // (len(hist) // CHUNK_SIZE_DAYS + 1)
        for chunk_start in range(0, len(hist), chunk_size):
            chunk_end = min(chunk_start + chunk_size, len(hist))
            hist_chunk = hist.iloc[chunk_start:chunk_end]
            
            try:
                process_price_chunk(db, etf_id, hist_chunk, currency, missing_dates)
                db.commit()  # Commit each chunk
            except Exception as e:
                logger.error(f"Failed to process chunk {chunk_start}-{chunk_end}: {str(e)}")
                db.rollback()
                # Add all dates in the chunk to missing_dates
                for date_idx in hist_chunk.index:
                    missing_dates.append(date_idx.date())

        # Update ETF's last price if we got any data
        if not hist.empty:
            last_row = hist.iloc[-1]
            last_date = hist.index[-1].date()
            etf.last_price = etf_crud._convert_field_to_eur(
                db,
                float(last_row["Close"]),
                currency,
                last_date
            )
            etf.last_update = last_date
            db.add(etf)

        # Update task status
        if missing_dates:
            etf_update.update_status(
                db=db,
                db_obj=update_record,
                status="completed_with_errors",
                missing_dates=missing_dates
            )
        else:
            etf_update.update_status(
                db=db,
                db_obj=update_record,
                status="completed"
            )

        db.commit()

    except Exception as e:
        db.rollback()
        if update_record:
            etf_update.update_status(
                db=db,
                db_obj=update_record,
                status="failed",
                error=str(e)
            )
        raise ETFServiceError(f"Failed to refresh prices: {str(e)}") 