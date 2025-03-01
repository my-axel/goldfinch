# Company Pension API

## Overview

The Company Pension API provides endpoints for managing company-sponsored pension plans within the Goldfinch platform. This API allows users to create, read, update, and delete company pension records, as well as manage contribution history and projections.

## Base URL

```
/api/v1/pension/company
```

## Authentication

All endpoints require authentication. Include the authentication token in the Authorization header:

```
Authorization: Bearer {token}
```

## Endpoints

### List Company Pensions

```http
GET /api/v1/pension/company
```

Retrieves a list of company pensions with optional filtering.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| skip | integer | Number of records to skip (default: 0) |
| limit | integer | Maximum number of records to return (default: 100) |
| member_id | string | Filter by household member ID |

#### Response

```json
[
  {
    "id": "cp_123456",
    "type": "COMPANY",
    "name": "Example Corp Pension",
    "member_id": "mem_123456",
    "employer": "Example Corporation",
    "start_date": "2020-01-01",
    "contribution_amount": 500,
    "contribution_frequency": "MONTHLY",
    "latest_statement_date": "2024-03-01",
    "current_value": 25000,
    "notes": "Company matching 5%",
    "status": "ACTIVE",
    "contribution_plan_steps": [
      {
        "id": "cps_123456",
        "start_date": "2020-01-01",
        "amount": 500,
        "frequency": "MONTHLY",
        "is_active": true
      }
    ],
    "projections": [
      {
        "id": "proj_123456",
        "retirement_age": 65,
        "monthly_payout": 1500,
        "total_value": 450000
      }
    ]
  }
]
```

### Get Company Pension

```http
GET /api/v1/pension/company/{pension_id}
```

Retrieves detailed information about a specific company pension.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| pension_id | string | ID of the company pension |

#### Response

```json
{
  "id": "cp_123456",
  "type": "COMPANY",
  "name": "Example Corp Pension",
  "member_id": "mem_123456",
  "employer": "Example Corporation",
  "start_date": "2020-01-01",
  "contribution_amount": 500,
  "contribution_frequency": "MONTHLY",
  "latest_statement_date": "2024-03-01",
  "current_value": 25000,
  "notes": "Company matching 5%",
  "status": "ACTIVE",
  "contribution_plan_steps": [
    {
      "id": "cps_123456",
      "start_date": "2020-01-01",
      "amount": 500,
      "frequency": "MONTHLY",
      "is_active": true
    }
  ],
  "projections": [
    {
      "id": "proj_123456",
      "retirement_age": 65,
      "monthly_payout": 1500,
      "total_value": 450000
    }
  ],
  "contribution_history": [
    {
      "id": "ch_123456",
      "date": "2024-03-01",
      "amount": 500,
      "is_manual": false,
      "note": "Regular contribution"
    }
  ]
}
```

### Create Company Pension

```http
POST /api/v1/pension/company
```

Creates a new company pension.

#### Request Body

