# Settings Deployment Guide

## Overview

This guide outlines the deployment process for the new settings system, including database migrations, default settings creation, and monitoring procedures.

## Pre-Deployment Checklist

1. **Database Backup**
   - Create a full database backup
   - Verify backup integrity
   - Document backup location and restoration procedure

2. **Code Review**
   - Verify all migrations are reversible
   - Check default values are correct
   - Ensure error handling is in place
   - Review logging configuration

3. **Environment Preparation**
   - Update environment variables if needed
   - Verify database connection settings
   - Check disk space for backups
   - Ensure maintenance window is scheduled

## Deployment Steps

### 1. Database Migration

```bash
# 1. Create backup
pg_dump -Fc goldfinch > backup_$(date +%Y%m%d_%H%M%S).dump

# 2. Run migrations
alembic upgrade head

# 3. Verify migration success
alembic current
```

### 2. Default Settings Creation

```python
# Run in Python shell or management command
from app.crud.settings import settings
from app.db.session import SessionLocal

db = SessionLocal()
settings.create_default_settings(db)
db.close()
```

### 3. Frontend Deployment

```bash
# 1. Build frontend assets
npm run build

# 2. Deploy new assets
rsync -avz build/ /var/www/goldfinch/

# 3. Clear browser caches (if needed)
# Add cache-busting headers or version parameters
```

### 4. Service Restart

```bash
# 1. Restart API service
systemctl restart goldfinch-api

# 2. Verify service status
systemctl status goldfinch-api
```

## Rollback Procedures

### Database Rollback

```bash
# 1. Revert migration
alembic downgrade -1

# 2. Verify rollback
alembic current

# 3. If needed, restore from backup
pg_restore -d goldfinch backup_YYYYMMDD_HHMMSS.dump
```

### Frontend Rollback

```bash
# 1. Deploy previous version
rsync -avz build_backup/ /var/www/goldfinch/

# 2. Clear browser caches
# Update cache-busting parameters
```

## Monitoring Points

### 1. Database Health
- Monitor migration table status
- Check for orphaned settings records
- Verify default settings existence
- Monitor query performance

### 2. API Endpoints
- Monitor response times for settings endpoints
- Track error rates
- Watch for validation failures
- Monitor settings update frequency

### 3. Frontend Integration
- Monitor JS console errors
- Track failed API requests
- Watch for formatting errors
- Monitor client-side performance

### 4. User Experience
- Track settings page load time
- Monitor number formatting accuracy
- Watch for currency display issues
- Track date formatting consistency

## Logging

### 1. Migration Logs
```python
# Example log format
{
    "timestamp": "2024-03-21T10:00:00Z",
    "level": "INFO",
    "event": "migration_complete",
    "details": {
        "version": "xyz123",
        "status": "success",
        "duration_ms": 1234
    }
}
```

### 2. Settings Creation Logs
```python
# Example log format
{
    "timestamp": "2024-03-21T10:01:00Z",
    "level": "INFO",
    "event": "settings_created",
    "details": {
        "id": 1,
        "ui_locale": "en-US",
        "number_locale": "en-US",
        "currency": "USD"
    }
}
```

## Verification Steps

### 1. Database Verification
- [ ] Settings table created successfully
- [ ] Default settings record exists
- [ ] All columns have correct types and constraints
- [ ] Indexes are created and optimized

### 2. API Verification
- [ ] GET /api/v1/settings returns 200
- [ ] PUT /api/v1/settings updates successfully
- [ ] Validation rules work correctly
- [ ] Error responses are properly formatted

### 3. Frontend Verification
- [ ] Settings page loads correctly
- [ ] Number formatting works in all locales
- [ ] Currency symbols display correctly
- [ ] Date formatting is consistent

## Post-Deployment Tasks

1. **Cleanup**
   - Remove old database backups
   - Archive deployment logs
   - Update documentation
   - Clear temporary files

2. **Monitoring Setup**
   - Set up alerts for error rates
   - Configure performance monitoring
   - Set up log aggregation
   - Create dashboard for key metrics

3. **Documentation**
   - Update system architecture docs
   - Document any deployment issues
   - Update runbooks if needed
   - Record lessons learned

## Emergency Contacts

- **Database Admin**: [Contact Info]
- **Backend Lead**: [Contact Info]
- **Frontend Lead**: [Contact Info]
- **DevOps Engineer**: [Contact Info]

## Appendix

### A. Common Issues and Solutions

1. **Migration Failures**
   - Check database connections
   - Verify permissions
   - Review transaction logs
   - Check disk space

2. **Settings Creation Issues**
   - Verify database constraints
   - Check for duplicate records
   - Review validation rules
   - Check error logs

3. **Frontend Integration Issues**
   - Clear browser caches
   - Check API endpoints
   - Verify environment variables
   - Review console errors 