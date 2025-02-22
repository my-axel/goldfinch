# Exchange Rate Service - Internal Documentation

## Architecture Overview

The Exchange Rate Service is designed to maintain up-to-date currency exchange rates from the European Central Bank (ECB). The service follows a modular architecture with clear separation of concerns:

### Components

1. **Database Layer**
   - `ExchangeRate`: Stores actual exchange rates
   - `ExchangeRateUpdate`: Tracks update operations
   - `ExchangeRateError`: Records conversion errors for resolution

2. **Service Layer (`ExchangeRateService`)**
   - Handles ECB API integration
   - Manages rate updates and backfilling
   - Provides rate conversion utilities
   - Implements cleanup operations

3. **Task Layer (Celery)**
   - Scheduled daily updates (16:30 UTC)
   - Cleanup of old records (midnight UTC)
   - Handles retries and error recovery

4. **API Layer**
   - RESTful endpoints for rate retrieval
   - Manual update triggers
   - Status monitoring

## Setup Instructions

1. **Database Setup**
   ```bash
   # Create required tables
   alembic upgrade head
   ```

2. **Initial Data Load**
   ```bash
   # Run the backfill script to load historical data
   python -m app.scripts.backfill_exchange_rates
   ```

3. **Celery Workers**
   ```bash
   # Start Celery worker
   celery -A app.core.celery_app worker --loglevel=info

   # Start Celery beat (for scheduled tasks)
   celery -A app.core.celery_app beat --loglevel=info
   ```

## Maintenance Procedures

### Daily Operations
1. Monitor the logs at `logs/services.log` for update status
2. Check the `/status` endpoint for data consistency
3. Review any failed updates in the `exchange_rate_updates` table

### Weekly Tasks
1. Review `exchange_rate_errors` table for unresolved issues
2. Verify currency coverage is complete
3. Check for any gaps in historical data

### Monthly Tasks
1. Verify cleanup task is removing old records
2. Review logging volume and rotate if needed
3. Check API usage patterns and adjust rate limits if necessary

## Data Flow

1. **Daily Update Process**
   ```mermaid
   graph TD
       A[Celery Beat] -->|Trigger| B[Update Task]
       B -->|Fetch| C[ECB API]
       C -->|Store| D[Database]
       B -->|Log| E[Logs]
       B -->|Track| F[Update Record]
   ```

2. **Historical Backfill**
   ```mermaid
   graph TD
       A[API Request] -->|Trigger| B[Backfill Task]
       B -->|Chunk Data| C[Process Chunks]
       C -->|Fetch| D[ECB API]
       D -->|Store| E[Database]
       C -->|Track| F[Update Record]
   ```

## Error Handling

### Common Issues and Solutions

1. **ECB API Unavailable**
   - System will retry with exponential backoff
   - Check ECB status page: https://www.ecb.europa.eu/stats/html/index.en.html
   - Monitor `exchange_rate_updates.error` for details

2. **Missing Historical Data**
   - Check `exchange_rate_updates.missing_dates`
   - Use `/update/historical` endpoint to backfill
   - Verify date ranges in ECB API response

3. **Rate Conversion Errors**
   - Review `exchange_rate_errors` table
   - Check for currency availability in ECB data
   - Verify rate format and conversion logic

### Recovery Procedures

1. **Failed Daily Update**
   ```bash
   # Manually trigger latest update
   curl -X POST http://localhost:8000/api/v1/exchange-rates/update/latest
   ```

2. **Missing Historical Data**
   ```bash
   # Backfill specific date range
   curl -X POST http://localhost:8000/api/v1/exchange-rates/update/historical \
       -d '{"start_date": "2024-01-01", "end_date": "2024-01-31"}'
   ```

## Monitoring

### Key Metrics

1. **Data Health**
   - Latest rate date vs current date
   - Number of currencies covered
   - Missing dates count

2. **Performance**
   - Update duration
   - API response times
   - Database query performance

3. **Error Rates**
   - Failed updates count
   - API error frequency
   - Conversion error patterns

### Logging

All components use structured logging with the following format:
```
%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

Log files:
- `goldfinch.log`: Main application log
- `services.log`: Service-specific operations
- `tasks.log`: Celery task execution
- `api.log`: API request handling

## Troubleshooting Guide

### Update Issues

1. **Update Stuck in 'Processing'**
   - Check Celery worker status
   - Review task logs for errors
   - Verify ECB API accessibility
   - Reset update status if needed

2. **Missing Currencies**
   - Verify currency in ECB API response
   - Check currency mapping in service
   - Review update task parameters

3. **Inconsistent Rates**
   - Compare with ECB website
   - Check rate conversion logic
   - Verify date alignment (CET/UTC)

### System Health

1. **High Resource Usage**
   - Review chunk size configuration
   - Check database indexes
   - Monitor connection pooling

2. **Slow API Response**
   - Check database query performance
   - Review caching strategy
   - Monitor concurrent requests

3. **Data Inconsistency**
   - Run data validation queries
   - Check for duplicate entries
   - Verify update completion status 