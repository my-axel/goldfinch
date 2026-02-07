# Exchange Rate Service - Internal Documentation (Current)

## Architecture Overview

The service maintains EUR-based exchange rates using ECB data and exposes API endpoints for latest, historical, and update status operations.

## Core components

1. Database models
- `ExchangeRate`
- `ExchangeRateUpdate`
- `ExchangeRateError`

2. Service layer
- `ExchangeRateService` handles fetch, parsing, storage, and update management.

3. Task layer
- Celery tasks for scheduled and manual updates.

4. API layer
- `/api/v1/exchange-rates/latest`
- `/api/v1/exchange-rates/status`
- `/api/v1/exchange-rates/historical/{rate_date}`
- update trigger endpoints

## Setup and run

```bash
cd src/backend
alembic upgrade head
uvicorn app.main:app --reload
```

For workers:

```bash
cd src/backend
celery -A app.core.celery_app worker --loglevel=info
celery -A app.core.celery_app beat --loglevel=info
```

## Manual operations

Trigger latest update:

```bash
curl -X POST http://localhost:8000/api/v1/exchange-rates/update/latest
```

Trigger historical update:

```bash
curl -X POST "http://localhost:8000/api/v1/exchange-rates/update/historical?start_date=2024-01-01"
```

Check status:

```bash
curl http://localhost:8000/api/v1/exchange-rates/status
```

## Notes

- Chunking logic for historical loads is implemented in service code.
- Legacy `/api/v1/exchange-rates/update` endpoint still exists for compatibility.
- Prefer API-triggered updates over undocumented helper scripts.
