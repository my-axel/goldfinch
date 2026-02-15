from datetime import date, timedelta
import httpx
import xmltodict
from decimal import Decimal
from typing import Dict, Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.exchange_rate import ExchangeRate, ExchangeRateUpdate, ExchangeRateError
from app.schemas.exchange_rate import ExchangeRateCreate, ExchangeRateUpdateCreate
from fastapi import HTTPException
import json
from urllib.parse import urlencode
import decimal
import logging
from datetime import datetime
import pytz
import asyncio

logger = logging.getLogger(__name__)

class ExchangeRateNotFoundError(Exception):
    """Raised when an exchange rate is not found for a specific currency and date."""
    pass

class ExchangeRateService:
    """
    Comprehensive service for managing exchange rates.
    Features:
    - Fetch and store exchange rates from ECB
    - Handle both daily updates and historical data
    - Track update operations and errors
    - Manage rate cleanup and maintenance
    """
    # ECB Statistical Data Warehouse API
    SDW_BASE_URL = "https://data-api.ecb.europa.eu/service/"
    
    # We'll keep the daily XML endpoint as a fallback for latest rates
    ECB_DAILY_RATES_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"
    
    # Supported currencies for exchange rate tracking
    # All rates are stored with EUR as the base currency (1 EUR = X foreign currency)
    # Order indicates priority for ETF processing
    DEFAULT_CURRENCIES = [
        'USD',  # US Dollar (primary reserve currency)
        'CHF',  # Swiss Franc
        'GBP',  # British Pound
        'JPY',  # Japanese Yen
        'CAD',  # Canadian Dollar
        'AUD',  # Australian Dollar
        'SEK',  # Swedish Krona
        'DKK',  # Danish Krone
        'NOK',  # Norwegian Krone
        'SGD',  # Singapore Dollar
        'HKD',  # Hong Kong Dollar
    ]
    
    # Process data in 30-day chunks to avoid ECB API timeouts
    # ECB's Statistical Data Warehouse API can be sensitive to large date ranges
    # Monthly chunks provide a good balance between performance and reliability
    CHUNK_SIZE_DAYS = 30

    @staticmethod
    def build_sdw_url(currency: str, start_date: date, end_date: date) -> str:
        """Build URL for ECB Statistical Data Warehouse API"""
        resource = "data"
        flowRef = "EXR"
        key = f"D.{currency}.EUR.SP00.A"
        
        parameters = {
            'startPeriod': start_date.isoformat(),
            'endPeriod': end_date.isoformat(),
            'format': 'jsondata',
            'detail': 'dataonly',
            'updatedAfter': '2000-01-01'
        }
        
        url = f"{ExchangeRateService.SDW_BASE_URL}{resource}/{flowRef}/{key}"
        if parameters:
            url += "?" + urlencode(parameters)
        
        return url

    @staticmethod
    def _parse_sdmx_response(data: dict, currency: str, start_date: date, end_date: date) -> List[Dict]:
        """Helper method to parse SDMX response format consistently"""
        # Validate the basic SDMX structure
        if not isinstance(data, dict) or 'dataSets' not in data or not data['dataSets']:
            raise ValueError("Invalid SDMX format: missing or empty dataSets")

        dataset = data['dataSets'][0]
        if not isinstance(dataset, dict) or 'series' not in dataset:
            raise ValueError("Invalid SDMX format: missing series data")

        # Get the first (and only) series key - typically "0:0:0:0:0"
        series_data = dataset['series']
        if not series_data:
            raise ValueError("No series data found")
        
        series_key = next(iter(series_data))
        series = series_data[series_key]
        
        if 'observations' not in series:
            raise ValueError("No observations found in series")

        observations = series['observations']
        if not observations:
            logger.warning(f"No observations found for {currency} between {start_date} and {end_date}")
            return []

        # Get time periods from the structure
        if ('structure' not in data or 
            'dimensions' not in data['structure'] or 
            'observation' not in data['structure']['dimensions']):
            raise ValueError("Invalid SDMX format: missing time dimension structure")

        # Find the TIME_PERIOD dimension
        time_dimension = None
        for dim in data['structure']['dimensions']['observation']:
            if dim.get('id') == 'TIME_PERIOD':
                time_dimension = dim
                break

        if not time_dimension or 'values' not in time_dimension:
            raise ValueError("Time period information not found")

        result = []
        time_periods = time_dimension['values']

        # Process each observation
        for i, period_info in enumerate(time_periods):
            obs_key = str(i)
            if obs_key in observations:
                try:
                    # Get the rate value (first element in the observation array)
                    obs_value = observations[obs_key]
                    if not isinstance(obs_value, list) or not obs_value:
                        continue

                    rate_value = obs_value[0]
                    if rate_value is None:
                        continue

                    # Get the date from period info
                    if 'id' not in period_info:
                        continue

                    rate_date = date.fromisoformat(period_info['id'])
                    
                    # Convert to Decimal, handling string values if necessary
                    if isinstance(rate_value, str):
                        rate_value = rate_value.strip().replace(',', '.')
                    
                    rate = Decimal(str(rate_value))
                    
                    result.append({
                        'date': rate_date,
                        'currency': currency,
                        'rate': rate
                    })

                except (ValueError, decimal.InvalidOperation) as e:
                    logger.warning(f"Error processing observation for {currency} at index {i}: {str(e)}")
                    continue

        if not result:
            logger.warning(f"No valid exchange rates found for {currency} between {start_date} and {end_date}")
        
        return result

    @staticmethod
    async def fetch_sdw_rates(currency: str, start_date: date, end_date: date) -> List[Dict]:
        """Fetch historical exchange rates from ECB Statistical Data Warehouse"""
        # Early return for future dates
        today = date.today()
        if start_date > today:
            logger.info(f"Skipping future date range for {currency}: {start_date} to {end_date}")
            return []

        # If start date is a weekend, move to next business day
        while ExchangeRateService._is_weekend(start_date):
            start_date = start_date + timedelta(days=1)
            if start_date > end_date:
                logger.info(f"After skipping weekend, start date {start_date} is beyond end date {end_date}")
                return []

        url = ExchangeRateService.build_sdw_url(currency, start_date, end_date)
        logger.info(f"Fetching rates for {currency} from {url}")
        
        # Initialize retry mechanism
        max_retries = 3
        retry_count = 0
        retry_delay = 1  # Initial delay in seconds
        last_error = None
        
        async with httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={
                'Accept': 'application/json',
                'User-Agent': 'Goldfinch/1.0'
            }
        ) as client:
            while retry_count < max_retries:
                try:
                    response = await client.get(url)
                    
                    logger.debug(f"Response status code: {response.status_code}")
                    logger.debug(f"Response headers: {dict(response.headers)}")
                    
                    if response.status_code != 200:
                        error_msg = f"Failed to fetch rates for {currency}. Status: {response.status_code}"
                        logger.error(f"{error_msg}\nResponse content: {response.text[:1000]}")
                        last_error = error_msg
                        if retry_count < max_retries - 1:
                            retry_count += 1
                            await asyncio.sleep(retry_delay)
                            retry_delay *= 2  # Exponential backoff
                            continue
                        raise HTTPException(status_code=503, detail=error_msg)
                    
                    # Handle empty response
                    if not response.text.strip():
                        if not ExchangeRateService._is_weekend(start_date):
                            error_msg = f"Empty response for {currency} on business day: {start_date}"
                            logger.error(error_msg)
                            raise HTTPException(status_code=503, detail=error_msg)
                        logger.info(f"No data available for {currency} on {start_date} (weekend/holiday)")
                        return []
                    
                    try:
                        data = response.json()
                    except json.JSONDecodeError as e:
                        error_msg = f"Invalid JSON response for {currency}: {str(e)}"
                        logger.error(f"{error_msg}\nRaw response: {response.text[:1000]}")
                        last_error = error_msg
                        if retry_count < max_retries - 1:
                            retry_count += 1
                            await asyncio.sleep(retry_delay)
                            retry_delay *= 2
                            continue
                        raise HTTPException(status_code=503, detail=error_msg)
                    
                    try:
                        rates = ExchangeRateService._parse_sdmx_response(data, currency, start_date, end_date)
                        if rates:
                            logger.info(f"Successfully fetched {len(rates)} rates for {currency}")
                            return rates
                        elif not ExchangeRateService._is_weekend(start_date):
                            error_msg = f"No rates found for {currency} on business day: {start_date}"
                            logger.error(error_msg)
                            raise HTTPException(status_code=503, detail=error_msg)
                        return []
                        
                    except ValueError as e:
                        error_msg = f"Error parsing exchange rate data for {currency}: {str(e)}"
                        logger.error(f"{error_msg}\nData structure: {json.dumps(data)[:1000]}")
                        last_error = error_msg
                        if retry_count < max_retries - 1:
                            retry_count += 1
                            await asyncio.sleep(retry_delay)
                            retry_delay *= 2
                            continue
                        raise HTTPException(status_code=503, detail=error_msg)
                        
                except httpx.RequestError as e:
                    error_msg = f"Request failed for {currency}: {str(e)}"
                    logger.error(error_msg)
                    last_error = error_msg
                    if retry_count < max_retries - 1:
                        retry_count += 1
                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2
                        continue
                    raise HTTPException(status_code=503, detail=error_msg)
                
                break  # Break the retry loop if we get here (successful response)
            
            if last_error:  # If we exhausted all retries
                raise HTTPException(status_code=503, detail=last_error)
            return []

    @staticmethod
    async def fetch_latest_rates() -> Dict[str, Decimal]:
        """Fetch the latest exchange rates from ECB daily feed"""
        async with httpx.AsyncClient() as client:
            response = await client.get(ExchangeRateService.ECB_DAILY_RATES_URL)
            if response.status_code != 200:
                raise HTTPException(status_code=503, detail="Failed to fetch exchange rates from ECB")
            
            data = xmltodict.parse(response.text)
            rates_data = data['gesmes:Envelope']['Cube']['Cube']['Cube']
            
            return {
                rate['@currency']: Decimal(rate['@rate'])
                for rate in rates_data
            }

    @staticmethod
    def _get_latest_rate_date(db: Session, currency: str) -> Optional[date]:
        """Get the latest available rate date for a currency"""
        latest_rate = (
            db.query(ExchangeRate)
            .filter(ExchangeRate.currency == currency)
            .order_by(ExchangeRate.date.desc())
            .first()
        )
        return latest_rate.date if latest_rate else None

    @staticmethod
    def _should_fetch_yesterday_rates(latest_date: Optional[date]) -> bool:
        """
        Determine if we should fetch yesterday's rates based on the latest available rate date.
        Properly handles weekends by checking for the last business day.
        """
        today = date.today()
        logger.info("Checking if should fetch yesterday's rates:")
        logger.info(f"  Today: {today}")
        logger.info(f"  Latest date: {latest_date}")
        
        # Find the last business day
        last_business_day = today - timedelta(days=1)
        while ExchangeRateService._is_weekend(last_business_day):
            last_business_day = last_business_day - timedelta(days=1)
        
        logger.info(f"  Last business day: {last_business_day}")
        
        # If no rates exist, we should definitely fetch
        if not latest_date:
            logger.info("  No rates exist yet, should fetch")
            return True
        
        # If latest rate is before the last business day
        if latest_date < last_business_day:
            logger.info(f"  Latest rate ({latest_date}) is before last business day ({last_business_day}), should fetch")
            return True
        
        logger.info(f"  Latest rate ({latest_date}) is not before last business day ({last_business_day}), should not fetch")
        return False

    @staticmethod
    async def manage_rate_update(
        db: Session,
        update_type: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        currencies: Optional[List[str]] = None
    ) -> ExchangeRateUpdate:
        """
        Main entry point for managing rate updates.
        Handles both scheduled and manual updates.
        """
        logger.info(f"Starting {update_type} exchange rate update with params:")
        logger.info(f"  start_date: {start_date}")
        logger.info(f"  end_date: {end_date}")
        logger.info(f"  currencies: {currencies}")
        
        if not currencies:
            currencies = ExchangeRateService.DEFAULT_CURRENCIES
            logger.info(f"Using default currencies: {currencies}")

        # For each currency, determine if we need to fetch rates
        currencies_to_update = []
        currency_start_dates = {}
        
        for currency in currencies:
            latest_date = ExchangeRateService._get_latest_rate_date(db, currency)
            logger.info(f"Checking {currency}:")
            logger.info(f"  Latest rate date: {latest_date}")
            
            if update_type == 'manual_historical':
                logger.info(f"  Manual historical update mode for {currency}")
                
                # Calculate the earliest date we need to start from
                currency_start = None
                
                # If there's a latest date, the earliest we want to start is the day after that
                if latest_date:
                    currency_start = latest_date + timedelta(days=1)
                    logger.info(f"  Day after latest rate: {currency_start}")
                
                # If a start_date was provided, we don't want to go earlier than that
                if start_date and (not currency_start or start_date < currency_start):
                    currency_start = start_date
                    logger.info(f"  Using provided start_date: {currency_start}")
                
                # If we have no latest date, use the provided start_date or default to yesterday
                if not currency_start:
                    currency_start = start_date or (date.today() - timedelta(days=1))
                    logger.info(f"  No previous data, using: {currency_start}")
                
                # Check if we need to fetch data for this currency
                if not latest_date or currency_start <= date.today():
                    # Only update if we're not already up to date
                    if not latest_date or currency_start <= end_date or (not end_date and currency_start <= date.today()):
                        logger.info(f"  Adding to update list with start_date={currency_start}")
                        currencies_to_update.append(currency)
                        currency_start_dates[currency] = currency_start
                    else:
                        logger.info(f"  Skipping: already up to date through {latest_date}")
                else:
                    logger.info(f"  Skipping: start date {currency_start} is in the future")
            elif start_date:
                logger.info(f"  Historical update mode for {currency}")
                # For regular historical updates, use the provided start date
                if not latest_date or start_date > latest_date:
                    logger.info(f"  Adding to update list with start_date={start_date}")
                    currency_start_dates[currency] = start_date
                    currencies_to_update.append(currency)
                else:
                    logger.info(f"  Skipping: start_date {start_date} <= latest_date {latest_date}")
            else:
                logger.info(f"  Regular update mode for {currency}")
                # For regular updates, check if we need to fetch rates
                should_fetch = ExchangeRateService._should_fetch_yesterday_rates(latest_date)
                logger.info(f"  Should fetch yesterday's rates: {should_fetch}")
                if should_fetch:
                    # Start from the day after our latest rate, or from a reasonable default
                    if latest_date:
                        currency_start_dates[currency] = latest_date + timedelta(days=1)
                        logger.info(f"  Adding to update list with start_date={currency_start_dates[currency]}")
                    else:
                        currency_start_dates[currency] = date.today() - timedelta(days=1)
                        logger.info(f"  No previous rates, using yesterday: {currency_start_dates[currency]}")
                    currencies_to_update.append(currency)
                else:
                    logger.info(f"  No update needed for {currency}")
        
        if not currencies_to_update:
            logger.info("No currencies need updating")
            return ExchangeRateUpdate(
                update_type=update_type,
                start_date=date.today() - timedelta(days=1),
                end_date=date.today() - timedelta(days=1),
                status='completed',
                currencies=currencies,
                completed_at=datetime.utcnow()
            )
        
        logger.info(f"Fetching rates for: {', '.join(currencies_to_update)}")
        
        # Create update record
        update_record = ExchangeRateUpdate(
            update_type=update_type,
            start_date=min(currency_start_dates.values()),
            end_date=end_date or (date.today() - timedelta(days=1)),
            status='processing',
            currencies=currencies_to_update
        )
        db.add(update_record)
        db.commit()
        
        try:
            # Process each currency that needs updating
            for currency in currencies_to_update:
                current_start = currency_start_dates[currency]
                current_end = end_date or (date.today() - timedelta(days=1))
                
                logger.info(f"Processing {currency} from {current_start} to {current_end}")
                
                # Process in chunks
                while current_start <= current_end:
                    chunk_end = min(
                        current_start + timedelta(days=ExchangeRateService.CHUNK_SIZE_DAYS),
                        current_end
                    )
                    
                    try:
                        rates = await ExchangeRateService.fetch_sdw_rates(
                            currency, current_start, chunk_end
                        )
                        
                        if rates:
                            for rate_data in rates:
                                existing_rate = ExchangeRateService.get_rate(
                                    db, rate_data['currency'], rate_data['date']
                                )
                                
                                if existing_rate:
                                    if existing_rate.rate != rate_data['rate']:
                                        existing_rate.rate = rate_data['rate']
                                else:
                                    new_rate = ExchangeRate(
                                        date=rate_data['date'],
                                        currency=rate_data['currency'],
                                        rate=rate_data['rate']
                                    )
                                    db.add(new_rate)
                            
                            db.commit()
                        else:
                            # Track missing dates for business days
                            missing_dates = [
                                current_start + timedelta(days=x)
                                for x in range((chunk_end - current_start).days + 1)
                                if not ExchangeRateService._is_weekend(current_start + timedelta(days=x))
                            ]
                            if missing_dates:
                                if update_record.missing_dates is None:
                                    update_record.missing_dates = []
                                update_record.missing_dates.extend(missing_dates)
                                db.commit()
                    
                    except Exception as e:
                        logger.error(f"Failed to process chunk for {currency}: {str(e)}")
                        if update_record.missing_dates is None:
                            update_record.missing_dates = []
                        update_record.missing_dates.extend([
                            current_start + timedelta(days=x)
                            for x in range((chunk_end - current_start).days + 1)
                            if not ExchangeRateService._is_weekend(current_start + timedelta(days=x))
                        ])
                        db.commit()
                    
                    current_start = chunk_end + timedelta(days=1)
            
            # Update record status
            update_record.status = 'completed'
            update_record.completed_at = datetime.utcnow()
            db.commit()
            
            if update_record.missing_dates:
                logger.info(f"Update completed with {len(update_record.missing_dates)} missing business days")
            else:
                logger.info("Update completed successfully with no missing dates")
            
        except Exception as e:
            logger.error(f"Failed to complete {update_type} update: {str(e)}")
            update_record.status = 'failed'
            update_record.error = str(e)
            db.commit()
            raise
        
        return update_record

    @staticmethod
    async def process_update_chunk(
        db: Session,
        update_record: ExchangeRateUpdate,
        chunk_start: date,
        chunk_end: date
    ) -> None:
        """
        Process a chunk of dates for rate updates.
        Includes error handling and missing date tracking.
        """
        for currency in update_record.currencies:
            try:
                rates = await ExchangeRateService.fetch_sdw_rates(
                    currency, chunk_start, chunk_end
                )
                
                for rate_data in rates:
                    existing_rate = ExchangeRateService.get_rate(
                        db, rate_data['currency'], rate_data['date']
                    )
                    
                    if existing_rate:
                        # Update existing rate if different
                        if existing_rate.rate != rate_data['rate']:
                            existing_rate.rate = rate_data['rate']
                    else:
                        # Create new rate
                        new_rate = ExchangeRate(
                            date=rate_data['date'],
                            currency=rate_data['currency'],
                            rate=rate_data['rate']
                        )
                        db.add(new_rate)
                
                db.commit()
                
            except Exception as e:
                logger.error(f"Failed to fetch rates for {currency}: {str(e)}")
                db.rollback()
                raise

    @staticmethod
    async def cleanup_old_updates(db: Session, days_to_keep: int = 30) -> None:
        """
        Remove old completed update records.
        Keeps failed updates for review and recent updates for history.
        """
        logger.info("Starting cleanup of old update records")
        
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        try:
            # Delete old completed records
            deleted = db.query(ExchangeRateUpdate).filter(
                ExchangeRateUpdate.status == 'completed',
                ExchangeRateUpdate.completed_at < cutoff_date
            ).delete()
            
            db.commit()
            logger.info(f"Deleted {deleted} old update records")
            
        except Exception as e:
            logger.error(f"Failed to cleanup old updates: {str(e)}")
            db.rollback()
            raise

    @staticmethod
    def get_update_statistics(db: Session) -> Dict:
        """
        Get statistics about exchange rate updates and coverage.
        """
        try:
            # Get total rates count
            total_rates = db.query(ExchangeRate).count()
            
            # Get latest rate date
            latest_rate = db.query(ExchangeRate).order_by(
                ExchangeRate.date.desc()
            ).first()
            
            # Get currency coverage
            currency_coverage = (
                db.query(
                    ExchangeRate.currency,
                    func.count(ExchangeRate.id).label('count')
                )
                .group_by(ExchangeRate.currency)
                .all()
            )
            
            # Get count of missing dates from recent updates
            recent_missing = (
                db.query(ExchangeRateUpdate)
                .filter(ExchangeRateUpdate.missing_dates.isnot(None))
                .order_by(ExchangeRateUpdate.created_at.desc())
                .limit(10)
                .all()
            )
            
            missing_dates_count = sum(
                len(update.missing_dates or [])
                for update in recent_missing
            )
            
            return {
                'total_rates': total_rates,
                'latest_rate_date': latest_rate.date if latest_rate else None,
                'currencies_coverage': {
                    curr: count for curr, count in currency_coverage
                },
                'missing_dates_count': missing_dates_count
            }
            
        except Exception as e:
            logger.error(f"Failed to get update statistics: {str(e)}")
            raise

    @staticmethod
    def get_closest_rate(db: Session, currency: str, target_date: date) -> Optional[ExchangeRate]:
        """
        Try to find an exchange rate for the target date, or the closest date within +/- 1 day.
        Returns None if no rate is found within the range.
        """
        # First try exact date
        rate = (
            db.query(ExchangeRate)
            .filter(
                ExchangeRate.currency == currency,
                ExchangeRate.date == target_date
            )
            .first()
        )
        if rate:
            return rate
            
        # Try +/- 1 day, ordered by closeness to target date
        next_day = target_date + timedelta(days=1)
        prev_day = target_date - timedelta(days=1)
        
        return (
            db.query(ExchangeRate)
            .filter(
                ExchangeRate.currency == currency,
                ExchangeRate.date.in_([prev_day, next_day])
            )
            .order_by(
                # Order by absolute difference from target date
                ExchangeRate.date.desc()
            )
            .first()
        )

    @staticmethod
    def get_rate(db: Session, currency: str, date_needed: date) -> Optional[ExchangeRate]:
        """
        Get the exchange rate for a currency on a specific date.
        First tries exact date, then +/- 1 day.
        Returns None if no rate is found within the range.
        """
        return ExchangeRateService.get_closest_rate(db, currency, date_needed)

    @staticmethod
    def get_rates_for_date(db: Session, rate_date: date) -> Dict[str, Decimal]:
        """Get all exchange rates for a specific date"""
        rates = db.query(ExchangeRate).filter(
            ExchangeRate.date == rate_date
        ).all()
        return {rate.currency: rate.rate for rate in rates}

    @staticmethod
    async def update_rates(db: Session) -> None:
        """Update exchange rates in the database with latest data"""
        rates = await ExchangeRateService.fetch_latest_rates()
        today = date.today()
        
        for currency, rate in rates.items():
            existing_rate = ExchangeRateService.get_rate(db, currency, today)
            if existing_rate:
                existing_rate.rate = rate
            else:
                new_rate = ExchangeRate(
                    date=today,
                    currency=currency,
                    rate=rate
                )
                db.add(new_rate)
        
        db.commit()

    @staticmethod
    def manage_rate_update_sync(
        db: Session,
        update_type: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        currencies: Optional[List[str]] = None
    ) -> ExchangeRateUpdate:
        """
        Synchronous version of manage_rate_update for Celery tasks.
        """
        logger.info(f"Starting {update_type} exchange rate update (sync) with params:")
        logger.info(f"  start_date: {start_date}")
        logger.info(f"  end_date: {end_date}")
        logger.info(f"  currencies: {currencies}")
        
        if not currencies:
            currencies = ExchangeRateService.DEFAULT_CURRENCIES
            logger.info(f"Using default currencies: {currencies}")

        # For each currency, determine if we need to fetch rates
        currencies_to_update = []
        currency_start_dates = {}
        
        for currency in currencies:
            latest_date = ExchangeRateService._get_latest_rate_date(db, currency)
            logger.info(f"Checking {currency}:")
            logger.info(f"  Latest rate date: {latest_date}")
            
            if update_type == 'manual_historical':
                logger.info(f"  Manual historical update mode for {currency}")
                
                # Calculate the earliest date we need to start from
                currency_start = None
                
                # If there's a latest date, the earliest we want to start is the day after that
                if latest_date:
                    currency_start = latest_date + timedelta(days=1)
                    logger.info(f"  Day after latest rate: {currency_start}")
                
                # If a start_date was provided, we don't want to go earlier than that
                if start_date and (not currency_start or start_date < currency_start):
                    currency_start = start_date
                    logger.info(f"  Using provided start_date: {currency_start}")
                
                # If we have no latest date, use the provided start_date or default to yesterday
                if not currency_start:
                    currency_start = start_date or (date.today() - timedelta(days=1))
                    logger.info(f"  No previous data, using: {currency_start}")
                
                # Check if we need to fetch data for this currency
                if not latest_date or currency_start <= date.today():
                    # Only update if we're not already up to date
                    if not latest_date or currency_start <= end_date or (not end_date and currency_start <= date.today()):
                        logger.info(f"  Adding to update list with start_date={currency_start}")
                        currencies_to_update.append(currency)
                        currency_start_dates[currency] = currency_start
                    else:
                        logger.info(f"  Skipping: already up to date through {latest_date}")
                else:
                    logger.info(f"  Skipping: start date {currency_start} is in the future")
            elif start_date:
                logger.info(f"  Historical update mode for {currency}")
                # For regular historical updates, use the provided start date
                if not latest_date or start_date > latest_date:
                    logger.info(f"  Adding to update list with start_date={start_date}")
                    currency_start_dates[currency] = start_date
                    currencies_to_update.append(currency)
                else:
                    logger.info(f"  Skipping: start_date {start_date} <= latest_date {latest_date}")
            else:
                logger.info(f"  Regular update mode for {currency}")
                # For regular updates, check if we need to fetch rates
                should_fetch = ExchangeRateService._should_fetch_yesterday_rates(latest_date)
                logger.info(f"  Should fetch yesterday's rates: {should_fetch}")
                if should_fetch:
                    # Start from the day after our latest rate, or from a reasonable default
                    if latest_date:
                        currency_start_dates[currency] = latest_date + timedelta(days=1)
                        logger.info(f"  Adding to update list with start_date={currency_start_dates[currency]}")
                    else:
                        currency_start_dates[currency] = date.today() - timedelta(days=1)
                        logger.info(f"  No previous rates, using yesterday: {currency_start_dates[currency]}")
                    currencies_to_update.append(currency)
                else:
                    logger.info(f"  No update needed for {currency}")
        
        if not currencies_to_update:
            logger.info("No currencies need updating")
            return ExchangeRateUpdate(
                update_type=update_type,
                start_date=date.today() - timedelta(days=1),
                end_date=date.today() - timedelta(days=1),
                status='completed',
                currencies=currencies,
                completed_at=datetime.utcnow()
            )
        
        logger.info(f"Fetching rates for: {', '.join(currencies_to_update)}")
        
        # Create update record
        update_record = ExchangeRateUpdate(
            update_type=update_type,
            start_date=min(currency_start_dates.values()),
            end_date=end_date or (date.today() - timedelta(days=1)),
            status='processing',
            currencies=currencies_to_update
        )
        db.add(update_record)
        db.commit()
        
        try:
            # Process each currency that needs updating
            for currency in currencies_to_update:
                current_start = currency_start_dates[currency]
                current_end = end_date or (date.today() - timedelta(days=1))
                
                logger.info(f"Processing {currency} from {current_start} to {current_end}")
                
                # Process in chunks
                while current_start <= current_end:
                    chunk_end = min(
                        current_start + timedelta(days=ExchangeRateService.CHUNK_SIZE_DAYS),
                        current_end
                    )
                    
                    try:
                        rates = ExchangeRateService.fetch_sdw_rates_sync(
                            currency, current_start, chunk_end
                        )
                        
                        if rates:
                            for rate_data in rates:
                                existing_rate = ExchangeRateService.get_rate(
                                    db, rate_data['currency'], rate_data['date']
                                )
                                
                                if existing_rate:
                                    if existing_rate.rate != rate_data['rate']:
                                        existing_rate.rate = rate_data['rate']
                                else:
                                    new_rate = ExchangeRate(
                                        date=rate_data['date'],
                                        currency=rate_data['currency'],
                                        rate=rate_data['rate']
                                    )
                                    db.add(new_rate)
                            
                            db.commit()
                        else:
                            # Track missing dates for business days
                            missing_dates = [
                                current_start + timedelta(days=x)
                                for x in range((chunk_end - current_start).days + 1)
                                if not ExchangeRateService._is_weekend(current_start + timedelta(days=x))
                            ]
                            if missing_dates:
                                if update_record.missing_dates is None:
                                    update_record.missing_dates = []
                                update_record.missing_dates.extend(missing_dates)
                                db.commit()
                    
                    except Exception as e:
                        logger.error(f"Failed to process chunk for {currency}: {str(e)}")
                        if update_record.missing_dates is None:
                            update_record.missing_dates = []
                        update_record.missing_dates.extend([
                            current_start + timedelta(days=x)
                            for x in range((chunk_end - current_start).days + 1)
                            if not ExchangeRateService._is_weekend(current_start + timedelta(days=x))
                        ])
                        db.commit()
                    
                    current_start = chunk_end + timedelta(days=1)
            
            # Update record status
            update_record.status = 'completed'
            update_record.completed_at = datetime.utcnow()
            db.commit()
            
            if update_record.missing_dates:
                logger.info(f"Update completed with {len(update_record.missing_dates)} missing business days")
            else:
                logger.info("Update completed successfully with no missing dates")
            
        except Exception as e:
            logger.error(f"Failed to complete {update_type} update: {str(e)}")
            update_record.status = 'failed'
            update_record.error = str(e)
            db.commit()
            raise
        
        return update_record

    @staticmethod
    def _should_fetch_rates(target_date: date) -> bool:
        """
        Determine if we should attempt to fetch rates for a given date.
        
        Args:
            target_date: The date to check
            
        Returns:
            bool: True if we should attempt to fetch rates, False otherwise
        """
        today = date.today()
        
        # If target date is in the future, we shouldn't fetch
        if target_date > today:
            return False
            
        # If target date is today, check the time
        if target_date == today:
            # Get current time in CET/CEST
            cet = pytz.timezone('Europe/Paris')
            now = datetime.now(cet)
            
            # Check if it's before publication time
            if (now.hour < ExchangeRateService.ECB_PUBLICATION_HOUR or 
                (now.hour == ExchangeRateService.ECB_PUBLICATION_HOUR and 
                 now.minute < ExchangeRateService.ECB_PUBLICATION_MINUTE)):
                return False
        
        return True

    @staticmethod
    def _is_weekend(check_date: date) -> bool:
        """Check if the given date is a weekend."""
        return check_date.weekday() >= 5

    @staticmethod
    def fetch_sdw_rates_sync(currency: str, start_date: date, end_date: date) -> List[Dict]:
        """
        Synchronous version of fetch_sdw_rates for Celery tasks.
        Uses httpx for synchronous HTTP calls.
        """
        import httpx
        import time
        
        # Early return for future dates
        today = date.today()
        if start_date > today:
            logger.info(f"Skipping future date range for {currency}: {start_date} to {end_date}")
            return []

        # If start date is a weekend, move to next business day
        while ExchangeRateService._is_weekend(start_date):
            start_date = start_date + timedelta(days=1)
            if start_date > end_date:
                logger.info(f"After skipping weekend, start date {start_date} is beyond end date {end_date}")
                return []

        url = ExchangeRateService.build_sdw_url(currency, start_date, end_date)
        logger.info(f"Fetching rates for {currency} from {url}")
        
        # Initialize retry mechanism
        max_retries = 3
        retry_count = 0
        retry_delay = 1  # Initial delay in seconds
        
        while retry_count < max_retries:
            try:
                response = httpx.get(
                    url,
                    timeout=30.0,
                    headers={
                        'Accept': 'application/json',
                        'User-Agent': 'Goldfinch/1.0'
                    }
                )
                
                logger.debug(f"Response status code: {response.status_code}")
                logger.debug(f"Response headers: {dict(response.headers)}")
                
                if response.status_code != 200:
                    error_msg = f"Failed to fetch rates for {currency}. Status: {response.status_code}"
                    logger.error(f"{error_msg}\nResponse content: {response.text[:1000]}")
                    if retry_count < max_retries - 1:
                        retry_count += 1
                        time.sleep(retry_delay)
                        retry_delay *= 2  # Exponential backoff
                        continue
                    return []
                
                # Handle empty response
                if not response.text.strip():
                    if not ExchangeRateService._is_weekend(start_date):
                        logger.error(f"Empty response for {currency} on business day: {start_date}")
                    else:
                        logger.info(f"No data available for {currency} on {start_date} (weekend/holiday)")
                    return []
                
                try:
                    data = response.json()
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON for {currency}: {str(e)}")
                    logger.error(f"Raw response: {response.text[:1000]}")
                    if retry_count < max_retries - 1:
                        retry_count += 1
                        time.sleep(retry_delay)
                        retry_delay *= 2
                        continue
                    return []
                
                try:
                    rates = ExchangeRateService._parse_sdmx_response(data, currency, start_date, end_date)
                    if rates:
                        logger.info(f"Successfully fetched {len(rates)} rates for {currency}")
                        return rates
                    elif not ExchangeRateService._is_weekend(start_date):
                        logger.error(f"No rates found for {currency} on business day: {start_date}")
                    return []
                    
                except ValueError as e:
                    logger.error(f"Failed to parse SDMX data for {currency}: {str(e)}")
                    logger.error(f"Data structure: {json.dumps(data)[:1000]}")
                    if retry_count < max_retries - 1:
                        retry_count += 1
                        time.sleep(retry_delay)
                        retry_delay *= 2
                        continue
                    return []
                    
            except requests.RequestException as e:
                logger.error(f"Request failed for {currency}: {str(e)}")
                if retry_count < max_retries - 1:
                    retry_count += 1
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
                return []
            
            break  # Break the retry loop if we get here (successful response)
        
        return []  # Return empty list if all retries failed

    @staticmethod
    def cleanup_old_updates_sync(db: Session, days_to_keep: int = 30) -> None:
        """
        Synchronous version of cleanup_old_updates for Celery tasks.
        """
        logger.info("Starting cleanup of old update records")
        
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        try:
            # Delete old completed records
            deleted = db.query(ExchangeRateUpdate).filter(
                ExchangeRateUpdate.status == 'completed',
                ExchangeRateUpdate.completed_at < cutoff_date
            ).delete()
            
            db.commit()
            logger.info(f"Deleted {deleted} old update records")
            
        except Exception as e:
            logger.error(f"Failed to cleanup old updates: {str(e)}")
            db.rollback()
            raise 

    @staticmethod
    async def fetch_latest_currency_rates(
        db: Session,
        currencies: Optional[List[str]] = None,
        update_type: str = 'startup'
    ) -> List[str]:
        """
        Checks which currencies need updating and fetches the latest rates for them.
        This is more streamlined than manage_rate_update and is designed for application startup.
        
        Args:
            db: Database session
            currencies: Optional list of currencies to check and update
            update_type: Type of update ('startup' or 'daily')
        
        Returns:
            List of currencies that were updated
        """
        if not currencies:
            currencies = ExchangeRateService.DEFAULT_CURRENCIES
            logger.info(f"Using default currencies: {currencies}")
        
        currencies_to_update = []
        currency_start_dates = {}
        
        logger.info(f"Checking currencies for rate updates ({update_type}):")
        for currency in currencies:
            latest_date = ExchangeRateService._get_latest_rate_date(db, currency)
            should_fetch = ExchangeRateService._should_fetch_yesterday_rates(latest_date)
            
            logger.info(f"  {currency}: latest_date={latest_date}, should_fetch={should_fetch}")
            
            if should_fetch:
                currencies_to_update.append(currency)
                if latest_date:
                    currency_start_dates[currency] = latest_date + timedelta(days=1)
                else:
                    currency_start_dates[currency] = date.today() - timedelta(days=1)
                logger.info(f"  Adding {currency} to update list, start_date={currency_start_dates[currency]}")
        
        if not currencies_to_update:
            logger.info("All currencies are up to date. No updates needed.")
            return []
        
        logger.info(f"Fetching rates for: {currencies_to_update}")
        
        # Create update record
        update_record = ExchangeRateUpdate(
            update_type=update_type,
            start_date=min(currency_start_dates.values()),
            end_date=date.today() - timedelta(days=1),
            status='processing',
            currencies=currencies_to_update
        )
        db.add(update_record)
        db.commit()
        
        try:
            # Process each currency that needs updating
            for currency in currencies_to_update:
                current_start = currency_start_dates[currency]
                current_end = date.today() - timedelta(days=1)
                
                logger.info(f"Processing {currency} from {current_start} to {current_end}")
                
                # Process in chunks
                while current_start <= current_end:
                    chunk_end = min(
                        current_start + timedelta(days=ExchangeRateService.CHUNK_SIZE_DAYS),
                        current_end
                    )
                    
                    try:
                        rates = await ExchangeRateService.fetch_sdw_rates(
                            currency, current_start, chunk_end
                        )
                        
                        if rates:
                            for rate_data in rates:
                                existing_rate = ExchangeRateService.get_rate(
                                    db, rate_data['currency'], rate_data['date']
                                )
                                
                                if existing_rate:
                                    if existing_rate.rate != rate_data['rate']:
                                        existing_rate.rate = rate_data['rate']
                                else:
                                    new_rate = ExchangeRate(
                                        date=rate_data['date'],
                                        currency=rate_data['currency'],
                                        rate=rate_data['rate']
                                    )
                                    db.add(new_rate)
                            
                            db.commit()
                        else:
                            # Track missing dates for business days
                            missing_dates = [
                                current_start + timedelta(days=x)
                                for x in range((chunk_end - current_start).days + 1)
                                if not ExchangeRateService._is_weekend(current_start + timedelta(days=x))
                            ]
                            if missing_dates:
                                if update_record.missing_dates is None:
                                    update_record.missing_dates = []
                                update_record.missing_dates.extend(missing_dates)
                                db.commit()
                    
                    except Exception as e:
                        logger.error(f"Failed to process chunk for {currency}: {str(e)}")
                        if update_record.missing_dates is None:
                            update_record.missing_dates = []
                        update_record.missing_dates.extend([
                            current_start + timedelta(days=x)
                            for x in range((chunk_end - current_start).days + 1)
                            if not ExchangeRateService._is_weekend(current_start + timedelta(days=x))
                        ])
                        db.commit()
                    
                    current_start = chunk_end + timedelta(days=1)
            
            # Update record status
            update_record.status = 'completed'
            update_record.completed_at = datetime.utcnow()
            db.commit()
            
            if update_record.missing_dates:
                logger.info(f"Update completed with {len(update_record.missing_dates)} missing business days")
            else:
                logger.info("Update completed successfully with no missing dates")
            
        except Exception as e:
            logger.error(f"Failed to complete rate update: {str(e)}")
            update_record.status = 'failed'
            update_record.error = str(e)
            db.commit()
            raise
        
        return currencies_to_update

    @staticmethod
    def fetch_latest_currency_rates_sync(
        db: Session,
        currencies: Optional[List[str]] = None,
        update_type: str = 'startup'
    ) -> List[str]:
        """
        Synchronous version of fetch_latest_currency_rates.
        Checks which currencies need updating and fetches the latest rates for them.
        Designed for application startup and Celery tasks.
        
        Args:
            db: Database session
            currencies: Optional list of currencies to check and update
            update_type: Type of update ('startup' or 'daily')
        
        Returns:
            List of currencies that were updated
        """
        if not currencies:
            currencies = ExchangeRateService.DEFAULT_CURRENCIES
            logger.info(f"Using default currencies: {currencies}")
        
        currencies_to_update = []
        currency_start_dates = {}
        
        logger.info(f"Checking currencies for rate updates ({update_type}):")
        for currency in currencies:
            latest_date = ExchangeRateService._get_latest_rate_date(db, currency)
            should_fetch = ExchangeRateService._should_fetch_yesterday_rates(latest_date)
            
            logger.info(f"  {currency}: latest_date={latest_date}, should_fetch={should_fetch}")
            
            if should_fetch:
                currencies_to_update.append(currency)
                if latest_date:
                    currency_start_dates[currency] = latest_date + timedelta(days=1)
                else:
                    currency_start_dates[currency] = date.today() - timedelta(days=1)
                logger.info(f"  Adding {currency} to update list, start_date={currency_start_dates[currency]}")
        
        if not currencies_to_update:
            logger.info("All currencies are up to date. No updates needed.")
            return []
        
        logger.info(f"Fetching rates for: {currencies_to_update}")
        
        # Create update record
        update_record = ExchangeRateUpdate(
            update_type=update_type,
            start_date=min(currency_start_dates.values()),
            end_date=date.today() - timedelta(days=1),
            status='processing',
            currencies=currencies_to_update
        )
        db.add(update_record)
        db.commit()
        
        try:
            # Process each currency that needs updating
            for currency in currencies_to_update:
                current_start = currency_start_dates[currency]
                current_end = date.today() - timedelta(days=1)
                
                logger.info(f"Processing {currency} from {current_start} to {current_end}")
                
                # Process in chunks
                while current_start <= current_end:
                    chunk_end = min(
                        current_start + timedelta(days=ExchangeRateService.CHUNK_SIZE_DAYS),
                        current_end
                    )
                    
                    try:
                        rates = ExchangeRateService.fetch_sdw_rates_sync(
                            currency, current_start, chunk_end
                        )
                        
                        if rates:
                            for rate_data in rates:
                                existing_rate = ExchangeRateService.get_rate(
                                    db, rate_data['currency'], rate_data['date']
                                )
                                
                                if existing_rate:
                                    if existing_rate.rate != rate_data['rate']:
                                        existing_rate.rate = rate_data['rate']
                                else:
                                    new_rate = ExchangeRate(
                                        date=rate_data['date'],
                                        currency=rate_data['currency'],
                                        rate=rate_data['rate']
                                    )
                                    db.add(new_rate)
                            
                            db.commit()
                        else:
                            # Track missing dates for business days
                            missing_dates = [
                                current_start + timedelta(days=x)
                                for x in range((chunk_end - current_start).days + 1)
                                if not ExchangeRateService._is_weekend(current_start + timedelta(days=x))
                            ]
                            if missing_dates:
                                if update_record.missing_dates is None:
                                    update_record.missing_dates = []
                                update_record.missing_dates.extend(missing_dates)
                                db.commit()
                    
                    except Exception as e:
                        logger.error(f"Failed to process chunk for {currency}: {str(e)}")
                        if update_record.missing_dates is None:
                            update_record.missing_dates = []
                        update_record.missing_dates.extend([
                            current_start + timedelta(days=x)
                            for x in range((chunk_end - current_start).days + 1)
                            if not ExchangeRateService._is_weekend(current_start + timedelta(days=x))
                        ])
                        db.commit()
                    
                    current_start = chunk_end + timedelta(days=1)
            
            # Update record status
            update_record.status = 'completed'
            update_record.completed_at = datetime.utcnow()
            db.commit()
            
            if update_record.missing_dates:
                logger.info(f"Update completed with {len(update_record.missing_dates)} missing business days")
            else:
                logger.info("Update completed successfully with no missing dates")
            
        except Exception as e:
            logger.error(f"Failed to complete rate update: {str(e)}")
            update_record.status = 'failed'
            update_record.error = str(e)
            db.commit()
            raise
        
        return currencies_to_update 