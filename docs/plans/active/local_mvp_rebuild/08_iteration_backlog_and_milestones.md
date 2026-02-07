# 08 Iteration Backlog and Milestones

Status: 🟡 Planning

## 1. Planning Model

This backlog is organized in strict iterations. Each iteration has:

1. Scope
2. Tasks
3. Exit criteria (Go/No-Go)
4. Risks

No next iteration starts before previous exit criteria are met.

## 2. Iteration 0 - Foundation Baseline

Duration: 3-5 days

### Goals

1. Stable local runtime with web/api/db/redis/worker/scheduler.
2. Config externalization baseline.

### Tasks

- [ ] Create `infra/docker-compose.yml` with full MVP services.
- [ ] Externalize DB/broker URLs from backend code to env.
- [ ] Externalize frontend API base URL.
- [ ] Add `infra/.env.example`.
- [ ] Add smoke script for health checks.

### Exit Criteria

1. Stack boots from clean checkout with one command.
2. `web`, `api`, `worker`, `scheduler` all healthy.
3. No hardcoded infra credentials in source.

## 3. Iteration 1 - Household + Settings Vertical Slice

Duration: 4-6 days

### Goals

1. Core local data management works cleanly.
2. Formatting and locale settings are stable.

### Tasks

- [ ] Stabilize household API and frontend flow.
- [ ] Stabilize settings API/frontend flow.
- [ ] Ensure optimistic UI not causing stale state issues.
- [ ] Add integration tests for household + settings.

### Exit Criteria

1. Household CRUD passes API + UI tests.
2. Settings changes persist and reflect in UI formatting.
3. No major cache invalidation defects.

## 4. Iteration 2 - Pension CRUD + Statements

Duration: 1-2 weeks

### Goals

1. All pension types manageable in local UI.
2. Statement flows stable and validated.

### Tasks

- [ ] Normalize pension list + detail query key patterns.
- [ ] Stabilize create/edit/delete for all pension types.
- [ ] Stabilize statement create/edit/delete paths.
- [ ] Add one-time investment flow checks.
- [ ] Add API integration tests for each pension type.

### Exit Criteria

1. End-to-end CRUD works for all pension types.
2. Statement operations validated and parent-linked correctly.
3. Tests cover critical mutation flows.

## 5. Iteration 3 - ETF + FX Jobs Vertical Slice

Duration: 1-2 weeks

### Goals

1. Automated and manual data updates for ETF/FX.
2. Clear visibility into job status and failures.

### Tasks

- [ ] Migrate Celery broker to Redis.
- [ ] Configure daily schedules for ETF + FX jobs.
- [ ] Validate manual trigger endpoints.
- [ ] Add/update status surfaces in UI.
- [ ] Add failure/retry tests for critical tasks.

### Exit Criteria

1. Daily scheduled jobs execute successfully.
2. Manual job triggers work and report status.
3. Retries do not duplicate data.

## 6. Iteration 4 - Dashboard MVP

Duration: 4-7 days

### Goals

1. Deliver useful portfolio overview with currency conversion.

### Tasks

- [ ] Implement backend aggregate endpoints for dashboard cards.
- [ ] Build frontend dashboard cards and simple chart.
- [ ] Validate currency conversion results using stored FX rates.
- [ ] Add dashboard smoke tests.

### Exit Criteria

1. Dashboard renders from real local data.
2. Values match backend aggregates.
3. Currency-aware display is consistent.

## 7. Iteration 5 - LXC Hardening + Backup/Restore

Duration: 3-5 days

### Goals

1. Reliable operations on Proxmox LXC.
2. Data protection and recovery baseline.

### Tasks

- [ ] Finalize LXC deployment docs.
- [ ] Add backup and restore scripts.
- [ ] Test end-to-end restore in local test path.
- [ ] Add operational runbook.

### Exit Criteria

1. New LXC install works from docs only.
2. Backup + restore validated.
3. Operations checklist executable by non-author.

## 8. Optional Iteration 6 - Post-MVP Improvements

Duration: variable

### Candidate Scope

1. Advanced dashboard modules.
2. Compass improvements.
3. Payout strategy improvements.
4. Stronger auth/access controls in LAN context.

## 9. Timeline Heuristic

1. Fast path: 5-7 weeks.
2. Conservative path: 8-10 weeks.

## 10. Program-Level Risks and Mitigations

1. Scope expansion during iteration.
  Mitigation: enforce exit criteria and move extras to next iteration.
2. External provider instability (ETF/FX).
  Mitigation: robust retries + manual fallback triggers.
3. LXC environment drift.
  Mitigation: scripted setup + version-pinned containers.

