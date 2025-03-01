# 🔄 Task Monitoring System Migration Plan

## Overview
This document outlines the step-by-step migration plan from the current task tracking implementations to the new specialized task monitoring system, following the principles defined in [task_monitoring_principles.md](task_monitoring_principles.md).

### Goals
- Standardize task tracking across all background operations
- Improve reliability with proper retry mechanisms
- Enable better monitoring and debugging capabilities
- Reduce technical debt by removing generic solutions
- Ensure consistent error handling

### Success Criteria
- All tasks use domain-specific tracking tables
- No references to legacy TaskStatus table remain
- All tracking tables include required fields and indexes
- Migration completed with zero data loss
- All tasks maintain proper status tracking
- Retry mechanisms working as expected

## Current State Analysis

### 1. Legacy TaskStatus Table
```sql
-- Current implementation
CREATE TABLE task_status (
    id SERIAL PRIMARY KEY,
    task_type VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    resource_id INTEGER NOT NULL,
    error VARCHAR,
    task_metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Used by**:
- Exchange rate update tracking
- Legacy ETF creation tasks
- General task status tracking

**Issues**:
- Too generic
- Missing critical fields (attempts, max_attempts)
- No proper indexing
- No status timestamps (started_at, completed_at)
- No Celery task ID tracking

### 2. ETF Update Tracking
```sql
CREATE TABLE etf_updates (
    id SERIAL PRIMARY KEY,
    etf_id VARCHAR NOT NULL REFERENCES etfs(id),
    update_type VARCHAR NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    error VARCHAR,
    missing_dates DATE[],
    retry_count INTEGER NOT NULL DEFAULT 0,
    notes VARCHAR
);
```

**Alignment with New Principles**:
- ✅ Domain-specific fields
- ✅ Basic status tracking
- ✅ Retry counting
- ❌ Missing max_attempts
- ❌ Missing started_at
- ❌ Missing celery_task_id
- ❌ Needs index optimization

### 3. Daily Update Tracking
```sql
CREATE TABLE daily_update_tracking (
    date DATE NOT NULL,
    update_type VARCHAR(50) NOT NULL,
    attempted BOOLEAN DEFAULT FALSE,
    data_found BOOLEAN DEFAULT FALSE,
    notes TEXT,
    PRIMARY KEY (date, update_type)
);
```

**Issues**:
- Too simplified
- Missing standard status fields
- No error tracking
- No timestamp tracking
- No retry mechanism

## Migration Plan

### Phase 1: Base Layer Implementation

#### 1.1 Base Models and Database
```python
# src/backend/app/models/base_task_tracking.py
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.db.base_class import Base

