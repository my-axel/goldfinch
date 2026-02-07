# Settings API Documentation (Current)

## Overview

Global settings endpoint for localization and projection assumptions.

Base path:

```http
/api/v1/settings
```

## Supported values

### Locales
- `en-US`
- `en-GB`
- `de-DE`

### Currencies
- `USD`
- `EUR`
- `GBP`

## Endpoints

### Get settings

```http
GET /api/v1/settings
```

Returns current settings. If no record exists yet, the backend creates one and returns it.

### Update settings

```http
PUT /api/v1/settings
```

Partial update; only supplied fields are changed.

## Current response model

```json
{
  "id": 1,
  "ui_locale": "en-US",
  "number_locale": "en-US",
  "currency": "USD",
  "projection_pessimistic_rate": 4.0,
  "projection_realistic_rate": 6.0,
  "projection_optimistic_rate": 8.0,
  "state_pension_pessimistic_rate": 1.0,
  "state_pension_realistic_rate": 1.5,
  "state_pension_optimistic_rate": 2.0,
  "inflation_rate": 2.0,
  "created_at": "2026-02-07T12:00:00Z",
  "updated_at": "2026-02-07T12:00:00Z"
}
```

## Validation rules

1. Locale format and allow-list
- Pattern: `xx-XX`
- Value must be one of supported locales

2. Currency format and allow-list
- Exactly 3 chars
- Value must be one of supported currencies

3. Rate constraints
- All rate fields: `0.0 <= rate <= 15.0`
- `projection_pessimistic_rate <= projection_realistic_rate <= projection_optimistic_rate`
- `state_pension_pessimistic_rate <= state_pension_realistic_rate <= state_pension_optimistic_rate`

## Notes on defaults

- First-time default record is created by backend CRUD logic.
- Effective first record currently initializes locale/currency as `en-US` / `en-US` / `USD`.
- Projection and state-pension rates default to schema/model values shown above.

## Error handling

Error shape:

```json
{ "detail": "..." }
```

Common codes:
- `422` validation errors
- `500` unexpected server errors
