# ETF Service Documentation

## Overview

The ETF Service is responsible for managing ETF (Exchange-Traded Fund) data within the Goldfinch platform. It handles ETF information retrieval, price updates, and performance metrics calculation.

## Features

- Complete ETF data management
- Automatic price updates from YFinance
- Currency conversion to EUR
- Performance metrics calculation
- Error tracking and resolution
- Status monitoring

## API Endpoints

### ETF Management

#### GET /api/v1/etf
Retrieve a list of ETFs with optional filtering.

Query Parameters:
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records to return (default: 100)
- `query` (optional): Search term for ETF name, symbol, or ISIN
- `is_active` (optional): Filter by active status
- `provider` (optional): Filter by provider

#### GET /api/v1/etf/{etf_id}
Get detailed information about a specific ETF.

#### POST /api/v1/etf
Create a new ETF entry.

Request Body:
```json
{
  "id": "string",
  "symbol": "string",
  "name": "string",
  "currency": "string",
  "isin": "string (optional)",
  "asset_class": "string (optional)",
  "domicile": "string (optional)"
}
```

### Price Management

#### GET /api/v1/etf/{etf_id}/prices
Get historical prices for an ETF.

Query Parameters:
- `start_date` (optional): Start date for price history
- `end_date` (optional): End date for price history
- `skip` (optional): Number of records to skip
- `limit` (optional): Maximum number of records to return

#### POST /api/v1/etf/{etf_id}/prices
Add a new price point for an ETF.

### Update Management

#### POST /api/v1/etf/{etf_id}/update
Trigger an ETF data update.

Query Parameters:
- `update_type`: Type of update ('full', 'prices_only', 'prices_refresh')

#### GET /api/v1/etf/{etf_id}/status
Get status of recent ETF updates.

#### GET /api/v1/etf/{etf_id}/metrics
Get ETF metrics including performance data and error statistics.

## Data Models

### ETF Model
```python
class ETF(Base):
    id: str  # YFinance symbol
    isin: Optional[str]
    symbol: str
    name: str
    currency: str
    asset_class: Optional[str]
    domicile: Optional[str]
    inception_date: Optional[date]
    fund_size: Optional[Decimal]
    ter: Optional[Decimal]
    distribution_policy: Optional[str]
    last_price: Optional[Decimal]
    last_update: Optional[datetime]
    ytd_return: Optional[Decimal]
    one_year_return: Optional[Decimal]
    volatility_30d: Optional[Decimal]
    sharpe_ratio: Optional[Decimal]
```

### ETFPrice Model
```python
class ETFPrice(Base):
    id: int
    etf_id: str
    date: date
    price: Decimal
    currency: str = "EUR"
    volume: Optional[Decimal]
    high: Optional[Decimal]
    low: Optional[Decimal]
    open: Optional[Decimal]
    dividends: Optional[Decimal]
    stock_splits: Optional[Decimal]
    original_currency: Optional[str]
```

### ETFUpdate Model
```python
class ETFUpdate(Base):
    id: int
    etf_id: str
    update_type: str  # 'full', 'prices_only', 'info_only', 'manual'
    start_date: date
    end_date: date
    status: str  # 'pending', 'processing', 'completed', 'failed'
    created_at: datetime
    completed_at: Optional[datetime]
    error: Optional[str]
    missing_dates: Optional[List[date]]
    retry_count: int
    notes: Optional[str]
```

## Usage Examples

### Triggering an ETF Update
```python
from app.services.etf_service import update_etf_data

# Update complete ETF data
update_etf_data(db, etf_id="VWCE.DE")

# Update only latest prices
update_latest_prices(db, etf_id="VWCE.DE")

# Refresh all prices
refresh_prices(db, etf_id="VWCE.DE")
```

### Error Handling
The service includes comprehensive error handling:
- Exchange rate conversion errors are tracked
- Missing price dates are recorded
- Update failures are logged with context
- Automatic retry mechanism for transient failures

### Currency Conversion
All prices are automatically converted to EUR:
- Uses exchange rates from ECB
- Special handling for GBp (British pence)
- Fallback mechanisms for missing rates
- Error tracking for failed conversions

## Limitations

1. Historical Data
   - No data before January 1, 1999 (Euro introduction)
   - Some providers may have limited historical data

2. Exchange Rates
   - Dependent on ECB exchange rate availability
   - Uses closest available rate if exact date unavailable

3. Performance
   - Updates are processed in 90-day chunks
   - Large updates may take several minutes
   - Rate limits from YFinance API may apply

## Best Practices

1. Regular Updates
   - Schedule daily price updates
   - Run full refreshes monthly
   - Monitor error logs regularly

2. Error Resolution
   - Check unresolved errors daily
   - Investigate missing exchange rates
   - Monitor update status regularly

3. Performance Optimization
   - Use chunked processing for large updates
   - Implement proper indexing
   - Regular maintenance of historical data 