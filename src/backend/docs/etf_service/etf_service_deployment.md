# ETF Service Deployment Plan

## Overview

This document outlines the deployment process for the ETF service, including pre-deployment checks, monitoring setup, and rollback procedures.

## Deployment Checklist

### 1. Pre-Deployment

- [ ] Database Migrations
  ```bash
  # Check for pending migrations
  alembic current
  alembic heads
  
  # Run migrations
  alembic upgrade head
  
  # Verify migration success
  alembic check
  ```

- [ ] Data Validation
  ```python
  # Verify ETF data integrity
  python -m scripts.validate_etf_data
  
  # Check exchange rate coverage
  python -m scripts.verify_exchange_rates
  ```

- [ ] Configuration Check
  ```bash
  # Verify environment variables
  python -m scripts.check_config
  
  # Test external service connections
  python -m scripts.test_connections
  ```

### 2. Service Dependencies

- [ ] Celery Setup
  ```bash
  # Verify RabbitMQ connection
  celery -A app.core.celery_app inspect ping
  
  # Check worker status
  celery -A app.core.celery_app status
  ```

- [ ] Redis Cache
  ```bash
  # Test Redis connection
  redis-cli ping
  
  # Clear cache before deployment
  redis-cli FLUSHDB
  ```

### 3. Deployment Steps

1. Stop Services
   ```bash
   # Stop Celery workers
   supervisorctl stop celery_worker:*
   
   # Stop beat scheduler
   supervisorctl stop celery_beat
   ```

2. Backup Data
   ```bash
   # Backup database
   pg_dump -Fc goldfinch > backup_$(date +%Y%m%d).dump
   
   # Backup configuration
   cp .env .env.backup
   ```

3. Deploy Code
   ```bash
   # Pull latest changes
   git pull origin main
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Run migrations
   alembic upgrade head
   ```

4. Start Services
   ```bash
   # Start Celery workers
   supervisorctl start celery_worker:*
   
   # Start beat scheduler
   supervisorctl start celery_beat
   ```

## Monitoring Setup

### 1. System Metrics

```python
# prometheus.yml
scrape_configs:
  - job_name: 'etf_service'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
```

### 2. Application Metrics

```python
from prometheus_client import Counter, Histogram, Gauge

# Define metrics
ETF_UPDATES = Counter('etf_updates_total', 'Total number of ETF updates')
UPDATE_DURATION = Histogram('etf_update_duration_seconds', 'Time spent updating ETF data')
ACTIVE_UPDATES = Gauge('etf_active_updates', 'Number of ongoing ETF updates')
```

### 3. Alerting Rules

```yaml
# alertmanager.yml
groups:
  - name: etf_service
    rules:
      - alert: HighErrorRate
        expr: rate(etf_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High ETF update error rate

      - alert: UpdateStuck
        expr: etf_active_updates > 0 and time() - etf_last_update_timestamp > 3600
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: ETF update process stuck
```

### 4. Logging Setup

```python
# logging.conf
[loggers]
keys=root,etf_service

[handlers]
keys=console,file

[formatters]
keys=json

[logger_etf_service]
level=INFO
handlers=console,file
qualname=app.services.etf_service
propagate=0

[handler_file]
class=handlers.RotatingFileHandler
formatter=json
args=('logs/etf_service.log', 'a', 10485760, 5)
```

## Rollback Procedure

### 1. Immediate Rollback

```bash
# Stop services
supervisorctl stop all

# Restore database
pg_restore -d goldfinch backup_$(date +%Y%m%d).dump

# Restore code
git checkout <previous_version>

# Restore configuration
cp .env.backup .env

# Start services
supervisorctl start all
```

### 2. Gradual Rollback

1. Stop Updates
   ```python
   # Pause new updates
   redis-cli SET etf_updates_paused 1
   
   # Wait for current updates to complete
   python -m scripts.wait_for_updates
   ```

2. Verify Data
   ```python
   # Check data consistency
   python -m scripts.verify_etf_data
   
   # Identify affected records
   python -m scripts.find_inconsistencies
   ```

3. Restore Data
   ```python
   # Restore affected records
   python -m scripts.restore_etf_data --from-backup backup_$(date +%Y%m%d).dump
   
   # Verify restoration
   python -m scripts.verify_restoration
   ```

## Post-Deployment

### 1. Verification

- [ ] Check API endpoints
  ```bash
  curl -v http://localhost:8000/api/v1/etf/health
  ```

- [ ] Verify Celery tasks
  ```bash
  celery -A app.core.celery_app inspect registered
  ```

- [ ] Test ETF updates
  ```python
  python -m scripts.test_etf_update
  ```

### 2. Monitoring

- [ ] Check metrics
  ```bash
  curl http://localhost:8000/metrics
  ```

- [ ] Verify logs
  ```bash
  tail -f logs/etf_service.log
  ```

- [ ] Monitor performance
  ```sql
  SELECT * FROM pg_stat_activity WHERE application_name = 'etf_service';
  ```

### 3. Documentation

- [ ] Update changelog
- [ ] Record deployment notes
- [ ] Update runbook if needed

## Emergency Contacts

- Primary: DevOps Team Lead
- Secondary: Backend Team Lead
- Escalation: CTO

## Maintenance Window

- Preferred Time: 02:00-04:00 UTC
- Backup Window: 14:00-16:00 UTC
- Maximum Duration: 2 hours

## Success Criteria

1. All API endpoints responding correctly
2. Celery tasks running as scheduled
3. No high-severity errors in logs
4. Metrics being collected
5. Alerts properly configured
6. Backup systems operational 