# 10 Decisions and Open Questions

Status: 🟡 Planning

## 1. Decision Log Format

For each decision:

1. Decision
2. Options
3. Recommendation
4. Final choice
5. Date

## 2. Current Open Decisions

### D-01 Job stack

1. Options:
  - Celery + Redis
  - APScheduler + in-process jobs
2. Recommendation: Celery + Redis
3. Final choice: TODO

### D-02 ETF provider strategy

1. Options:
  - Keep current provider integration
  - Add provider abstraction and fallback
2. Recommendation: keep current provider for MVP, add fallback later
3. Final choice: TODO

### D-03 FX provider strategy

1. Options:
  - ECB only
  - ECB + fallback source
2. Recommendation: ECB only in MVP
3. Final choice: TODO

### D-04 Local auth gate

1. Options:
  - no auth in LAN
  - simple local auth (basic/session)
2. Recommendation: simple local auth if LAN is shared
3. Final choice: TODO

### D-05 Deployment topology

1. Options:
  - all services in one LXC
  - db in separate LXC
2. Recommendation: one LXC for MVP simplicity
3. Final choice: TODO

### D-06 Data migration approach

1. Options:
  - in-place refactor preserving existing DB
  - new schema + migration scripts
2. Recommendation: in-place refactor for MVP speed
3. Final choice: TODO

## 3. Confirmed Decisions (Pre-filled from discussion)

1. Single repository for MVP.
2. Local-only deployment target.
3. ETF + currency included in MVP.
4. Background tasks included in MVP.

## 4. Review Checklist Before Starting Implementation

- [ ] D-01 resolved
- [ ] D-02 resolved
- [ ] D-03 resolved
- [ ] D-04 resolved
- [ ] D-05 resolved
- [ ] D-06 resolved

## 5. ADR Trigger Conditions

Create a short ADR when:

1. Decision has medium/high migration cost.
2. Decision changes deployment/security model.
3. Decision changes data model compatibility.

