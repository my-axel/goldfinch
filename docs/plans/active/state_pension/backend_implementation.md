# State Pension Backend Implementation Plan

> <details>
> <summary><strong>🤖 AI Assistant Guide</strong></summary>
>
> ## Purpose
> This plan outlines the backend implementation for state pensions, focusing on a generic model that works across different pension systems worldwide.
>
> ## When to Use
> - When implementing state pension features
> - When modifying state pension data models
> - When adding or updating state pension API endpoints
>
> ## Implementation Process
>
> ### 1. Model First Approach
> - Start with data models and schemas
> - Ensure all necessary fields are included before proceeding
> - Consider future extensibility
>
> ### 2. API Development
> - Follow FastAPI best practices
> - Use async operations for database calls
> - Implement proper error handling
>
> ### 3. Testing Strategy
> - Write comprehensive tests for models and endpoints
> - Test edge cases and error conditions
> - Verify projection calculations
>
> ## Critical Guidelines
> 1. **Data Integrity**: Ensure proper cascading behavior for statements
> 2. **Performance**: Optimize queries for list views
> 3. **Validation**: Implement thorough input validation
> 4. **Documentation**: Keep API documentation up-to-date
> 5. **Error Handling**: Use proper error types and messages
>
> </details>

## Overview
**Feature**: State Pension Backend Implementation
**Type**: Backend
**Duration**: 1-2 days
**Status**: 📝 Not Started
**Priority**: High
**Related Plan**: Frontend plan (to be created)

## Description
Implement the backend components for managing state pensions, focusing on a generic model that works for most worldwide state pension systems. The implementation will support statement-based tracking of current and projected pension amounts, with flexible projection calculations based on configurable annual increase rates.

## Important Rules & Guidelines
- Store all monetary values in EUR
- Follow existing pension type patterns (Company/Insurance)
- Keep the model generic to support worldwide pension systems
- Use statement-based tracking instead of contribution tracking
- Implement proper error handling and validation
- Follow SQLAlchemy and FastAPI best practices

### Currency Handling
- All monetary values MUST be stored in EUR in the database
- Frontend will handle currency conversion for display using the user's preferred currency
- Use the existing `ExchangeRateService` for any necessary conversions
- Use Decimal type for all monetary fields with precision (20, 2)
- Add proper currency validation in Pydantic schemas
- Document all monetary fields with "EUR" comment for clarity

### Validation Rules
- Statement dates must be sequential
- All monetary amounts must be positive
- Statement date cannot be in the future
- Current monthly amount must be less than or equal to projected monthly amount

## Requirements

### Data Model (Backend)

#### State Pension Model
```python
class PensionState(Base):
    __tablename__ = "pension_state"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("household_members.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    start_date = Column(Date, nullable=False)  # When person started accumulating state pension

    # Relationships
    member = relationship("HouseholdMember", back_populates="state_pensions")
    statements = relationship("PensionStateStatement", back_populates="pension", cascade="all, delete-orphan")
```

#### Statement Model
```python
class PensionStateStatement(Base):
    __tablename__ = "pension_state_statements"

    id = Column(Integer, primary_key=True, index=True)
    pension_id = Column(Integer, ForeignKey("pension_state.id", ondelete="CASCADE"), nullable=False)
    statement_date = Column(Date, nullable=False)
    current_monthly_amount = Column(Numeric(20, 2), nullable=False)  # Current monthly pension based on contributions so far
    projected_monthly_amount = Column(Numeric(20, 2), nullable=False)  # Projected monthly pension at retirement
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    pension = relationship("PensionState", back_populates="statements")
```

#### List Schema
```python
class StatePensionListSchema(BaseModel):
    """Lightweight schema for state pensions in list view"""
    id: int
    name: str
    member_id: int
    current_value: Decimal  # Current monthly pension amount
    start_date: date
    latest_statement_date: Optional[date] = None
    latest_monthly_amount: Optional[Decimal] = None  # From latest statement
    latest_projected_amount: Optional[Decimal] = None  # From latest statement

    model_config = ConfigDict(from_attributes=True)
```

### API Endpoints

#### Pension Summary Endpoint
```python
@router.get("/pension-summaries/state", response_model=List[StatePensionListSchema])
async def get_state_pension_summaries(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    member_id: Optional[int] = None,
) -> List[StatePensionListSchema]:
    """
    Get a lightweight list of state pensions with summary information.
    This endpoint is optimized for list views and returns only essential data.
    """
    return pension_state.get_list(
        db=db, 
        skip=skip, 
        limit=limit, 
        member_id=member_id
    )
```

