from sqlalchemy.orm import Session
from app.models.etf import ETF, ETFPrice
import yfinance as yf
from datetime import date, datetime, timedelta
from app.crud.etf import etf_crud
from decimal import Decimal

def update_etf_data(db: Session, etf_id: str) -> None:
    """Update complete ETF data and historical prices."""
    try:
        # Get the ETF
        etf = db.query(ETF).filter(ETF.id == etf_id).first()
        if not etf:
            raise ValueError(f"ETF {etf_id} not found")

        # Get YFinance data
        ticker = yf.Ticker(etf_id)
        info = ticker.fast_info
        hist = ticker.history(period="max")

        # Update ETF info
        etf.name = info.get('longName', info.get('shortName', etf.name))
        currency = info.get('currency', etf.currency)
        etf.currency = currency  # Store original currency
        db.add(etf)

        # Process historical prices
        for date, row in hist.iterrows():
            date = date.date()
            # Convert all prices to EUR before storing
            price = etf_crud._convert_field_to_eur(
                db,
                float(row["Close"]),
                currency,
                date
            )
            
            # Create or update price
            price_obj = ETFPrice(
                etf_id=etf_id,
                date=date,
                price=price,
                volume=float(row.get("Volume", 0)),
                high=etf_crud._convert_field_to_eur(db, float(row.get("High", row["Close"])), currency, date),
                low=etf_crud._convert_field_to_eur(db, float(row.get("Low", row["Close"])), currency, date),
                open=etf_crud._convert_field_to_eur(db, float(row.get("Open", row["Close"])), currency, date),
                dividends=etf_crud._convert_field_to_eur(db, float(row.get("Dividends", 0)), currency, date),
                stock_splits=float(row.get("Stock Splits", 0)),  # Stock splits are ratios, don't convert
                currency="EUR",  # Always store in EUR
                original_currency=currency  # Keep track of original currency
            )
            db.merge(price_obj)

        db.commit()

    except Exception as e:
        db.rollback()
        raise

def update_latest_prices(db: Session, etf_id: str) -> None:
    """Update only missing recent prices for an ETF.
    This is more efficient than fetching the complete history."""
    try:
        # Get the ETF
        etf = db.query(ETF).filter(ETF.id == etf_id).first()
        if not etf:
            raise ValueError(f"ETF {etf_id} not found")

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

        # Get YFinance data only for the missing period
        ticker = yf.Ticker(etf_id)
        currency = ticker.fast_info.currency
        hist = ticker.history(start=start_date, end=today + timedelta(days=1))

        # Process new prices
        for price_date, row in hist.iterrows():
            price_date = price_date.date()
            # Convert all prices to EUR before storing
            price = etf_crud._convert_field_to_eur(
                db,
                float(row["Close"]),
                currency,
                price_date
            )
            
            # Create or update price
            price_obj = ETFPrice(
                etf_id=etf_id,
                date=price_date,
                price=price,
                volume=float(row.get("Volume", 0)),
                high=etf_crud._convert_field_to_eur(db, float(row.get("High", row["Close"])), currency, price_date),
                low=etf_crud._convert_field_to_eur(db, float(row.get("Low", row["Close"])), currency, price_date),
                open=etf_crud._convert_field_to_eur(db, float(row.get("Open", row["Close"])), currency, price_date),
                dividends=etf_crud._convert_field_to_eur(db, float(row.get("Dividends", 0)), currency, price_date),
                stock_splits=float(row.get("Stock Splits", 0)),  # Stock splits are ratios, don't convert
                currency="EUR",  # Always store in EUR
                original_currency=currency  # Keep track of original currency
            )
            db.merge(price_obj)

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

        db.commit()

    except Exception as e:
        db.rollback()
        raise

def refresh_prices(db: Session, etf_id: str) -> None:
    """Refresh all ETF prices."""
    try:
        # Get YFinance data
        ticker = yf.Ticker(etf_id)
        currency = ticker.fast_info.currency
        hist = ticker.history(period="max")

        # Get the ETF to update its last price
        etf = db.query(ETF).filter(ETF.id == etf_id).first()
        if not etf:
            raise ValueError(f"ETF {etf_id} not found")

        # Process historical prices in batches to avoid memory issues
        batch_size = 500
        total_rows = len(hist)
        
        for start_idx in range(0, total_rows, batch_size):
            end_idx = min(start_idx + batch_size, total_rows)
            batch = hist.iloc[start_idx:end_idx]
            
            for date, row in batch.iterrows():
                date = date.date()
                # Convert all prices to EUR before storing
                price = etf_crud._convert_field_to_eur(
                    db,
                    float(row["Close"]),
                    currency,
                    date
                )
                
                # Use merge to handle existing records
                price_obj = ETFPrice(
                    etf_id=etf_id,
                    date=date,
                    price=price,
                    volume=float(row.get("Volume", 0)),
                    high=etf_crud._convert_field_to_eur(db, float(row.get("High", row["Close"])), currency, date),
                    low=etf_crud._convert_field_to_eur(db, float(row.get("Low", row["Close"])), currency, date),
                    open=etf_crud._convert_field_to_eur(db, float(row.get("Open", row["Close"])), currency, date),
                    dividends=etf_crud._convert_field_to_eur(db, float(row.get("Dividends", 0)), currency, date),
                    stock_splits=float(row.get("Stock Splits", 0)),  # Stock splits are ratios, don't convert
                    currency="EUR",  # Always store in EUR
                    original_currency=currency  # Keep track of original currency
                )
                db.merge(price_obj)
            
            # Commit each batch
            db.commit()

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
            db.commit()

    except Exception as e:
        db.rollback()
        raise 