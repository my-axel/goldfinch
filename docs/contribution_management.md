# 📅 Contribution Management System

## Overview
The contribution management system handles the automatic realization of planned contributions across all pension types. It ensures that contribution steps are properly tracked, realized, and monitored.

## System Components

### 1. Data Model
#### ContributionRealizationTracking
```sql
CREATE TABLE contribution_realization_tracking (
    id SERIAL PRIMARY KEY,
    pension_id INTEGER NOT NULL,
    pension_type VARCHAR NOT NULL,  -- ETF, COMPANY, INSURANCE
    contribution_date DATE NOT NULL,
    amount DECIMAL(20,2) NOT NULL,
    status VARCHAR NOT NULL,  -- pending, processing, completed, failed
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,  -- When to give up on failed attempts
    idempotency_key VARCHAR(64),     -- For deduplication (e.g., MD5 hash of pension_id+date+amount)
    last_attempt_at TIMESTAMP,
    completed_at TIMESTAMP,
    error TEXT,
    metadata JSONB,  -- For type-specific data (e.g., ETF prices, employer matching)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_contribution UNIQUE (pension_id, pension_type, contribution_date, idempotency_key)
);

-- Indexes
CREATE INDEX idx_contribution_tracking_status ON contribution_realization_tracking(status);
CREATE INDEX idx_contribution_tracking_date ON contribution_realization_tracking(contribution_date);
CREATE INDEX idx_contribution_tracking_pension ON contribution_realization_tracking(pension_id, pension_type);
CREATE UNIQUE INDEX idx_contribution_idempotency ON contribution_realization_tracking(idempotency_key) WHERE idempotency_key IS NOT NULL;
```

### 2. Task System

#### Daily Contribution Check Task
```python
@celery_app.task
def check_daily_contributions():
    """
    Daily task to check and realize pending contributions.
    Runs at configurable time (default: 1 AM UTC).
    """
    # Implementation details in core/tasks/contributions.py
```

#### Retry Mechanism
- Simple retry with exponential backoff (1h, 2h, 4h, 8h)
- Maximum 3 retries (configurable per pension)
- Basic error logging with timestamps
- Transaction management to ensure atomic operations
- Idempotency check using idempotency_key to prevent duplicate processing

### 3. Core Features

#### Contribution Check Logic
1. **Scan Active Pensions**
   - Get all active pensions
   - Filter by status (exclude paused/terminated)
   - Group by pension type for efficient processing

2. **Plan Step Analysis**
   - Calculate due contributions
   - Handle recurring contributions
   - Process one-time contributions
   - Consider timezone differences

3. **Realization Logic**
   - ETF Pensions:
     - Check price availability
     - Calculate units based on price
     - Update total units and value
   - Company Pensions:
     - Apply employer matching rules
     - Handle vesting schedules
     - Track both employee and employer parts
   - Insurance Pensions:
     - Handle premium payments
     - Track policy value updates
     - Process any bonus/dividend credits

#### Special Cases

1. **Weekend Handling**
   - ETF: Realize on next trading day
   - Company: Configure per company policy
   - Insurance: Realize on last working day

2. **Holiday Management**
   - Maintain holiday calendar
   - Country-specific rules
   - Exchange/market closure dates

3. **Error Scenarios**
   - Missing ETF prices
   - Bank holiday conflicts
   - System downtime recovery
   - Data inconsistency handling

4. **Backdated Contributions**
   - Historical price lookups
   - Value adjustment calculations
   - Audit trail maintenance

### 4. Monitoring & Administration

#### Monitoring System
1. **Metrics**
   - Success/failure rates
   - Processing times
   - Retry statistics
   - Error categorization

2. **Alerts**
   - Failed realizations
   - System errors
   - Performance issues
   - Data anomalies

#### Admin Interface
1. **Dashboard**
   - Contribution status overview
   - Error monitoring
   - Performance metrics
   - System health indicators

2. **Management Tools**
   - Manual realization trigger
   - Status override capabilities
   - Error resolution tools
   - Audit log viewer

### 5. API Endpoints

#### Public API
```python
@router.post("/contributions/{pension_id}/realize")
async def realize_contributions(
    pension_id: int,
    date_range: DateRange,
    background_tasks: BackgroundTasks
)

@router.get("/contributions/{pension_id}/status")
async def get_contribution_status(
    pension_id: int,
    date_range: Optional[DateRange] = None
)
```

#### Admin API
```python
@router.post("/admin/contributions/retry-failed")
async def retry_failed_contributions(
    filter: ContributionFilter
)

@router.post("/admin/contributions/force-realize")
async def force_realize_contribution(
    contribution_id: int,
    override_params: Optional[Dict] = None
)
```

## Implementation Phases

### Phase 1: Core Infrastructure
1. [ ] Database schema implementation
2. [ ] Basic Celery task setup
3. [ ] Core contribution check logic
4. [ ] Basic monitoring

### Phase 2: Pension Type Integration
1. [ ] ETF pension realization
2. [ ] Company pension realization
3. [ ] Insurance pension realization
4. [ ] Type-specific error handling

### Phase 3: Special Cases
1. [ ] Weekend/holiday handling
2. [ ] Backdated contributions
3. [ ] Error recovery mechanisms
4. [ ] Advanced monitoring

### Phase 4: Admin Tools
1. [ ] Admin interface
2. [ ] Manual controls
3. [ ] Reporting system
4. [ ] Documentation

## Testing Strategy

### Unit Tests
1. [ ] Contribution calculation logic
2. [ ] Date handling utilities
3. [ ] Status transitions
4. [ ] Error handling

### Integration Tests
1. [ ] Database operations
2. [ ] Task execution
3. [ ] API endpoints
4. [ ] Monitoring system

### End-to-End Tests
1. [ ] Complete contribution lifecycle
2. [ ] Error recovery scenarios
3. [ ] Admin operations
4. [ ] Performance testing

## Documentation

### Technical Documentation
1. [ ] System architecture
2. [ ] Database schema
3. [ ] API specifications
4. [ ] Configuration guide

### Operational Documentation
1. [ ] Monitoring guide
2. [ ] Troubleshooting procedures
3. [ ] Recovery playbooks
4. [ ] Maintenance procedures

## Future Enhancements

### Phase 2
1. Machine learning for anomaly detection
2. Advanced reporting capabilities
3. Performance optimizations
4. Extended monitoring features

### Phase 3
1. Multi-region support
2. Advanced holiday calendars
3. Custom realization rules
4. Automated recovery procedures 