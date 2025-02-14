import yfinance as yf
from typing import Optional, Dict, Any

def get_etf_data(symbol: str) -> Optional[Dict[str, Any]]:
    """
    Fetch ETF data from YFinance
    """
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # Add additional calculations if needed
        # For example, volatility and Sharpe ratio calculations
        
        return info
    except Exception as e:
        print(f"Error fetching ETF data: {e}")
        return None 