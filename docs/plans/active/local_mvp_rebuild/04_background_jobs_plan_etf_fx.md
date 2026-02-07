# 04 Background Jobs Plan (ETF + FX)

Status: 🟡 Planning

## 1. Why Jobs Are Mandatory in MVP

1. ETF prices change over time and must be refreshed without manual full workflows.
2. Exchange rates change daily and impact portfolio valuation.
3. Some imports are slow/network-dependent and should not block UI requests.

## 2. Recommended MVP Job Stack

### Recommendation

Keep Celery, switch to Redis broker/backend for simpler local operations.

### Why

1. Existing job logic already built around Celery tasks.
2. Retry/backoff/status behavior already exists and is valuable.
3. Redis is easier to run/maintain in local LXC than RabbitMQ for this scope.

## 3. Alternative (If You Want Even Simpler)

Alternative: `APScheduler` + direct DB status table + in-process workers.

Tradeoff:

1. Simpler infra, fewer containers.
2. More custom code for retry tracking and reliability.
3. Harder to isolate heavy jobs from API process.

Decision for this plan: **Celery + Redis**.

## 4. Job Types in MVP

### FX Jobs

1. Daily latest rates sync.
2. Manual latest sync trigger.
3. Manual historical sync trigger.
4. Cleanup old update records.

### ETF Jobs

1. ETF full fetch for newly added ETF (manual or automated initial run).
2. Daily latest price updates for ETFs in use.
3. Optional full refresh endpoint (manual only).
4. Cleanup old ETF update records.

### ETF Pension Jobs

1. Post-create processing for ETF pension initialization.
2. Retry pending ETF valuation calculations when data was not yet available.

## 5. Scheduling Policy (MVP)

1. FX daily sync once per day (configurable cron).
2. ETF daily sync once per day (configurable cron).
3. No high-frequency intraday updates in MVP.
4. Heavy historical sync only manual trigger.

## 6. Idempotency Rules

1. Daily job should be safe to run multiple times.
2. Historical job should skip existing datapoints.
3. Failures should be recorded without corrupting existing data.
4. Retried tasks should not duplicate contribution/value records.

## 7. Failure and Retry Policy

1. Retry transient network failures with exponential backoff.
2. Persist job status and error text in tracking tables.
3. Avoid infinite retries; explicit max retries per task type.
4. Keep manual rerun endpoint for operator recovery.

## 8. Security and Network Policy for Jobs

1. Jobs run on local server only.
2. Outbound connections should be limited to required provider domains.
3. If `ALLOW_INTERNET_SYNC=false`, job triggers should refuse external fetch and return clear status.

## 9. Operational Commands (Target)

```bash
# Start stack
make up

# Trigger manual FX latest sync
curl -X POST http://localhost:8000/api/v1/exchange-rates/update/latest

# Trigger manual FX historical sync
curl -X POST "http://localhost:8000/api/v1/exchange-rates/update/historical?start_date=2025-01-01"

# Trigger ETF update
curl -X POST "http://localhost:8000/api/v1/etf/SPY/update?update_type=prices_only"
```

## 10. Job MVP Acceptance Criteria

1. Scheduler runs both daily job families successfully.
2. Manual triggers work from API endpoints.
3. Failed jobs are visible with reason.
4. Retried jobs do not create duplicate financial records.
5. Job system survives restart (no stuck fatal state).

