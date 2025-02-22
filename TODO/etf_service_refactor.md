# ETF Service Refactoring Plan

## 1. Foundation (Models and Database)

- [ ] Create/Update ETFUpdate Model
  * Add new fields for tracking updates (similar to ExchangeRateUpdate)
  * Add notes field for date adjustment tracking
  * Add proper indices for performance
  * Create migration file

- [ ] Update ETFPrice Model
  * Add index on (etf_id, date) for faster lookups
  * Add index on date for range queries
  * Update constraints if needed
  * Add proper cascade behavior for ETF deletions

- [ ] Create Migration Plan
  * Automatically create migrations
  * Add data cleanup scripts
  * Add validation scripts
  * Notify user to run migrations

## 2. Core Infrastructure

- [ ] Create New ETFUpdateService
  * Implement core service structure
  * Add configuration constants
  * Add retry mechanism matching exchange rate service
  * Implement date boundary validation
  * Add exchange rate availability checking

- [ ] Improve ETF Data Import
  * Get complete ETF info from YFinance:
    - ISIN and symbol
    - Long name and short name
    - Asset class and category
    - Fund size and inception date
    - Total expense ratio (TER)
    - Distribution policy
    - Domicile information
  * Add proper data validation
  * Add fallback for missing fields
  * Update existing ETFs with complete data

- [ ] Add Data Validation
  * Implement date range validation
  * Add exchange rate availability checking
  * Add data integrity validation
  * Add proper error messages

- [ ] Implement Enhanced Error Tracking
  * Add integration with exchange_rate_errors
  * Implement comprehensive logging
  * Add date adjustment tracking
  * Add YFinance error logging

## 3. Processing and Performance

- [ ] Implement Batch Processing
  * Create efficient batch processing for prices
  * Implement 90-day chunking
  * Add pre-fetching of exchange rates
  * Use bulk inserts for price updates

- [ ] Implement YFinance Metrics System
  * Create YFinanceMetrics class
  * Implement basic metrics collection
  * Add cleanup mechanism
  * Add weekly reset functionality

- [ ] Essential Price Optimizations
  * Move average price calculation to backend
  * Ensure last_price is always updated correctly
  * Add proper indices for common queries

## 4. Task Management

- [ ] Implement Celery Tasks
  * Create update task
  * Add retry mechanism
  * Add maintenance task
  * Add proper error handling

- [ ] Create Maintenance System
  * Implement daily maintenance task
  * Add metrics cleanup
  * Add old records cleanup
  * Add data integrity checks

## 5. API and Monitoring

- [ ] Update API Endpoints
  * Review and clean up existing endpoints
  * Add new update endpoints
  * Add status endpoint
  * Update response models

- [ ] Add New API Features
  * Add update triggering endpoints
  * Add status monitoring endpoint
  * Add metrics endpoint
  * Update documentation

- [ ] Implement Status Monitoring
  * Create comprehensive status endpoint
  * Add basic metrics reporting
  * Add update status tracking
  * Add historical data reporting

## 6. Frontend Integration

- [ ] Update ETF Context
  * Add update status methods
  * Update pension value calculations
  * Add basic error handling

- [ ] Add New Components
  * Create ETF update status component
  * Add basic price update notifications
  * Add simple metrics display

- [ ] Update Existing Components
  * Modify pension calculations for new price structure
  * Add loading states for price updates
  * Improve error handling

## 7. Documentation

- [ ] Update Documentation in docs/etf_service/
  * Update API documentation
  * Add metrics documentation
  * Add maintenance documentation
  * Add troubleshooting guide

## 8. Final Steps

- [ ] Perform Security Review
  * Review error exposures
  * Check data validations
  * Review API security
  * Check logging security

- [ ] Create Deployment Plan
  * Create deployment checklist
  * Add basic monitoring setup
  * Add alerting setup
  * Create rollback procedure 