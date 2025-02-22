# Exchange Rate API Documentation

## Overview

The Exchange Rate API provides endpoints for managing and retrieving currency exchange rates. All rates are stored with EUR as the base currency.

## Features

- Automatic daily updates from ECB (European Central Bank)
- Historical data from 1999 onwards
- Support for manual updates and backfilling
- Status monitoring and statistics
- Automatic cleanup of old records

## Historical Data Loading

The service provides robust support for loading historical exchange rate data:

### Automatic Chunking
- Data is fetched in 30-day chunks to ensure reliable performance
- ECB's Statistical Data Warehouse API has limitations on large date ranges
- Progress is tracked and resumable if interrupted

### Loading Historical Data
To load historical data, use the historical update endpoint:

```http
POST /api/v1/exchange-rates/update/historical
{
    "start_date": "1999-01-01",  // Optional, defaults to 1999-01-01
    "currencies": ["USD", "CHF"]  // Optional, defaults to all supported currencies
}
```

The service will:
1. Split the request into manageable 30-day chunks
2. Process each chunk sequentially
3. Track progress and any missing dates
4. Automatically retry failed chunks
5. Provide status updates via the status endpoint

### Monitoring Progress
Monitor the loading progress using:
```http
GET /api/v1/exchange-rates/status
```

The response includes:
- Recent update operations
- Success/failure status
- Missing dates (if any)
- Coverage statistics

## Supported Currencies

The service supports the following currencies by default (in order of priority):
1. USD - US Dollar (primary reserve currency)
2. CHF - Swiss Franc
3. GBP - British Pound
4. JPY - Japanese Yen
5. CAD - Canadian Dollar
6. AUD - Australian Dollar
7. SEK - Swedish Krona
8. DKK - Danish Krone
9. NOK - Norwegian Krone
10. SGD - Singapore Dollar
11. HKD - Hong Kong Dollar

All exchange rates are stored with EUR (Euro) as the base currency. The rate represents how many units of the target currency you get for 1 EUR.

### Adding New Currencies
To fetch rates for additional currencies:
1. Use the `currencies` parameter in the update endpoints
2. Ensure the currency is supported by ECB (check their API documentation)
3. Currency codes must be in ISO 4217 format (e.g., 'USD', 'GBP')

Example:
```http
POST /api/v1/exchange-rates/update/historical
{
    "currencies": ["USD", "CHF", "NZD"]  // Including a new currency (NZD)
}
```

## Endpoints

### Get Latest Rates

```http
GET /api/v1/exchange-rates/latest
```

Returns the latest available exchange rates for all supported currencies.

**Response**
```json
{
    "date": "2024-03-21",
    "rates": {
        "USD": 1.0934,
        "CHF": 0.9674,
        "GBP": 0.8578,
        "JPY": 164.85,
        "CAD": 1.4789,
        "AUD": 1.6634,
        "SEK": 11.3945,
        "DKK": 7.4543,
        "NOK": 11.7012,
        "SGD": 1.4567,
        "HKD": 8.5432
    }
}
```

### Get Update Status

```http
GET /api/v1/exchange-rates/status?limit=10
```

Returns status information about exchange rate updates.

**Query Parameters**
- `limit` (optional): Number of recent updates to return (default: 10, max: 100)

**Response**
```json
{
    "recent_updates": [
        {
            "id": 1,
            "update_type": "daily",
            "start_date": "2024-03-21",
            "end_date": "2024-03-21",
            "status": "completed",
            "currencies": ["USD", "CHF", "GBP", "JPY"],
            "created_at": "2024-03-21T16:30:00Z",
            "completed_at": "2024-03-21T16:30:05Z",
            "error": null,
            "missing_dates": null,
            "retry_count": 0
        }
    ],
    "total_rates": 25000,
    "latest_rate_date": "2024-03-21",
    "currencies_coverage": {
        "USD": 6250,
        "CHF": 6250,
        "GBP": 6250,
        "JPY": 6250
    },
    "missing_dates_count": 0
}
```

### Trigger Historical Update

```http
POST /api/v1/exchange-rates/update/historical
```

Triggers a manual update of historical exchange rates.

**Request Body**
```json
{
    "start_date": "2000-01-01",  // Optional, defaults to 1999-01-01
    "currencies": ["USD", "CHF"]  // Optional, defaults to all supported currencies
}
```

**Response**
```json
{
    "message": "Historical update scheduled",
    "start_date": "2000-01-01",
    "currencies": ["USD", "CHF"]
}
```

### Trigger Latest Update

```http
POST /api/v1/exchange-rates/update/latest
```

Triggers a manual update of the latest exchange rates.

**Request Body**
```json
{
    "currencies": ["USD", "CHF"]  // Optional, defaults to all supported currencies
}
```

**Response**
```json
{
    "message": "Latest rates update scheduled",
    "date": "2024-03-21",
    "currencies": ["USD", "CHF"]
}
```

## Rate Limiting

- ECB API calls are limited to prevent overwhelming the service
- Updates are processed in chunks of 90 days
- Manual updates are queued and processed asynchronously

## Error Handling

All endpoints follow this error response format:

```json
{
    "detail": "Error message describing what went wrong"
}
```

Common error codes:
- `400`: Bad Request (invalid parameters)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error
- `503`: Service Unavailable (ECB API issues)

## Best Practices

1. **Daily Updates**: The service automatically updates rates daily at 16:30 CET/CEST (after ECB publishes new rates)
2. **Historical Data**: Use the historical update endpoint sparingly, preferably during off-peak hours
3. **Monitoring**: Check the status endpoint regularly to ensure data consistency
4. **Error Recovery**: Failed updates are automatically retried with exponential backoff 