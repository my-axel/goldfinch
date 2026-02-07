# Refactoring Status (Current)

This file tracks refactorings that are still relevant to the current codebase.

## Completed

- API access moved into service files under `src/frontend/services/`.
- React Query hooks introduced under `src/frontend/hooks/`.
- Pension UI state split into dedicated UI contexts (`*UIContext.tsx`).
- Shared route builders centralized in `src/frontend/lib/routes/`.

## In Progress / Remaining

- Remove stale tests and references that still expect legacy `@/frontend/context/pension` and `usePensionData`.
- Continue reducing duplicated endpoint definitions in backend routers.
- Increase automated test coverage to meet configured thresholds.
- Consolidate docs so only `Current` docs are normative for implementation.

## Explicitly Legacy

The following patterns are no longer current architecture:
- Centralized `PensionContext` for all pension data mutations/fetching.
- Generic `usePensionData` as primary edit-form data hook.

Historical documents may still mention these patterns and should be treated as archive material unless updated.
