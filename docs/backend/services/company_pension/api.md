# Company Pension API (Current)

## Overview

Service base path:

```http
/api/v1/pension/company
```

All IDs are integer IDs.

## Authentication

There is currently no API authentication/authorization layer enforced for these endpoints.

## Endpoints

### List pensions

```http
GET /api/v1/pension/company
```

Query params:
- `skip` (int, default `0`)
- `limit` (int, default `100`)
- `member_id` (int, optional)

Response: `PensionCompanyResponse[]`

### Create pension

```http
POST /api/v1/pension/company
```

Response: `201` + `PensionCompanyResponse`

### Get pension by ID

```http
GET /api/v1/pension/company/{pension_id}
```

Response: `PensionCompanyResponse`

### Update pension

```http
PUT /api/v1/pension/company/{pension_id}
```

Response: `PensionCompanyResponse`

### Delete pension

```http
DELETE /api/v1/pension/company/{pension_id}
```

Response:

```json
{ "ok": true }
```

### Update pension status

```http
PUT /api/v1/pension/company/{pension_id}/status
```

Body: `PensionStatusUpdate` (`status`, optional `paused_at`, optional `resume_at`)

Response: `PensionCompanyResponse`

### Add one-time investment

```http
POST /api/v1/pension/company/{pension_id}/one-time-investment
```

Body:

```json
{
  "amount": 1000,
  "investment_date": "2026-02-07",
  "note": "Bonus"
}
```

Response: `PensionCompanyResponse`

### Contribution history

```http
POST /api/v1/pension/company/{pension_id}/contribution-history
```

Body:

```json
{
  "contribution_date": "2026-02-07",
  "amount": 250,
  "is_manual": true,
  "note": "Manual contribution"
}
```

Important: the route is currently defined twice in source with different response models. This should be normalized in code; treat response shape as unstable until fixed.

### Statements

```http
POST   /api/v1/pension/company/{pension_id}/statements
GET    /api/v1/pension/company/{pension_id}/statements
GET    /api/v1/pension/company/{pension_id}/statements/latest
GET    /api/v1/pension/company/{pension_id}/statements/{statement_id}
PUT    /api/v1/pension/company/{pension_id}/statements/{statement_id}
DELETE /api/v1/pension/company/{pension_id}/statements/{statement_id}
```

Statement body fields:
- `statement_date` (date)
- `value` (number)
- `note` (optional string)
- `retirement_projections` (optional array)

Projection fields:
- `retirement_age` (int)
- `monthly_payout` (number, optional)
- `total_capital` (number, optional)

## Status values

Current pension status enum includes:
- `ACTIVE`
- `PAUSED`

## Error responses

Typical FastAPI response format:

```json
{ "detail": "..." }
```

Common codes:
- `404` entity not found
- `422` validation error
- `500` unhandled runtime error
