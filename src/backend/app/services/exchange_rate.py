from datetime import date, timedelta
import httpx
import xmltodict
from decimal import Decimal
from typing import Dict, Optional, List
from sqlalchemy.orm import Session
from app.models.exchange_rate import ExchangeRate
from app.schemas.exchange_rate import ExchangeRateCreate
from fastapi import HTTPException
import json
from urllib.parse import urlencode
import decimal

class ExchangeRateNotFoundError(Exception):
    """Raised when an exchange rate is not found for a specific currency and date."""
    pass

class ExchangeRateService:
    # ECB Statistical Data Warehouse API
    SDW_BASE_URL = "https://sdw-wsrest.ecb.europa.eu/service/"
    
    # We'll keep the daily XML endpoint as a fallback for latest rates
    ECB_DAILY_RATES_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"

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
    async def backfill_historical_rates(
        db: Session,
        start_date: date,
        end_date: date = None,
        currencies: List[str] = None
    ) -> None:
        """
        Backfill historical exchange rates from ECB Statistical Data Warehouse.
        
        Args:
            db: Database session
            start_date: Start date for historical data
            end_date: End date for historical data (defaults to today)
            currencies: List of currencies to fetch (defaults to common currencies)
        """
        if end_date is None:
            end_date = date.today()
            
        if currencies is None:
            currencies = ['USD', 'CHF', 'GBP', 'JPY']  # Add more default currencies as needed
        
        for currency in currencies:
            try:
                rates = await ExchangeRateService.fetch_sdw_rates(currency, start_date, end_date)
                
                for rate_data in rates:
                    existing_rate = ExchangeRateService.get_rate(
                        db, rate_data['currency'], rate_data['date']
                    )
                    
                    if not existing_rate:
                        new_rate = ExchangeRate(
                            date=rate_data['date'],
                            currency=rate_data['currency'],
                            rate=rate_data['rate']
                        )
                        db.add(new_rate)
                
                db.commit()
            except Exception as e:
                db.rollback()
                raise HTTPException(
                    status_code=503,
                    detail=f"Failed to backfill rates for {currency}: {str(e)}"
                )

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