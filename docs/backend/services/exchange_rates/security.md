# Exchange Rate Service Security Review (Current)

## Summary

Security posture is mixed: input validation and query constraints are present, but there are critical infrastructure and access-control gaps.

## What is currently in place

- Query parameter bounds are enforced on status endpoint (`limit <= 100`).
- Date parsing and typing are enforced by FastAPI/Pydantic.
- External API requests use explicit timeouts.
- Error responses generally follow consistent `{"detail": ...}` shape.

## High-risk gaps

1. Hardcoded infrastructure credentials
- Database URL is hardcoded in backend config.
- Celery broker credentials are hardcoded.

2. No API-level authentication/authorization
- Exchange-rate update triggers are currently callable without auth checks.

3. Logging and error leakage risk
- Some handlers include raw exception strings in responses/logs.

## Medium-risk gaps

- No global request rate limiting layer on write/update endpoints.
- No explicit abuse controls for repeated manual update triggers.
- No security test suite validating authorization and abuse scenarios.

## Recommended actions

1. Move all secrets to environment variables and rotate exposed credentials.
2. Add authN/authZ for update-trigger endpoints at minimum.
3. Add request throttling for update endpoints.
4. Standardize error handling to avoid leaking internals.
5. Add automated security regression tests for endpoint access and misuse.

## Verification checklist

- [ ] No credentials in source files
- [ ] Update endpoints require authenticated identity
- [ ] Authorization policy for manual update triggers documented
- [ ] Security tests run in CI