#### State Pension Endpoints
1. `GET /api/v1/pensions/state`
   - List all state pensions for all members
   - Optional member_id query parameter

2. `GET /api/v1/pensions/state/{id}`
   - Get detailed state pension information

3. `POST /api/v1/pensions/state`
   - Create new state pension

4. `PUT /api/v1/pensions/state/{id}`
   - Update state pension details

5. `DELETE /api/v1/pensions/state/{id}`
   - Delete state pension and associated data

#### Statement Endpoints
1. `GET /api/v1/pensions/state/{pension_id}/statements`
   - List all statements for a pension

2. `GET /api/v1/pensions/state/{pension_id}/statements/{id}`
   - Get specific statement details

3. `POST /api/v1/pensions/state/{pension_id}/statements`
   - Add new statement

4. `PUT /api/v1/pensions/state/{pension_id}/statements/{id}`
   - Update statement details

5. `DELETE /api/v1/pensions/state/{pension_id}/statements/{id}`
   - Delete statement

#### Projection Endpoints
1. `GET /api/v1/pensions/state/{pension_id}/scenarios`
   - Calculate scenarios based on latest statement values, household members retirement ageand configured rates.

## Implementation Steps

### 1. Database Setup ✅
- [x] Add PensionType.STATE to enums (already existed as GOVERNMENT)
- [x] Create pension_state table migration (completed with bde99be20c45_add_state_pension_tables.py)
- [x] Create pension_state_statements table migration (completed in same migration)
- [x] Add state_pensions relationship to HouseholdMember model (completed)

### 2. Settings Service Enhancement ✅
- [x] Implement settings changes as specified in [Settings Enhancement Plan](settings_enhancement.md)
- [x] Ensure proper integration with state pension projections
- [x] Add validation for state pension rate usage in projection calculations

### 3. Models and Schemas ✅
- [x] Implement PensionState model
- [x] Implement PensionStateStatement model
- [x] Create Pydantic schemas:
  - [x] PensionStateBase
  - [x] PensionStateCreate
  - [x] PensionStateUpdate
  - [x] PensionStateResponse
  - [x] StatementBase
  - [x] StatementCreate
  - [x] StatementUpdate
  - [x] StatementResponse
  - [x] StatePensionListSchema

### 4. CRUD Operations ✅
- [x] Implement StatePensionCRUD class:
  - [x] Basic CRUD operations
  - [x] Statement management
  - [x] Latest statement retrieval
  - [x] Value calculations
- [x] Add dependency injection setup

### 5. API Routes ✅
- [x] Implement pension routes
- [x] Implement statement routes
- [x] Implement projection calculation endpoint
- [x] Implement pension-summaries endpoint
  - [x] Add route to pension_summaries.py
  - [x] Implement optimized list query in CRUD
  - [x] Add proper response model
- [x] Add route documentation
- [x] Add request/response examples

### 6. Testing ⏳
- [x] Unit tests for models
- [ ] Unit tests for CRUD operations
- [ ] Integration tests for API endpoints
- [ ] Test projection calculations
- [ ] Test currency handling

## Dependencies
- Existing pension module structure
- Household member system
- Currency conversion system

## Technical Notes

### Database Considerations
- Indexes on frequently queried fields
- Proper cascading delete behavior
- Statement date indexing for efficient retrieval

### API Design
- Follow RESTful principles
- Consistent error responses
- Proper validation messages
- Efficient projection calculations

### Testing
```bash
# Basic pension endpoints
curl -X GET http://localhost:8000/api/v1/pensions/state
curl -X POST http://localhost:8000/api/v1/pensions/state -H "Content-Type: application/json" -d '{"name": "My State Pension", "member_id": 1, "start_date": "2020-01-01"}'
curl -X GET http://localhost:8000/api/v1/pensions/state/1/scenarios

# Statement endpoints
curl -X POST http://localhost:8000/api/v1/pensions/state/1/statements -H "Content-Type: application/json" -d '{"statement_date": "2024-01-01", "current_monthly_amount": 500, "projected_monthly_amount": 2000}'
curl -X GET http://localhost:8000/api/v1/pensions/state/1/statements

# Summary endpoint
curl -X GET http://localhost:8000/api/v1/pension-summaries/state?member_id=1

# Projection scenarios
curl -X GET http://localhost:8000/api/v1/pensions/state/1/scenarios  # Uses settings-based rates
``` 