class BaseTaskTracking(Base):
    """Base model for all task tracking tables"""
    __abstract__ = True
    
    id = Column(Integer, primary_key=True)
    status = Column(String(20), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    error_message = Column(Text)
    attempts = Column(Integer, nullable=False, default=0)
    max_attempts = Column(Integer, nullable=False, default=3)
    celery_task_id = Column(String(255))
```

#### 1.2 Base Service
```python
# src/backend/app/services/base_task_tracking.py
class BaseTaskTrackingService:
    """Base service for all task tracking operations"""
    def __init__(self, db: AsyncSession, model: Type[BaseTaskTracking]):
        self.db = db
        self.model = model
    
    async def create_tracking(self, **kwargs) -> int:
        """Create a new task tracking record"""
        tracking = self.model(
            status="PENDING",
            created_at=datetime.utcnow(),
            **kwargs
        )
        self.db.add(tracking)
        await self.db.commit()
        return tracking.id
    
    async def update_status(
        self,
        tracking_id: int,
        status: str,
        error_message: Optional[str] = None
    ) -> None:
        """Update task status and related fields"""
        tracking = await self.db.get(self.model, tracking_id)
        if not tracking:
            return
        
        tracking.status = status
        tracking.updated_at = datetime.utcnow()
        
        if status == "PROCESSING":
            tracking.started_at = datetime.utcnow()
        elif status in ["COMPLETED", "FAILED"]:
            tracking.completed_at = datetime.utcnow()
        
        if error_message:
            tracking.error_message = error_message
            tracking.attempts += 1
        
        await self.db.commit()
```

#### 1.3 Shared Utilities
```python
# src/backend/app/utils/task_tracking.py
async def update_task_status(
    tracking_id: int,
    status: str,
    service: BaseTaskTrackingService,
    error_message: Optional[str] = None
) -> None:
    """Update task status with proper error handling"""
    try:
        await service.update_status(tracking_id, status, error_message)
    except Exception as e:
        logger.error(f"Failed to update task status: {str(e)}")
        raise

async def handle_task_error(
    task: Task,
    tracking_id: int,
    error: Exception,
    service: BaseTaskTrackingService
) -> None:
    """Handle task error with proper logging and retry logic"""
    error_message = f"{error.__class__.__name__}: {str(error)}"
    await update_task_status(tracking_id, "FAILED", service, error_message)
    
    tracking = await service.get_tracking(tracking_id)
    if tracking.attempts < tracking.max_attempts:
        raise task.retry(exc=error, countdown=60 * (2 ** task.request.retries))
```

### Phase 2: Domain-Specific Implementation

#### 2.1 Exchange Rate Update Tracking
```sql
CREATE TABLE exchange_rate_update_tracking (
    id SERIAL PRIMARY KEY,
    -- Standard tracking fields inherited from BaseTaskTracking
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    celery_task_id VARCHAR(255),
    
    -- Domain-specific fields
    update_date DATE NOT NULL,
    base_currency VARCHAR(3) NOT NULL,
    target_currencies VARCHAR(3)[] NOT NULL,
    success_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    source VARCHAR(50) NOT NULL,
    
    -- Constraints and indexes
    CONSTRAINT uq_exchange_rate_update 
        UNIQUE(update_date, base_currency)
);

CREATE INDEX idx_exchange_rate_status ON exchange_rate_update_tracking(status);
CREATE INDEX idx_exchange_rate_dates ON exchange_rate_update_tracking(created_at, completed_at);
```

#### 2.2 ETF Update Table Migration
```sql
-- Add missing standard fields
ALTER TABLE etf_updates
    ADD COLUMN started_at TIMESTAMP,
    ADD COLUMN max_attempts INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN celery_task_id VARCHAR(255),
    ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Rename columns for consistency
ALTER TABLE etf_updates
    RENAME COLUMN error TO error_message,
    RENAME COLUMN retry_count TO attempts;

-- Add missing indexes
CREATE INDEX idx_etf_update_status ON etf_updates(status);
CREATE INDEX idx_etf_update_dates ON etf_updates(created_at, completed_at);
```

#### 2.3 Daily Update Tracking Migration
```sql
CREATE TABLE daily_update_tracking_new (
    id SERIAL PRIMARY KEY,
    -- Standard tracking fields inherited from BaseTaskTracking
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    celery_task_id VARCHAR(255),
    
    -- Domain-specific fields
    update_date DATE NOT NULL,
    update_type VARCHAR(50) NOT NULL,
    data_found BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    CONSTRAINT uq_daily_update UNIQUE(update_date, update_type)
);

CREATE INDEX idx_daily_update_status ON daily_update_tracking_new(status);
CREATE INDEX idx_daily_update_dates ON daily_update_tracking_new(created_at, completed_at);
```

### Phase 3: Data Migration

#### 3.1 Migration Scripts
```python
async def migrate_exchange_rate_tasks():
    """Migrate exchange rate tasks from TaskStatus to new tracking table"""
    old_tasks = await db.execute(
        select(TaskStatus).where(
            TaskStatus.task_type == "exchange_rate_update"
        )
    )
    
    for task in old_tasks:
        metadata = task.task_metadata or {}
        await ExchangeRateTrackingService(db).create_tracking(
            update_date=metadata.get("date"),
            base_currency="EUR",
            target_currencies=metadata.get("currencies", []),
            status=task.status,
            created_at=task.created_at,
            updated_at=task.updated_at,
            error_message=task.error
        )

async def migrate_daily_updates():
    """Migrate from old daily_update_tracking to new schema"""
    old_records = await db.execute(select(DailyUpdateTracking))
    
    for record in old_records:
        status = "COMPLETED" if record.data_found else "FAILED"
        await DailyUpdateTrackingService(db).create_tracking(
            update_date=record.date,
            update_type=record.update_type,
            status=status,
            data_found=record.data_found,
            notes=record.notes
        )
```

### Phase 4: Code Updates

#### 4.1 Update Task Processing Code
```python
# Example: Exchange Rate Updates
@celery_app.task
async def update_exchange_rates():
    tracking = ExchangeRateTrackingService(db)
    tracking_id = await tracking.create_update_tracking(
        update_date=date.today(),
        base_currency="EUR",
        target_currencies=settings.SUPPORTED_CURRENCIES
    )
    try:
        await tracking.update_status(tracking_id, "PROCESSING")
        # Task logic here
        await tracking.update_status(tracking_id, "COMPLETED")
    except Exception as e:
        await handle_task_error(update_exchange_rates, tracking_id, e, tracking)
```

### Phase 5: Verification and Cleanup

#### 5.1 Verification Steps
1. Run migration scripts with dry-run mode
2. Verify data integrity after migration
3. Run parallel systems for 1 week
4. Compare old and new system results

#### 5.2 Cleanup
```sql
-- Archive old data
CREATE TABLE archived_task_status AS SELECT * FROM task_status;
CREATE TABLE archived_daily_update_tracking AS SELECT * FROM daily_update_tracking;

-- After verification period
DROP TABLE task_status;
DROP TABLE daily_update_tracking;
```

## Post-Migration Tasks

### Cleanup
1. Remove legacy code references
2. Archive old data
3. Update documentation
4. Remove migration scripts

### Validation
1. Monitor error rates
2. Verify task completion rates
3. Check data consistency
4. Validate retry behavior

### Documentation
1. Update API documentation
2. Update runbooks
3. Document new monitoring procedures
4. Update troubleshooting guides

## Implementation Timeline

1. Week 1: Base Layer Implementation
   - Set up base models and services
   - Create shared utilities
   - Write tests for base components
   - BUFFER: 1 day for unexpected issues

2. Week 2: Domain-Specific Implementation
   - Create new tracking tables
   - Implement domain services
   - Update existing code
   - BUFFER: 1 day for schema adjustments

3. Week 3: Migration and Testing
   - Run data migrations
   - Test new implementations
   - Run parallel systems
   - BUFFER: 2 days for data verification

4. Week 4-5: Verification and Cleanup
   - Monitor system behavior (1 week)
   - Archive old data
   - Remove legacy components
   - BUFFER: 3 days for final verification