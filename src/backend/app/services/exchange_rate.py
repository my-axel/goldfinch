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
    SDW_BASE_URL = "https://sdw-wsrest.ecb.europa.eu/service/"
    
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
    async def fetch_sdw_rates(currency: str, start_date: date, end_date: date) -> List[Dict]:
        """Fetch historical exchange rates from ECB Statistical Data Warehouse"""
        url = ExchangeRateService.build_sdw_url(currency, start_date, end_date)
        
        async with httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={
                'Accept': 'application/json',
                'User-Agent': 'Goldfinch/1.0'
            }
        ) as client:
            try:
                response = await client.get(url)
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=503,
                        detail=f"Failed to fetch rates for {currency}. Status: {response.status_code}"
                    )
                
                try:
                    data = response.json()
                except json.JSONDecodeError as e:
                    raise HTTPException(
                        status_code=503,
                        detail=f"Invalid JSON response for {currency}"
                    )
                
                try:
                    if 'dataSets' not in data:
                        raise ValueError("No datasets found in response")

                    dataset = data['dataSets'][0]
                    if 'series' not in dataset:
                        raise ValueError("No series found in dataset")

                    series_keys = list(dataset['series'].keys())
                    if not series_keys:
                        raise ValueError("No series data found")
                    
                    series_key = series_keys[0]
                    observations = dataset['series'][series_key]['observations']
                    time_periods = data['structure']['dimensions']['observation'][0]['values']
                    
                    result = []
                    skipped_count = 0
                    
                    for i, period_info in enumerate(time_periods):
                        period_id = str(i)
                        if period_id in observations:
                            try:
                                rate_date = date.fromisoformat(period_info['id'])
                                raw_value = observations[period_id][0]
                                
                                # Skip None values (weekends/holidays) without error
                                if raw_value is None:
                                    skipped_count += 1
                                    continue
                                
                                # Handle potential string values and clean them
                                if isinstance(raw_value, str):
                                    raw_value = raw_value.strip().replace(',', '.')
                                
                                try:
                                    rate_value = Decimal(str(raw_value))
                                except (decimal.InvalidOperation, decimal.ConversionSyntax):
                                    skipped_count += 1
                                    continue
                                
                                if rate_value == 0:
                                    skipped_count += 1
                                    continue
                                
                                # Store rate in EUR/XXX format (how many XXX you get for 1 EUR)
                                # If we receive XXX/EUR, we need to invert it
                                if rate_value < 1 and currency in ['USD', 'GBP', 'CHF']:  # Common currencies that should be > 1
                                    rate = Decimal('1') / rate_value
                                else:
                                    rate = rate_value
                                
                                result.append({
                                    'date': rate_date,
                                    'currency': currency,
                                    'rate': rate
                                })
                            except (ValueError, KeyError, IndexError):
                                skipped_count += 1
                                continue
                    
                    if not result:
                        raise ValueError("No valid rates found in the response")
                    
                    return result
                    
                except (KeyError, IndexError, ValueError) as e:
                    raise HTTPException(
                        status_code=503,
                        detail=f"Failed to parse response for {currency}: {str(e)}"
                    )
                    
            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=503,
                    detail=f"Timeout while fetching rates for {currency}"
                )
            except Exception as e:
                raise HTTPException(
                    status_code=503,
                    detail=f"Error fetching rates for {currency}: {str(e)}"
                )

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
        
        Args:
            db: Database session
            update_type: One of 'historical', 'daily', 'manual_historical', 'manual_latest'
            start_date: Start date for historical data (optional)
            end_date: End date for historical data (optional)
            currencies: List of currencies to fetch (optional)
        
        Returns:
            The created update record
        """
        logger.info(f"Starting {update_type} exchange rate update")
        
        # Determine date range
        if not end_date:
            end_date = date.today()
            
        if not start_date:
            if update_type == 'daily':
                start_date = end_date
            else:
                # Get latest rate date from DB
                latest_rate = db.query(ExchangeRate).order_by(
                    ExchangeRate.date.desc()
                ).first()
                
                if latest_rate:
                    start_date = latest_rate.date + timedelta(days=1)
                else:
                    # No rates in DB, start from 1999
                    start_date = date(1999, 1, 1)
        
        if not currencies:
            currencies = ExchangeRateService.DEFAULT_CURRENCIES
            
        # Create update record
        update_record = ExchangeRateUpdate(
            update_type=update_type,
            start_date=start_date,
            end_date=end_date,
            status='processing',
            currencies=currencies
        )
        db.add(update_record)
        db.commit()
        
        try:
            # Process in chunks
            current_start = start_date
            while current_start <= end_date:
                chunk_end = min(
                    current_start + timedelta(days=ExchangeRateService.CHUNK_SIZE_DAYS),
                    end_date
                )
                
                logger.info(f"Processing chunk from {current_start} to {chunk_end}")
                
                try:
                    await ExchangeRateService.process_update_chunk(
                        db, update_record, current_start, chunk_end
                    )
                except Exception as e:
                    logger.error(f"Failed to process chunk: {str(e)}")
                    if update_record.missing_dates is None:
                        update_record.missing_dates = []
                    update_record.missing_dates.extend([
                        current_start + timedelta(days=x)
                        for x in range((chunk_end - current_start).days + 1)
                    ])
                    db.commit()
                
                current_start = chunk_end + timedelta(days=1)
            
            # Update record status
            update_record.status = 'completed'
            update_record.completed_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"Completed {update_type} exchange rate update")
            
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
        Has the same functionality but uses synchronous HTTP calls.
        """
        logger.info(f"Starting {update_type} exchange rate update (sync)")
        
        # Determine date range
        if not end_date:
            end_date = date.today()
            
        if not start_date:
            if update_type == 'daily':
                start_date = end_date
            else:
                # Get latest rate date from DB
                latest_rate = db.query(ExchangeRate).order_by(
                    ExchangeRate.date.desc()
                ).first()
                
                if latest_rate:
                    start_date = latest_rate.date + timedelta(days=1)
                else:
                    # No rates in DB, start from 1999
                    start_date = date(1999, 1, 1)
        
        if not currencies:
            currencies = ExchangeRateService.DEFAULT_CURRENCIES
            
        # Create update record
        update_record = ExchangeRateUpdate(
            update_type=update_type,
            start_date=start_date,
            end_date=end_date,
            status='processing',
            currencies=currencies
        )
        db.add(update_record)
        db.commit()
        
        try:
            # Process in chunks
            current_start = start_date
            while current_start <= end_date:
                chunk_end = min(
                    current_start + timedelta(days=ExchangeRateService.CHUNK_SIZE_DAYS),
                    end_date
                )
                
                logger.info(f"Processing chunk from {current_start} to {chunk_end}")
                
                try:
                    ExchangeRateService.process_update_chunk_sync(
                        db, update_record, current_start, chunk_end
                    )
                except Exception as e:
                    logger.error(f"Failed to process chunk: {str(e)}")
                    if update_record.missing_dates is None:
                        update_record.missing_dates = []
                    update_record.missing_dates.extend([
                        current_start + timedelta(days=x)
                        for x in range((chunk_end - current_start).days + 1)
                    ])
                    db.commit()
                
                current_start = chunk_end + timedelta(days=1)
            
            # Update record status
            update_record.status = 'completed'
            update_record.completed_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"Completed {update_type} exchange rate update")
            
        except Exception as e:
            logger.error(f"Failed to complete {update_type} update: {str(e)}")
            update_record.status = 'failed'
            update_record.error = str(e)
            db.commit()
            raise
        
        return update_record

    @staticmethod
    def process_update_chunk_sync(
        db: Session,
        update_record: ExchangeRateUpdate,
        chunk_start: date,
        chunk_end: date
    ) -> None:
        """
        Synchronous version of process_update_chunk for Celery tasks.
        """
        for currency in update_record.currencies:
            try:
                rates = ExchangeRateService.fetch_sdw_rates_sync(
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
    def fetch_sdw_rates_sync(currency: str, start_date: date, end_date: date) -> List[Dict]:
        """
        Synchronous version of fetch_sdw_rates for Celery tasks.
        Uses requests instead of httpx for synchronous HTTP calls.
        """
        import requests
        
        url = ExchangeRateService.build_sdw_url(currency, start_date, end_date)
        
        try:
            response = requests.get(
                url,
                timeout=30.0,
                headers={
                    'Accept': 'application/json',
                    'User-Agent': 'Goldfinch/1.0'
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=503,
                    detail=f"Failed to fetch rates for {currency}. Status: {response.status_code}"
                )
            
            try:
                data = response.json()
            except json.JSONDecodeError as e:
                raise HTTPException(
                    status_code=503,
                    detail=f"Invalid JSON response for {currency}"
                )
            
            try:
                if 'dataSets' not in data:
                    raise ValueError("No datasets found in response")

                dataset = data['dataSets'][0]
                if 'series' not in dataset:
                    raise ValueError("No series found in dataset")

                series_keys = list(dataset['series'].keys())
                if not series_keys:
                    raise ValueError("No series data found")
                
                series_key = series_keys[0]
                observations = dataset['series'][series_key]['observations']
                time_periods = data['structure']['dimensions']['observation'][0]['values']
                
                result = []
                skipped_count = 0
                
                for i, period_info in enumerate(time_periods):
                    period_id = str(i)
                    if period_id in observations:
                        try:
                            rate_date = date.fromisoformat(period_info['id'])
                            raw_value = observations[period_id][0]
                            
                            # Skip None values (weekends/holidays) without error
                            if raw_value is None:
                                skipped_count += 1
                                continue
                            
                            # Handle potential string values and clean them
                            if isinstance(raw_value, str):
                                raw_value = raw_value.strip().replace(',', '.')
                            
                            try:
                                rate_value = Decimal(str(raw_value))
                            except (decimal.InvalidOperation, decimal.ConversionSyntax):
                                skipped_count += 1
                                continue
                            
                            if rate_value == 0:
                                skipped_count += 1
                                continue
                            
                            # Store rate in EUR/XXX format (how many XXX you get for 1 EUR)
                            # If we receive XXX/EUR, we need to invert it
                            if rate_value < 1 and currency in ['USD', 'GBP', 'CHF']:  # Common currencies that should be > 1
                                rate = Decimal('1') / rate_value
                            else:
                                rate = rate_value
                            
                            result.append({
                                'date': rate_date,
                                'currency': currency,
                                'rate': rate
                            })
                        except (ValueError, KeyError, IndexError):
                            skipped_count += 1
                            continue
                
                if not result:
                    raise ValueError("No valid rates found in the response")
                
                return result
                
            except (KeyError, IndexError, ValueError) as e:
                raise HTTPException(
                    status_code=503,
                    detail=f"Failed to parse response for {currency}: {str(e)}"
                )
                
        except requests.Timeout:
            raise HTTPException(
                status_code=503,
                detail=f"Timeout while fetching rates for {currency}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"Error fetching rates for {currency}: {str(e)}"
            )

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