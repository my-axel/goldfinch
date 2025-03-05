# Exchange Rate Service Migration Guide

## Overview of Changes

The Exchange Rate Service has been enhanced with the following major changes:
1. New update tracking system
2. Improved error handling and logging
3. Automated cleanup of old records
4. Enhanced monitoring capabilities

## Breaking Changes

1. **API Endpoints**
   - `/api/v1/exchange-rates/update` is deprecated in favor of:
     - `/api/v1/exchange-rates/update/latest` for latest rates
     - `/api/v1/exchange-rates/update/historical` for historical data
   - `/api/v1/exchange-rates/backfill` is deprecated in favor of `/api/v1/exchange-rates/update/historical`

2. **Database Schema**
   - New `exchange_rate_updates` table for tracking updates
   - Enhanced indexes on existing tables
   - New columns in error tracking table

3. **Configuration**
   - New logging configuration required
   - Updated Celery task scheduling
   - Additional environment variables for monitoring

## Upgrade Instructions

1. **Pre-upgrade Tasks**
   ```bash
   # Backup database
   pg_dump goldfinch_dev > backup.sql
   
   # Stop services
   systemctl stop goldfinch-celery
   systemctl stop goldfinch-api
   ```

2. **Database Migration**
   ```bash
   # Run Alembic migrations
   cd src/backend
   alembic upgrade head
   ```

3. **Configuration Updates**
   ```bash
   # Update environment variables
   echo "LOG_LEVEL=INFO" >> .env
   echo "LOG_DIR=/var/log/goldfinch" >> .env
   ```

4. **Service Updates**
   ```bash
   # Update Celery configuration
   systemctl stop goldfinch-celery-beat
   cp config/celery.service /etc/systemd/system/
   systemctl daemon-reload
   ```

5. **Initial Data Load**
   ```bash
   # Run backfill script for historical data
   python -m app.scripts.backfill_exchange_rates
   ```

6. **Start Services**
   ```bash
   systemctl start goldfinch-api
   systemctl start goldfinch-celery
   systemctl start goldfinch-celery-beat
   ```

## Verification Steps

1. **Database Migration**
   ```sql
   -- Verify new table
   SELECT count(*) FROM exchange_rate_updates;
   
   -- Check indexes
   SELECT * FROM pg_indexes WHERE tablename = 'exchange_rate_updates';
   ```

2. **API Endpoints**
   ```bash
   # Check new endpoints
   curl http://localhost:8000/api/v1/exchange-rates/status
   curl http://localhost:8000/api/v1/exchange-rates/latest
   ```

3. **Logging**
   ```bash
   # Verify log files
   ls -l /var/log/goldfinch/
   tail -f /var/log/goldfinch/services.log
   ```

4. **Celery Tasks**
   ```bash
   # Check task registration
   celery -A app.core.celery_app inspect registered
   
   # Monitor task execution
   celery -A app.core.celery_app events
   ```

## Rollback Procedures

1. **Database Rollback**
   ```bash
   # Stop services
   systemctl stop goldfinch-celery goldfinch-api
   
   # Restore database
   psql goldfinch_dev < backup.sql
   
   # Revert Alembic migration
   alembic downgrade -1
   ```

2. **Service Rollback**
   ```bash
   # Restore old configuration
   cp config/celery.service.bak /etc/systemd/system/celery.service
   systemctl daemon-reload
   
   # Start services
   systemctl start goldfinch-api goldfinch-celery
   ```

3. **Verification**
   ```bash
   # Check service status
   systemctl status goldfinch-api
   systemctl status goldfinch-celery
   
   # Verify database state
   psql goldfinch_dev -c "SELECT count(*) FROM exchange_rates;"
   ```

## Known Issues

1. **Rate Limit Changes**
   - New rate limiting may affect high-frequency API users
   - Monitor response codes for 429 errors
   - Adjust client retry logic if needed

2. **Data Migration**
   - Initial backfill may take several hours
   - Monitor progress through status endpoint
   - Historical data gaps will be logged

3. **Logging Volume**
   - Enhanced logging may increase disk usage
   - Monitor log rotation and cleanup
   - Adjust retention settings if needed

## Support

For issues during migration:
1. Check logs in `/var/log/goldfinch/`
2. Review error tracking tables
3. Use status endpoint for health checks
4. Contact development team with:
   - Error messages
   - Log snippets
   - Database state
   - API response codes 