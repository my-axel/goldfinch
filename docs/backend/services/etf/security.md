# ETF Service Security Documentation (Current)

## Summary

The ETF service has solid domain validation in parts, but currently lacks endpoint-level access control for sensitive update operations.

## Current controls

- Input validation exists for key query/body fields.
- Endpoint path and query parsing use typed FastAPI contracts.
- Task-based updates reduce synchronous failure exposure.

## Current gaps

1. No authentication/authorization enforcement
- Read and write/update endpoints are currently exposed without auth checks.
- `POST /api/v1/etf/{etf_id}/update` is not restricted to internal callers.

2. Secret and environment hygiene issues in backend core config
- Infrastructure secrets are not fully externalized.

3. Missing explicit abuse protections
- No documented endpoint throttling policy for update triggers.

## Recommended minimum baseline

1. Require authentication for all ETF write/update operations.
2. Add role-based authorization for manual update triggers.
3. Externalize and rotate all credentials.
4. Add endpoint throttling for update and search-heavy routes.
5. Add security tests (authz, invalid payloads, abuse patterns).

## Operational checklist

- [ ] Auth middleware enabled for ETF write paths
- [ ] Update trigger endpoint restricted by role
- [ ] Secrets only via environment/secret manager
- [ ] Security tests part of CI