```json
{
  "name": "Example Corp Pension",
  "member_id": "mem_123456",
  "employer": "Example Corporation",
  "start_date": "2020-01-01",
  "contribution_amount": 500,
  "contribution_frequency": "MONTHLY",
  "latest_statement_date": "2024-03-01",
  "notes": "Company matching 5%",
  "status": "ACTIVE",
  "contribution_plan_steps": [
    {
      "start_date": "2020-01-01",
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

#### Response

Returns the created company pension object with status code 201.

### Update Company Pension

```http
PUT /api/v1/pension/company/{pension_id}
```

Updates an existing company pension.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| pension_id | string | ID of the company pension |

#### Request Body

```json
{
  "name": "Updated Corp Pension",
  "employer": "Updated Corporation",
  "start_date": "2020-01-01",
  "contribution_amount": 600,
  "contribution_frequency": "MONTHLY",
  "latest_statement_date": "2024-03-15",
  "current_value": 26000,
  "notes": "Updated notes",
  "status": "ACTIVE",
  "contribution_plan_steps": [
    {
      "id": "cps_123456",
      "start_date": "2020-01-01",
      "amount": 500,
      "frequency": "MONTHLY",
      "is_active": false
    },
    {
      "start_date": "2024-01-01",
      "amount": 600,
      "frequency": "MONTHLY",
      "is_active": true
    }
  ],
  "projections": [
    {
      "id": "proj_123456",
      "retirement_age": 65,
      "monthly_payout": 1600,
      "total_value": 480000
    }
  ]
}
```

#### Response

Returns the updated company pension object.

### Delete Company Pension

```http
DELETE /api/v1/pension/company/{pension_id}
```

Deletes a company pension.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| pension_id | string | ID of the company pension |

#### Response

Returns a 204 No Content response on success.

### List Contribution History

```http
GET /api/v1/pension/company/{pension_id}/contribution-history
```

Retrieves contribution history for a specific company pension.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| pension_id | string | ID of the company pension |

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| skip | integer | Number of records to skip (default: 0) |
| limit | integer | Maximum number of records to return (default: 100) |
| start_date | string | Filter by start date (YYYY-MM-DD) |
| end_date | string | Filter by end date (YYYY-MM-DD) |

#### Response

```json
[
  {
    "id": "ch_123456",
    "date": "2024-03-01",
    "amount": 500,
    "is_manual": false,
    "note": "Regular contribution"
  },
  {
    "id": "ch_123457",
    "date": "2024-02-01",
    "amount": 500,
    "is_manual": false,
    "note": "Regular contribution"
  }
]
```

### Add Contribution History

```http
POST /api/v1/pension/company/{pension_id}/contribution-history
```

Adds a contribution history entry to a company pension.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| pension_id | string | ID of the company pension |

#### Request Body

```json
{
  "date": "2024-03-15",
  "amount": 1000,
  "is_manual": true,
  "note": "Bonus contribution"
}
```

#### Response

Returns the created contribution history object with status code 201.

### Delete Contribution History

```http
DELETE /api/v1/pension/company/contribution-history/{contribution_id}
```

Deletes a contribution history entry.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| contribution_id | string | ID of the contribution history entry |

#### Response

Returns a 204 No Content response on success.

## Data Models

### Company Pension

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| type | string | Always "COMPANY" |
| name | string | Name of the pension plan |
| member_id | string | ID of the household member |
| employer | string | Name of the employer |
| start_date | string | Start date of the pension (YYYY-MM-DD) |
| contribution_amount | number | Current contribution amount |
| contribution_frequency | string | Frequency of contributions (MONTHLY, QUARTERLY, ANNUALLY) |
| latest_statement_date | string | Date of the latest statement (YYYY-MM-DD) |
| current_value | number | Current value of the pension |
| notes | string | Optional notes |
| status | string | Status of the pension (ACTIVE, INACTIVE) |
| contribution_plan_steps | array | Array of contribution plan steps |
| projections | array | Array of retirement projections |

### Contribution Plan Step

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| start_date | string | Start date of the step (YYYY-MM-DD) |
| amount | number | Contribution amount |
| frequency | string | Frequency of contributions (MONTHLY, QUARTERLY, ANNUALLY) |
| is_active | boolean | Whether this step is currently active |

### Projection

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| retirement_age | number | Age at retirement |
| monthly_payout | number | Estimated monthly payout |
| total_value | number | Estimated total value at retirement |

### Contribution History

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| date | string | Date of the contribution (YYYY-MM-DD) |
| amount | number | Contribution amount |
| is_manual | boolean | Whether this was a manual entry |
| note | string | Optional note |

## Error Responses

### 400 Bad Request

```json
{
  "detail": "Invalid input data: [specific error message]"
}
```

### 404 Not Found

```json
{
  "detail": "Company pension with ID 'cp_123456' not found"
}
```

### 500 Internal Server Error

```json
{
  "detail": "An unexpected error occurred"
}
```