# Company Pension API Documentation

## Overview

The Company Pension API provides endpoints for managing company-sponsored pension plans. It handles CRUD operations, contribution tracking, and retirement projections for company pension plans.

## Features

- Complete CRUD operations for company pensions
- Contribution history management
- Contribution plan step tracking
- Retirement projections calculation
- Value tracking and updates
- Data validation and error handling
- Automatic ID generation

## Data Models

### PensionCompany

```python
class PensionCompany(Base):
    __tablename__ = "pension_company"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    member_id = Column(String, ForeignKey("household_member.id"), nullable=False)
    employer = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    contribution_amount = Column(Float, nullable=False)
    contribution_frequency = Column(String, nullable=False)
    latest_statement_date = Column(Date, nullable=False)
    current_value = Column(Float, nullable=False, default=0.0)
    notes = Column(String, nullable=True)
    status = Column(String, nullable=False, default="ACTIVE")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### PensionCompanyContributionPlanStep

```python
class PensionCompanyContributionPlanStep(Base):
    __tablename__ = "pension_company_contribution_plan_step"

    id = Column(String, primary_key=True, index=True)
    pension_id = Column(String, ForeignKey("pension_company.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    frequency = Column(String, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### PensionCompanyProjection

```python
class PensionCompanyProjection(Base):
    __tablename__ = "pension_company_projection"

    id = Column(String, primary_key=True, index=True)
    pension_id = Column(String, ForeignKey("pension_company.id"), nullable=False)
    retirement_age = Column(Integer, nullable=False)
    monthly_payout = Column(Float, nullable=False)
    total_value = Column(Float, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### PensionCompanyContributionHistory

```python
class PensionCompanyContributionHistory(Base):
    __tablename__ = "pension_company_contribution_history"

    id = Column(String, primary_key=True, index=True)
    pension_id = Column(String, ForeignKey("pension_company.id"), nullable=False)
    date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    is_manual = Column(Boolean, nullable=False, default=True)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
```

## API Endpoints

### Company Pension Management

#### GET /api/v1/pension/company
Retrieve a list of company pensions with optional filtering.

Query Parameters:
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records to return (default: 100)
- `member_id` (optional): Filter by household member ID

Response:
```json
[
  {
    "id": "string",
    "type": "COMPANY",
    "name": "string",
    "member_id": "string",
    "employer": "string",
    "start_date": "2024-03-01",
    "contribution_amount": 500,
    "contribution_frequency": "MONTHLY",
    "latest_statement_date": "2024-03-01",
    "current_value": 10000,
    "notes": "string",
    "status": "ACTIVE",
    "contribution_plan_steps": [
      {
        "id": "string",
        "start_date": "2024-03-01",
        "amount": 500,
        "frequency": "MONTHLY",
        "is_active": true
      }
    ],
    "projections": [
      {
        "id": "string",
        "retirement_age": 65,
        "monthly_payout": 1500,
        "total_value": 450000
      }
    ]
  }
]
```

#### GET /api/v1/pension/company/{pension_id}
Get detailed information about a specific company pension.

Response:
```json
{
  "id": "string",
  "type": "COMPANY",
  "name": "string",
  "member_id": "string",
  "employer": "string",
  "start_date": "2024-03-01",
  "contribution_amount": 500,
  "contribution_frequency": "MONTHLY",
  "latest_statement_date": "2024-03-01",
  "current_value": 10000,
  "notes": "string",
  "status": "ACTIVE",
  "contribution_plan_steps": [
    {
      "id": "string",
      "start_date": "2024-03-01",
      "amount": 500,
      "frequency": "MONTHLY",
      "is_active": true
    }
  ],
  "projections": [
    {
      "id": "string",
      "retirement_age": 65,
      "monthly_payout": 1500,
      "total_value": 450000
    }
  ],
  "contribution_history": [
    {
      "id": "string",
      "date": "2024-03-01",
      "amount": 500,
      "is_manual": true,
      "note": "string"
    }
  ]
}
```

#### POST /api/v1/pension/company
Create a new company pension.

Request Body:
```json
{
  "name": "string",
  "member_id": "string",
  "employer": "string",
  "start_date": "2024-03-01",
  "contribution_amount": 500,
  "contribution_frequency": "MONTHLY",
  "latest_statement_date": "2024-03-01",
  "notes": "string",
  "status": "ACTIVE",
  "contribution_plan_steps": [
    {
      "start_date": "2024-03-01",
      "amount": 500,
      "frequency": "MONTHLY",
      "is_active": true
    }
  ],
  "projections": [
    {
      "retirement_age": 65,
      "monthly_payout": 1500,
      "total_value": 450000
    }
  ]
}
```

#### PUT /api/v1/pension/company/{pension_id}
Update an existing company pension.

Request Body:
```json
{
  "name": "string",
  "employer": "string",
  "start_date": "2024-03-01",
  "contribution_amount": 500,
  "contribution_frequency": "MONTHLY",
  "latest_statement_date": "2024-03-01",
  "current_value": 10000,
  "notes": "string",
  "status": "ACTIVE",
  "contribution_plan_steps": [
    {
      "id": "string",
      "start_date": "2024-03-01",
      "amount": 500,
      "frequency": "MONTHLY",
      "is_active": true
    }
  ],
  "projections": [
    {
      "id": "string",
      "retirement_age": 65,
      "monthly_payout": 1500,
      "total_value": 450000
    }
  ]
}
```

#### DELETE /api/v1/pension/company/{pension_id}
Delete a company pension.

### Contribution History Management

#### GET /api/v1/pension/company/{pension_id}/contribution-history
Get contribution history for a specific company pension.

Query Parameters:
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records to return (default: 100)
- `start_date` (optional): Filter by start date
- `end_date` (optional): Filter by end date

Response:
```json
[
  {
    "id": "string",
    "date": "2024-03-01",
    "amount": 500,
    "is_manual": true,
    "note": "string"
  }
]
```

#### POST /api/v1/pension/company/{pension_id}/contribution-history
Add a contribution history entry to a company pension.

Request Body:
```json
{
  "date": "2024-03-01",
  "amount": 500,
  "is_manual": true,
  "note": "string"
}
```

#### DELETE /api/v1/pension/company/contribution-history/{contribution_id}
Delete a contribution history entry.

## Implementation Details

### Contribution Plan Steps

Contribution plan steps track changes in contribution amounts over time. When a new step is added:

1. The previous step is marked as inactive
2. The new step becomes the active step
3. The pension's `contribution_amount` and `contribution_frequency` are updated to match the new step

### Projections Calculation

Retirement projections are calculated based on:

1. Current value of the pension
2. Contribution amount and frequency
3. Expected retirement age of the member
4. Assumed annual growth rate (from settings)

The calculation uses a compound interest formula to project the future value, then converts it to a monthly payout based on life expectancy.

### Value Tracking

The current value of a company pension is tracked through:

1. Initial value set at creation
2. Manual updates via the API
3. Contribution history entries that affect the total value

## Error Handling

The API implements comprehensive error handling:

1. **400 Bad Request**: Invalid input data
2. **404 Not Found**: Pension or related resource not found
3. **409 Conflict**: Duplicate or conflicting data
4. **500 Internal Server Error**: Unexpected server errors

All errors return a standardized error response:

```json
{
  "detail": "Error message describing the issue"
}
```

## Dependencies

- **Household Module**: For member data and retirement age calculations
- **Settings Module**: For growth rate assumptions and currency preferences 