from datetime import date, timedelta
import httpx
import xmltodict
from decimal import Decimal
from typing import Dict, Optional, List
from sqlalchemy.orm import Session
from app.models.exchange_rate import ExchangeRate
from app.schemas.exchange_rate import ExchangeRateCreate
from fastapi import HTTPException

class ExchangeRateService:
    ECB_DAILY_RATES_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"
    ECB_HISTORICAL_RATES_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml"

    @staticmethod
    async def fetch_latest_rates() -> Dict[str, Decimal]:
        """Fetch the latest exchange rates from ECB"""
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
    async def fetch_historical_rates() -> List[Dict]:
        """Fetch historical exchange rates from ECB (last 90 days)"""
        async with httpx.AsyncClient() as client:
            response = await client.get(ExchangeRateService.ECB_HISTORICAL_RATES_URL)
            if response.status_code != 200:
                raise HTTPException(status_code=503, detail="Failed to fetch historical rates from ECB")
            
            data = xmltodict.parse(response.text)
            daily_rates = data['gesmes:Envelope']['Cube']['Cube']
            
            result = []
            for day_data in daily_rates:
                day_date = date.fromisoformat(day_data['@time'])
                rates = {
                    rate['@currency']: Decimal(rate['@rate'])
                    for rate in day_data['Cube']
                }
                result.append({
                    'date': day_date,
                    'rates': rates
                })
            
            return result

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
        # Fetch latest rates
        rates = await ExchangeRateService.fetch_latest_rates()
        today = date.today()
        
        # Store each rate
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
    async def backfill_historical_rates(db: Session) -> None:
        """Backfill historical exchange rates from ECB"""
        historical_data = await ExchangeRateService.fetch_historical_rates()
        
        for day_data in historical_data:
            day_date = day_data['date']
            for currency, rate in day_data['rates'].items():
                existing_rate = ExchangeRateService.get_rate(db, currency, day_date)
                if not existing_rate:
                    new_rate = ExchangeRate(
                        date=day_date,
                        currency=currency,
                        rate=rate
                    )
                    db.add(new_rate)
        
        db.commit() 