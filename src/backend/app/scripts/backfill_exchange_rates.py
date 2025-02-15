import asyncio
from datetime import date, timedelta
import sys
import os
from typing import List
import time

# Add the parent directory to the Python path so we can import our app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.db.session import SessionLocal
from app.services.exchange_rate import ExchangeRateService

async def backfill_currency(db, currency: str, start_date: date, end_date: date):
    """Backfill a single currency for a specific date range"""
    try:
        await ExchangeRateService.backfill_historical_rates(
            db=db,
            start_date=start_date,
            end_date=end_date,
            currencies=[currency]
        )
        return True
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

async def backfill_historical_rates():
    """
    One-time script to backfill exchange rates from January 1, 2000 until today.
    This will fetch rates for all major currencies that might be used in ETFs.
    """
    db = SessionLocal()
    
    try:
        # Common currencies used in ETFs, ordered by importance
        currencies = [
            'USD',  # US Dollar (most important)
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
        
        start_date = date(2000, 1, 1)
        end_date = date.today()
        
        print(f"Starting backfill from {start_date} to {end_date}")
        print(f"Processing currencies: {', '.join(currencies)}")
        
        failed_chunks = []
        
        # Process each currency separately
        for currency in currencies:
            print(f"\n{currency}:", end="", flush=True)
            # Split the date range into 1-month chunks to avoid timeouts
            current_start = start_date
            chunk_count = 0
            success_count = 0
            
            while current_start <= end_date:
                # Calculate end of current chunk (1 month or end_date)
                current_end = min(
                    date(
                        current_start.year + (current_start.month) // 12,
                        ((current_start.month) % 12) + 1,
                        1
                    ) - timedelta(days=1),
                    end_date
                )
                
                chunk_count += 1
                retries = 3
                success = False
                
                while retries > 0 and not success:
                    success = await backfill_currency(db, currency, current_start, current_end)
                    if not success:
                        retries -= 1
                        if retries > 0:
                            await asyncio.sleep(5)
                    else:
                        success_count += 1
                        print(".", end="", flush=True)
                
                if not success:
                    print("x", end="", flush=True)
                    failed_chunks.append({
                        'currency': currency,
                        'start_date': current_start,
                        'end_date': current_end
                    })
                
                await asyncio.sleep(1)
                current_start = current_end + timedelta(days=1)
            
            print(f" ({success_count}/{chunk_count} chunks)")
            await asyncio.sleep(2)
        
        print("\nBackfill completed!")
        
        if failed_chunks:
            print("\nFailed chunks:")
            for chunk in failed_chunks:
                print(f"- {chunk['currency']}: {chunk['start_date']} to {chunk['end_date']}")
        
    except Exception as e:
        print(f"Error during backfill: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(backfill_historical_rates()) 