# ETF Service Deployment Guide (Current)

## Scope

Operational checklist for deploying ETF-related backend changes in this repository.

## Prerequisites

- Run commands from `src/backend` unless stated otherwise.
- Ensure DB migrations and celery infrastructure are available.

## Pre-deploy checklist

1. Code and dependency checks
```bash
cd src/backend
pip install -r requirements.txt
```

2. Database migration check
```bash
alembic current
alembic heads
alembic upgrade head
```

3. Backend startup validation
```bash
uvicorn app.main:app --reload
curl -s http://localhost:8000/health
```

## ETF-specific functional checks

```bash
# List ETFs
curl -s http://localhost:8000/api/v1/etf

# Fetch one ETF (replace ID)
curl -s http://localhost:8000/api/v1/etf/VWCE.DE

# Trigger update (replace ID)
curl -s -X POST "http://localhost:8000/api/v1/etf/VWCE.DE/update?update_type=prices_only"

# Check update status
curl -s http://localhost:8000/api/v1/etf/VWCE.DE/status
```

## Celery worker checks

```bash
cd src/backend
celery -A app.core.celery_app inspect ping
celery -A app.core.celery_app inspect registered
```

## Rollback (minimal)

1. Revert app code to previous release commit.
2. Roll back migrations only if schema changed and rollback is defined.
3. Restart API and workers.
4. Re-run health and ETF status checks.

## Notes

- This repository currently does not provide the previously documented `scripts.*` deployment helpers.
- Use API-based verification and celery inspection commands instead.
- There is no dedicated `/api/v1/etf/health` endpoint; use `/health` for service liveness.
