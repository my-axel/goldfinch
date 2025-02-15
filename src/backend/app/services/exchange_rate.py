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
        key = f"D.{currency}.EUR.SP00.A"  # Daily rate, CURRENCY vs EUR, Foreign exchange reference rates
        
        parameters = {
            'startPeriod': start_date.isoformat(),
            'endPeriod': end_date.isoformat(),
            'format': 'jsondata'  # Request JSON format
        }
        
        url = f"{ExchangeRateService.SDW_BASE_URL}{resource}/{flowRef}/{key}"
        if parameters:
            url += "?" + urlencode(parameters)
        
        return url

    @staticmethod
    async def fetch_sdw_rates(currency: str, start_date: date, end_date: date) -> List[Dict]:
        """Fetch historical exchange rates from ECB Statistical Data Warehouse"""
        url = ExchangeRateService.build_sdw_url(currency, start_date, end_date)
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=503,
                    detail=f"Failed to fetch exchange rates from ECB SDW for {currency}"
                )
            
            data = response.json()
            
            # Extract the time series data
            try:
                observations = data['dataSets'][0]['series']['0:0:0:0']['observations']
                time_periods = data['structure']['dimensions']['observation'][0]['values']
                
                result = []
                for i, period_info in enumerate(time_periods):
                    if str(i) in observations:
                        rate_date = date.fromisoformat(period_info['id'])
                        rate_value = Decimal(str(observations[str(i)][0]))
                        # Convert from EUR/Currency to Currency/EUR
                        rate = Decimal('1') / rate_value
                        result.append({
                            'date': rate_date,
                            'currency': currency,
                            'rate': rate
                        })
                return result
            except (KeyError, IndexError) as e:
                raise HTTPException(
                    status_code=503,
                    detail=f"Failed to parse ECB SDW response for {currency}: {str(e)}"
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
    def get_rate(db: Session, currency: str, rate_date: date) -> Optional[ExchangeRate]:
        """Get exchange rate for a specific currency and date"""
        return db.query(ExchangeRate).filter(
            ExchangeRate.currency == currency,
            ExchangeRate.date == rate_date
        ).first()

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