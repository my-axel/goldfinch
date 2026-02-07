# 07 Security, Privacy, Backup, Recovery

Status: 🟡 Planning

## 1. Security Posture

This app is local-only but still processes sensitive financial data. Local-only does not remove security requirements.

## 2. Threat Model (Local Context)

Primary risks:

1. Unauthorized LAN access.
2. Data loss due to disk failure or bad upgrade.
3. Credential leakage via committed config.
4. Corrupted financial records from failed background jobs.

## 3. Minimum Security Controls (MVP)

1. No secrets in source code.
2. Strong DB credentials in `.env`.
3. API not exposed directly to WAN.
4. Optional UI authentication gate if LAN is shared.
5. Regular backup schedule.
6. Restore test at least monthly.

## 4. Data Privacy Controls

1. No third-party analytics SDKs.
2. No telemetry export to cloud by default.
3. Keep logs local and rotate them.
4. Avoid logging sensitive payload data.

## 5. Backup Strategy (MVP)

### Frequency

1. Daily DB backup.
2. Pre-upgrade backup on every deployment.

### Retention

1. Daily backups: 14 days.
2. Weekly backups: 8 weeks.
3. Monthly snapshots: 6 months.

### Format

1. PostgreSQL dumps (`pg_dump` custom format).
2. Optional compressed archive with timestamp naming.

### Integrity

1. Verify backup command exit status.
2. Save checksum file per backup.
3. Log backup metadata (size, duration, timestamp).

## 6. Restore Procedure (MVP)

1. Stop write traffic.
2. Restore database dump into clean DB.
3. Run app migrations if needed.
4. Execute smoke test checklist.
5. Re-open write traffic.

## 7. Job Safety Controls

1. Update operations tracked with status tables.
2. Job retries bounded and visible.
3. Idempotent upsert semantics for ETF/FX records.
4. Failed job alerts visible in UI/admin view.

## 8. Operational Checklists

### Daily

1. Check service health.
2. Confirm backup job success.
3. Check last ETF/FX job status.

### Weekly

1. Review error logs.
2. Test manual job trigger.

### Monthly

1. Perform restore drill in test container.
2. Rotate credentials if required.

## 9. Security Acceptance Criteria

1. No hardcoded host/credential values in app code.
2. Backup and restore scripts exist and are documented.
3. Local network exposure is intentionally constrained.
4. A failed ETF/FX job cannot silently corrupt data.

