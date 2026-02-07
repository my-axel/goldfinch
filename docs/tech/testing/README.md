# Testing Strategy & Status (Current)

## Current Snapshot

- Test command: `npm test -- --runInBand`
- Latest local result: failing overall because of
  - stale tests importing `@/frontend/context/pension`
  - global coverage thresholds (80%) not met

## Key Observations

1. Several suites pass for newer hook/service areas (state and savings pension hooks).
2. Legacy test files still reference removed architecture (`usePensionData`, shared pension context).
3. Coverage configuration is strict, while current effective coverage is far below threshold.

## Immediate Priorities

1. Stabilize test suite
- Remove or migrate tests that target deleted modules.
- Align remaining tests with React Query hooks and service-based data layer.

2. Restore meaningful coverage reporting
- Either raise real coverage by adding tests in active modules, or
- temporarily scope coverage targets by directory until migrations are complete.

3. Add contract tests for backend API docs
- Validate documented endpoint paths and response shapes against actual app routers.

## Frontend Testing Focus

- Hook-level tests for pension CRUD hooks (`src/frontend/hooks/pension/*`).
- Service-layer tests for route and payload correctness (`src/frontend/services/*`).
- Integration tests for key form pages (`app/pension/*/(new|[id]/edit)/page.tsx`).

## Backend Testing Focus

- Endpoint contract tests for `/api/v1/pension/*`, `/api/v1/settings`, `/api/v1/exchange-rates/*`, `/api/v1/etf/*`.
- Task-related tests for celery-triggered flows (exchange rates and ETF updates).
- Schema validation tests for settings and pension payloads.

## Notes

- Historical testing checklists in older docs may not reflect the current architecture.
- Treat this file as the canonical test-status reference.
