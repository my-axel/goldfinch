import yfinance as yf
from typing import Optional, Dict, Any, List, Tuple
from datetime import date, datetime, timedelta
import pandas as pd

def get_historical_prices(
    ticker: yf.Ticker,
    period: str = "max",
    interval: str = "1d",
    start: Optional[date] = None,
    end: Optional[date] = None
) -> List[Dict[str, Any]]:
    """
    Fetch historical price data for an ETF.
    Returns a list of dictionaries with date and price information.
    
    Args:
        ticker: yfinance Ticker object
        period: Valid periods: 1d,5d,1mo,3mo,6mo,1y,2y,5y,10y,ytd,max
               If start/end is provided, period is ignored.
        interval: Valid intervals: 1m,2m,5m,15m,30m,60m,90m,1h,1d,5d,1wk,1mo,3mo
                 Intraday data cannot extend last 60 days
        start: Start date for custom date range (optional)
        end: End date for custom date range (optional)
    """
    try:
        # Get historical data
        hist = ticker.history(
            period=period,
            interval=interval,
            start=start,
            end=end
        )
        
        # Convert the data to a list of dictionaries
        price_data = []
        for index, row in hist.iterrows():
            price_data.append({
                "date": index.date(),
                "price": float(row["Close"]),
                "volume": float(row["Volume"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "open": float(row["Open"])
            })
        return price_data
    except Exception as e:
        print(f"Error fetching historical prices: {e}")
        return []

def get_etf_data(
    symbol: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    interval: str = "1d"
) -> Optional[Dict[str, Any]]:
    """
    Fetch ETF data from YFinance including historical prices
    
    Args:
        symbol: ETF symbol (e.g., 'VWRL.L')
        start_date: Optional start date for historical data
        end_date: Optional end date for historical data
        interval: Data interval (default: '1d' for daily)
    """
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # Fetch historical prices
        historical_prices = get_historical_prices(
            ticker,
            start=start_date,
            end=end_date,
            interval=interval
        )
        
        # Add historical prices to the info dictionary
        info["historical_prices"] = historical_prices
        
        # Add additional metadata about the historical prices
        info["historical_prices_metadata"] = {
            "count": len(historical_prices),
            "start_date": historical_prices[0]["date"] if historical_prices else None,
            "end_date": historical_prices[-1]["date"] if historical_prices else None,
            "interval": interval
        }
        
        return info
    except Exception as e:
        print(f"Error fetching ETF data: {e}")
        return None 