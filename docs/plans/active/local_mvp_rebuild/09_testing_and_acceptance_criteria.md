# 09 Testing and Acceptance Criteria

Status: 🟡 Planning

## 1. Testing Philosophy

MVP quality target is reliability of core financial flows, not maximal test volume.

Focus:

1. Data correctness
2. Job reliability
3. Operational recoverability

## 2. Test Layers for MVP

### Layer A - Unit Tests

Must cover:

1. Financial conversion/calculation helpers.
2. Status transition validators.
3. Job retry decision logic.

### Layer B - Integration Tests (API + DB)

Must cover:

1. Household CRUD.
2. Settings read/update.
3. Pension CRUD per type.
4. Statement CRUD per type.
5. ETF/FX update endpoint flows.

### Layer C - Frontend Integration/Component Tests

Must cover:

1. Pension list rendering and deletion path.
2. Critical form submission paths.
3. Settings update and reflected formatting.
4. Dashboard core card rendering.

### Layer D - End-to-End Smoke Tests

Must cover:

1. Create member -> create pension -> add statement -> verify dashboard card update.
2. Trigger manual ETF/FX update -> verify status visible.
3. Restart stack -> verify data still accessible.

## 3. Acceptance Criteria by Capability

### Household

1. CRUD operations stable.
2. Validation errors are user-readable.

### Pensions + Statements

1. All pension types support create/edit/delete.
2. Statement operations enforce parent relationship integrity.
3. One-time investment updates are reflected correctly.

### ETF + FX Jobs

1. Scheduled runs execute.
2. Manual trigger endpoints work.
3. Failure path is visible and recoverable.

### Dashboard

1. Aggregates match backend values.
2. Currency conversion uses stored rates.

### Operations

1. Backup script produces valid dump.
2. Restore script recovers working state.

## 4. Regression Gate for Merge

Minimum merge gate for rebuild-related changes:

1. Lint passes.
2. Type checks pass.
3. Unit tests pass.
4. Integration suite for touched domain passes.
5. Smoke script passes locally.

## 5. Manual Test Checklist Template

Use this checklist for each iteration release candidate:

- [ ] Start stack from clean state.
- [ ] Verify `health` endpoint.
- [ ] Create household member.
- [ ] Create ETF pension.
- [ ] Add statement.
- [ ] Trigger manual FX sync.
- [ ] Trigger manual ETF sync.
- [ ] Verify dashboard totals.
- [ ] Run backup.
- [ ] Perform restore test in test DB.

## 6. Failure Severity Policy

1. P0: Data corruption, wrong financial totals, failed restore.
2. P1: Core CRUD/job path broken.
3. P2: Non-critical UI defect.
4. P3: Cosmetic/documentation issues.

No iteration can close with open P0/P1 defects.

