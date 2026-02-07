# Local-Only MVP Rebuild Plan (Master Document)

Status: 🟡 Planning  
Last updated: 2026-02-07

## Purpose

This plan defines a pragmatic rebuild path for Goldfinch as a **local-only** application (no public hosting), with an MVP that **must include ETF and currency functionality plus background updates**.

The plan is intentionally split into smaller documents so implementation can happen in vertical slices instead of one monolithic rewrite.

## Non-Negotiable Constraints

1. Single repository (no multi-repo setup for MVP).
2. App runs locally on your own server (target: Proxmox LXC).
3. Sensitive finance/household data stays local.
4. ETF + FX (currency) are included in MVP.
5. Background jobs are included in MVP.

## Document Map

1. [01 Architecture and Scope](./01_architecture_and_scope.md)
2. [02 Repository and Runtime Structure](./02_repository_and_runtime_structure.md)
3. [03 Backend Data and API Plan](./03_backend_data_and_api_plan.md)
4. [04 Background Jobs Plan (ETF + FX)](./04_background_jobs_plan_etf_fx.md)
5. [05 Frontend Plan](./05_frontend_plan.md)
6. [06 Proxmox LXC Deployment Plan](./06_proxmox_lxc_deployment_plan.md)
7. [07 Security, Privacy, Backup, Recovery](./07_security_privacy_backup_recovery.md)
8. [08 Iteration Backlog and Milestones](./08_iteration_backlog_and_milestones.md)
9. [09 Testing and Acceptance Criteria](./09_testing_and_acceptance_criteria.md)
10. [10 Decisions and Open Questions](./10_decisions_and_open_questions.md)

## How To Use This Plan

1. Start from this file and confirm open decisions in `10_decisions_and_open_questions.md`.
2. Implement iteration-by-iteration from `08_iteration_backlog_and_milestones.md`.
3. For each iteration, use `09_testing_and_acceptance_criteria.md` as the DoD gate.
4. Keep this folder updated as work progresses (checkboxes and status markers).

## MVP Definition (Local-Only)

The MVP is done when all points are true:

1. Household and pension data can be created/updated/deleted locally via browser UI.
2. ETF prices can be imported/updated in background jobs.
3. Exchange rates can be imported/updated in background jobs.
4. Dashboard shows basic aggregated values with currency conversion.
5. The whole stack is installable in a Proxmox LXC using one documented process.
6. Backup + restore process is documented and tested.

## Out of Scope for MVP

1. Multi-tenant auth and user management.
2. Internet-facing deployment hardening for public access.
3. Enterprise observability stack (SigNoz/OTel full setup).
4. Complex release management across multiple environments.
5. Mobile app.

## Current Direction Summary

- Keep monorepo.
- Keep background jobs, but simplify infra.
- Prefer Celery + Redis over Celery + RabbitMQ for MVP operations simplicity.
- Remove hardcoded infrastructure credentials/hosts from source code.
- Build in vertical slices to keep progress visible and reversible.

## Progress Board

- [ ] Iteration 0: Foundation and local runtime baseline
- [ ] Iteration 1: Household + settings vertical slice
- [ ] Iteration 2: Pension CRUD + statements vertical slice
- [ ] Iteration 3: ETF + FX background jobs vertical slice
- [ ] Iteration 4: Dashboard and conversions
- [ ] Iteration 5: LXC packaging + backup/restore + hardening

