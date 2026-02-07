# Exchange Rate API Documentation (Current)

## Overview

Base path:

```http
/api/v1/exchange-rates
```

Rates are stored with EUR as base currency.

## Supported capabilities

- Latest rates retrieval
- Historical rates retrieval with fallback option
- Manual update triggers (latest and historical)
- Update status and statistics

## Endpoints

### Get latest rates

```http
GET /api/v1/exchange-rates/latest
```

Returns latest available rates. If today has no rates, service falls back to latest stored date.

### Get update status

```http
GET /api/v1/exchange-rates/status?limit=10
```

Query param:
- `limit` integer, `1..100`

### Get historical rates

```http
GET /api/v1/exchange-rates/historical/{rate_date}?use_previous_rates=true
```

- If `use_previous_rates=true`, service may return most recent prior date.
- If `false`, exact-date only.

### Trigger latest update

```http
POST /api/v1/exchange-rates/update/latest
```

Optional query/body currencies parameter (implementation dependent).

### Trigger historical update

```http
POST /api/v1/exchange-rates/update/historical
```

Parameters:
- `start_date` optional (defaults to `1999-01-01` behavior)
- `currencies` optional

### Legacy compatibility endpoint

```http
POST /api/v1/exchange-rates/update
```

Still present in code. New integrations should use `/update/latest` or `/update/historical`.

## Processing notes

- Historical fetches are chunked by service logic (currently 30-day chunks).
- External source: ECB APIs.
- Manual updates are task-backed.

## Error format

```json
{ "detail": "..." }
```

Common codes:
- `404` missing requested rate data
- `422` validation issues
- `500` internal failure
- `503` upstream/source availability issues
