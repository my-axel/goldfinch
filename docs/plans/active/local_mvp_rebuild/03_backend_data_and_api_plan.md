# 03 Backend Data and API Plan

Status: 🟡 Planning

## 1. Strategy

For MVP, prioritize **stability and delivery speed**:

1. Reuse the current data model where possible.
2. Refactor in place for correctness and maintainability.
3. Avoid full schema redesign before MVP.
4. Add normalization only where it removes repeated bugs or duplicated logic.

## 2. Domain Areas

1. Household members.
2. Pension types: ETF, company, insurance, state, savings.
3. Statements per pension type.
4. Contribution plans and contribution history.
5. ETF and ETF prices.
6. Exchange rates and update tracking.
7. Global app settings.

## 3. Data Layer Work Packages

### WP-DB-1: Configuration and Session Safety

- [ ] Use env-based DB config only.
- [ ] Keep session lifecycle explicit in API and tasks.
- [ ] Add startup DB connectivity check endpoint or startup guard.

### WP-DB-2: Schema Hygiene

- [ ] Verify indexes on all foreign keys and high-frequency query columns.
- [ ] Ensure uniqueness constraints match domain assumptions.
- [ ] Standardize timestamp fields where needed (`created_at`, `updated_at`).

### WP-DB-3: Decimal and Currency Correctness

- [ ] Ensure financial fields are stored as decimal types.
- [ ] Avoid float arithmetic in domain services.
- [ ] Enforce currency conversion consistency at API/service boundaries.

## 4. API Contract Conventions

1. Keep `/api/v1` prefix.
2. Consistent response semantics per route type.
3. Consistent error payload shape.
4. Clear separation between list DTOs and detail DTOs.
5. Explicit query params for filters (`member_id`, `status`, pagination).

## 5. MVP Endpoint Matrix

### Household

1. `GET /api/v1/household`
2. `POST /api/v1/household`
3. `GET /api/v1/household/{id}`
4. `PUT /api/v1/household/{id}`
5. `DELETE /api/v1/household/{id}`

### Settings

1. `GET /api/v1/settings`
2. `PUT /api/v1/settings`

### Pensions

For each pension type (`etf`, `company`, `insurance`, `state`, `savings`):

1. `GET /api/v1/pension/{type}` (list)
2. `POST /api/v1/pension/{type}`
3. `GET /api/v1/pension/{type}/{id}`
4. `PUT /api/v1/pension/{type}/{id}`
5. `DELETE /api/v1/pension/{type}/{id}`
6. `PUT /api/v1/pension/{type}/{id}/status`
7. Statement CRUD endpoints
8. One-time investment endpoint

### ETF and FX Data

1. ETF search/read/update endpoints.
2. FX latest/historical/status/update endpoints.
3. Job trigger endpoints (manual runs).

## 6. Backend Refactor Priorities

1. Split very large endpoint modules into route + service logic units.
2. Split very large CRUD modules into focused domain services.
3. Remove duplicate business logic between CRUD and task layers.
4. Normalize status transition rules into reusable helpers.

## 7. API-Level Hard Requirements

1. Every mutation endpoint must validate ownership/existence before write.
2. Status updates must enforce legal transitions.
3. Statement update/delete must verify parent pension linkage.
4. All date parsing and decimal parsing must be explicit.

## 8. Backward Compatibility Plan (Internal)

Because this is a rebuild in same repo, use phased compatibility:

1. Keep existing routes operational while internals are refactored.
2. Add tests around current behavior before major internal changes.
3. Replace internals behind stable route interfaces.

## 9. Acceptance Criteria

1. Core CRUD + statements pass integration tests.
2. ETF + FX endpoints support both manual and scheduled updates.
3. No hardcoded infrastructure credentials in API code.
4. API contract docs match actual responses.

