# Exchange Rate Service Migration Notes (Current)

## Scope

This document describes API and operational migration notes for exchange-rate updates.

## Endpoint status

Current endpoints:
- `GET /api/v1/exchange-rates/latest`
- `GET /api/v1/exchange-rates/status`
- `GET /api/v1/exchange-rates/historical/{rate_date}`
- `POST /api/v1/exchange-rates/update/latest`
- `POST /api/v1/exchange-rates/update/historical`
- `POST /api/v1/exchange-rates/update` (legacy compatibility endpoint; still present)

Important:
- The legacy `POST /update` endpoint still exists in code and is not yet removed.
- Migrations should move callers to `/update/latest` or `/update/historical`.

## Recommended migration steps

1. Client migration
- Replace `POST /update` calls with explicit `/update/latest` or `/update/historical`.
- Update monitoring/alerts to track new task types.

2. Operational verification
- Verify celery worker and beat are running.
- Verify `/status` returns recent update entries.
- Verify `/latest` returns expected currencies.

3. Cleanup phase (after clients are migrated)
- Remove legacy `/update` endpoint.
- Update integration tests and docs in the same PR.

## Rollback guidance

If migration causes issues:
- Re-enable old client route usage (`POST /update`) temporarily.
- Keep database schema at current migration level.
- Diagnose with `/status` and task logs before retrying migration.

## Known caveats

- Historical loading and latest loading use different task trigger paths.
- `/update/latest` currently uses a background-task wrapper around celery delay; validate behavior in your environment.
