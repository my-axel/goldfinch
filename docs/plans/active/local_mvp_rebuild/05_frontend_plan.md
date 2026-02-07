# 05 Frontend Plan

Status: 🟡 Planning

## 1. Frontend Goals for MVP

1. Stable local UX for household and pension management.
2. Strong form validation for financial inputs.
3. Reliable data synchronization with API.
4. Clear visibility into ETF/FX update status.
5. Dashboard with useful core metrics.

## 2. Frontend Architecture Rules

1. Feature-based folder structure.
2. React Query for server state.
3. Context only for UI state that is not server state.
4. Explicit data mappers per API DTO; no field-name heuristics.
5. Uniform loading/error/success UX patterns.

## 3. Existing Refactor Targets

1. Replace heuristic transformation logic in `/Users/axel/Coding/goldfinch-dev/src/frontend/lib/api-client.ts` with explicit request/response mapping.
2. Standardize query key conventions across pension types.
3. Reduce duplication across pension pages by extracting shared form sections and status actions.

## 4. UI Modules in MVP

1. Household
2. Pension list overview
3. Pension create/edit pages by type
4. Settings
5. Dashboard (core cards + basic timeseries)
6. Job status surfaces for ETF/FX update results

## 5. Frontend Work Packages

### WP-FE-1: API Client and Typing

- [ ] Centralize API base URL configuration from env.
- [ ] Define typed DTOs for each endpoint family.
- [ ] Implement explicit converters for date/decimal fields.

### WP-FE-2: Query Layer Consistency

- [ ] Standardize query key factories.
- [ ] Align invalidation strategy across all pension mutations.
- [ ] Add retry policy tuned for local API behavior.

### WP-FE-3: Shared Pension UX Components

- [ ] Shared status actions.
- [ ] Shared statement management interactions.
- [ ] Shared loading and error sections.

### WP-FE-4: Dashboard MVP

- [ ] Total portfolio value.
- [ ] Total contributions.
- [ ] Total return.
- [ ] Basic historical trend.
- [ ] Currency-aware display based on settings + FX data.

### WP-FE-5: Job Visibility

- [ ] ETF/FX last update timestamp.
- [ ] Last update status (ok/failed).
- [ ] Manual trigger actions where relevant.

## 6. UX Rules for Sensitive Local Data

1. Avoid accidental data loss (confirm destructive actions).
2. Show explicit save/error feedback.
3. No external analytics scripts.
4. Keep state deterministic after refresh.

## 7. Frontend MVP Acceptance Criteria

1. All core CRUD pages function without stale cache bugs.
2. Date and number formats are consistent with settings.
3. Dashboard values match backend aggregates.
4. ETF/FX status is visible and understandable.
5. UI remains usable after backend restarts.

