# Savings Pension - Backend Implementation Plan

> <details>
> <summary><strong>🤖 AI Assistant Guide</strong></summary>
>
> ## Purpose
> This document outlines the test-driven implementation plan for the Savings pension type in the backend. It provides detailed guidance for implementing models, schemas, CRUD operations, API endpoints, and projection calculations following test-driven development principles.
>
> ## Document Structure
>
> ### 1. Overview
> - Core features and requirements
> - Implementation approach
> - Key components
>
> ### 2. Test-Driven Implementation Process
> - Model tests (PensionSavings, statements, contribution plans)
> - Schema validation tests
> - CRUD operation tests
> - API endpoint tests
> - Projection calculation tests
>
> ### 3. Implementation Based on Tests
> - Implementation steps organized by phase
> - Dependencies and integration points
>
> ## Decision Making Guide
>
> ### When Implementing Models
> 1. Start with the core entity model
> 2. Implement related models (statements, contribution plans)
> 3. Set appropriate default values and constraints
> 4. Update enums and relationships
>
> ### When Implementing Schemas
> 1. Define base schema with common fields
> 2. Implement create/update/response variants
> 3. Add proper validation rules for interest rates
> 4. Ensure consistent decimal handling
>
> ### When Implementing Services
> 1. Implement compound interest calculations with different frequencies
> 2. Support variable contribution schedules
> 3. Generate multiple projection scenarios
>
> ## Status Indicators
> - ✅ Complete
> - 🟡 In Progress
> - 📝 Not Started
>
> ## Rules & Best Practices
> 1. Write tests before implementation
> 2. Ensure proper validation of interest rates
> 3. Handle decimal calculations with precision
> 4. Reuse patterns from existing pension types
> 5. Document APIs and calculation logic
> </details>

**Status**: 🟡 In Progress  
**Duration**: 2-3 weeks  
**Approach**: Test-Driven Development  

## 1. Overview

This document outlines the test-driven implementation plan for the Savings pension type in the backend. The Savings pension type will represent bank accounts or similar savings vehicles where users earn interest on their deposits.

Key features:
- Track savings account balances via statements
- Store interest rates for different scenarios with each pension
- Support for contribution plans (regular deposits)
- Projection calculations with compound interest

## 2. Test-Driven Implementation Process

### Phase 1: Model Tests (Week 1, Days 1-2) ✅

#### 2.1.1 PensionSavings Model Tests ✅

```python
# src/backend/tests/models/test_pension_savings_models.py
from datetime import date
from decimal import Decimal
import pytest
from sqlalchemy.exc import IntegrityError
from app.models.pension_savings import PensionSavings, PensionSavingsStatement, PensionSavingsContributionPlanStep
from app.models.enums import PensionStatus, ContributionFrequency, CompoundingFrequency

pytestmark = pytest.mark.models

@pytest.mark.unit
def test_pension_savings_create(db_session, test_member):
    """Test creating a basic savings pension."""
    pension = PensionSavings(
        member_id=test_member.id,
        name="Test Savings Account",
        start_date=date(2020, 1, 1),
        status=PensionStatus.ACTIVE,
        pessimistic_rate=Decimal("1.0"),
        realistic_rate=Decimal("2.0"),
        optimistic_rate=Decimal("3.0"),
        compounding_frequency=CompoundingFrequency.ANNUALLY
    )
    db_session.add(pension)
    db_session.commit()
    
    assert pension.id is not None
    assert pension.name == "Test Savings Account"
    assert pension.start_date == date(2020, 1, 1)
    assert pension.status == PensionStatus.ACTIVE
    assert pension.pessimistic_rate == Decimal("1.0")
    assert pension.realistic_rate == Decimal("2.0")
    assert pension.optimistic_rate == Decimal("3.0")
    assert pension.compounding_frequency == CompoundingFrequency.ANNUALLY

@pytest.mark.unit
def test_pension_savings_unique_constraints(db_session, test_member):
    """Test unique constraints on savings pension model."""
    pension1 = PensionSavings(
        member_id=test_member.id,
        name="Test Savings Account",
        start_date=date(2020, 1, 1)
    )
    db_session.add(pension1)
    db_session.commit()
    
    # Try to create another pension with the same name for the same member
    # This should be allowed as names don't need to be unique per member
    pension2 = PensionSavings(
        member_id=test_member.id,
        name="Test Savings Account",  # Same name
        start_date=date(2021, 1, 1)
    )
    db_session.add(pension2)
    db_session.commit()
    
    assert pension1.id != pension2.id

@pytest.mark.unit
def test_pension_savings_defaults(db_session, test_member):
    """Test default values for savings pension."""
    pension = PensionSavings(
        member_id=test_member.id,
        name="Test Savings Account",
        start_date=date(2020, 1, 1)
    )
    db_session.add(pension)
    db_session.commit()
    
    assert pension.status == PensionStatus.ACTIVE
    assert pension.pessimistic_rate == Decimal("1.0")
    assert pension.realistic_rate == Decimal("2.0")
    assert pension.optimistic_rate == Decimal("3.0")
    assert pension.compounding_frequency == CompoundingFrequency.ANNUALLY

@pytest.mark.unit
def test_pension_savings_relationships(db_session, test_member):
    """Test relationships between PensionSavings and related models."""
    pension = PensionSavings(
        member_id=test_member.id,
        name="Test Savings Account",
        start_date=date(2020, 1, 1)
    )
    db_session.add(pension)
    db_session.commit()
    
    # Test member relationship
    assert pension.member_id == test_member.id
    
    # Test statements relationship
    statement1 = PensionSavingsStatement(
        pension_id=pension.id,
        statement_date=date(2024, 1, 1),
        balance=Decimal("5000.00")
    )
    statement2 = PensionSavingsStatement(
        pension_id=pension.id,
        statement_date=date(2023, 1, 1),
        balance=Decimal("4000.00")
    )
    db_session.add_all([statement1, statement2])
    db_session.commit()
    
    # Test contribution plan steps relationship
    contribution1 = PensionSavingsContributionPlanStep(
        pension_savings_id=pension.id,
        amount=Decimal("100.00"),
        frequency=ContributionFrequency.MONTHLY,
        start_date=date(2020, 1, 1)
    )
    contribution2 = PensionSavingsContributionPlanStep(
        pension_savings_id=pension.id,
        amount=Decimal("200.00"),
        frequency=ContributionFrequency.MONTHLY,
        start_date=date(2022, 1, 1),
        end_date=date(2024, 1, 1)
    )
    db_session.add_all([contribution1, contribution2])
    db_session.commit()
    
    assert len(pension.statements) == 2
    assert len(pension.contribution_plan_steps) == 2
    assert pension.statements[0].statement_date > pension.statements[1].statement_date
```

#### 2.1.2 Factory Functions for Tests ✅

```python
# src/backend/tests/factories.py (add these functions)
from typing import Optional

def create_test_pension_savings(db_session, member_id: Optional[int] = None, **kwargs) -> PensionSavings:
    """Factory function to create a test savings pension."""
    if not member_id:
        test_member = create_test_member(db_session)
        member_id = test_member.id

    defaults = {
        "member_id": member_id,
        "name": "Test Savings Account",
        "start_date": date(2020, 1, 1),
        "status": PensionStatus.ACTIVE,
        "pessimistic_rate": Decimal("1.0"),
        "realistic_rate": Decimal("2.0"),
        "optimistic_rate": Decimal("3.0"),
        "compounding_frequency": CompoundingFrequency.ANNUALLY,
        "notes": None
    }
    defaults.update(kwargs)
    
    pension = PensionSavings(**defaults)
    db_session.add(pension)
    db_session.commit()
    return pension

def create_test_savings_statement(db_session, pension_id: int, **kwargs) -> PensionSavingsStatement:
    """Factory function to create a test savings statement."""
    defaults = {
        "pension_id": pension_id,
        "statement_date": date(2023, 1, 1),
        "balance": Decimal("5000.00"),
        "note": None
    }
    defaults.update(kwargs)
    
    statement = PensionSavingsStatement(**defaults)
    db_session.add(statement)
    db_session.commit()
    return statement

def create_test_savings_contribution_step(db_session, pension_savings_id: int, **kwargs) -> PensionSavingsContributionPlanStep:
    """Factory function to create a test savings contribution plan step."""
    defaults = {
        "pension_savings_id": pension_savings_id,
        "amount": Decimal("100.00"),
        "frequency": ContributionFrequency.MONTHLY,
        "start_date": date(2020, 1, 1),
        "end_date": None,
        "note": None
    }
    defaults.update(kwargs)
    
    contribution = PensionSavingsContributionPlanStep(**defaults)
    db_session.add(contribution)
    db_session.commit()
    return contribution
```

### Phase 2: Schema Tests (Week 1, Day 3) ✅

```python
# src/backend/tests/schemas/test_pension_savings_schemas.py
from datetime import date
from decimal import Decimal
import pytest
from pydantic import ValidationError
from app.schemas.pension_savings import (
    PensionSavingsCreate,
    PensionSavingsUpdate,
    PensionSavingsStatementCreate
)
from app.models.enums import PensionStatus, ContributionFrequency, CompoundingFrequency

pytestmark = pytest.mark.schemas

@pytest.mark.unit
def test_pension_savings_create_schema():
    """Test validation for PensionSavingsCreate schema."""
    # Valid data
    data = {
        "name": "Test Savings",
        "member_id": 1,
        "start_date": date(2020, 1, 1),
        "status": PensionStatus.ACTIVE,
        "notes": "Test notes",
        "pessimistic_rate": Decimal("1.0"),
        "realistic_rate": Decimal("2.0"),
        "optimistic_rate": Decimal("3.0"),
        "compounding_frequency": CompoundingFrequency.ANNUALLY
    }
    pension = PensionSavingsCreate(**data)
    assert pension.name == data["name"]
    assert pension.member_id == data["member_id"]
    
    # Test validation errors
    with pytest.raises(ValidationError):
        PensionSavingsCreate(name="", member_id=1)  # Empty name
    
    with pytest.raises(ValidationError):
        PensionSavingsCreate(name="Test", member_id=-1)  # Invalid member_id
    
    # Test interest rate validation
    with pytest.raises(ValidationError):
        PensionSavingsCreate(
            name="Test", 
            member_id=1, 
            start_date=date(2020, 1, 1),
            pessimistic_rate=Decimal("3.0"),  # higher than realistic
            realistic_rate=Decimal("2.0")
        )
    
    with pytest.raises(ValidationError):
        PensionSavingsCreate(
            name="Test", 
            member_id=1, 
            start_date=date(2020, 1, 1),
            realistic_rate=Decimal("5.0"),  # higher than optimistic
            optimistic_rate=Decimal("3.0")
        )
```

### Phase 3: CRUD Tests (Week 1, Days 4-5) ✅

```python
# src/backend/tests/crud/test_pension_savings_crud.py
from datetime import date
from decimal import Decimal
import pytest
from sqlalchemy.orm import Session
from app.crud.pension_savings import pension_savings
from app.schemas.pension_savings import PensionSavingsCreate, PensionSavingsUpdate
from app.models.enums import PensionStatus, ContributionFrequency, CompoundingFrequency
from tests.factories import create_test_pension_savings, create_test_member

pytestmark = pytest.mark.crud

@pytest.mark.unit
def test_get_by_id(db_session: Session):
    """Test getting a specific savings pension by ID."""
    pension = create_test_pension_savings(db_session)
    result = pension_savings.get(db=db_session, id=pension.id)
    assert result is not None
    assert result.id == pension.id
    assert result.name == pension.name

@pytest.mark.unit
def test_create(db_session: Session):
    """Test creating a new savings pension."""
    member = create_test_member(db_session)
    pension_data = PensionSavingsCreate(
        member_id=member.id,
        name="New Test Savings",
        start_date=date(2020, 1, 1),
        status=PensionStatus.ACTIVE,
        notes="Test notes",
        pessimistic_rate=Decimal("1.0"),
        realistic_rate=Decimal("2.0"),
        optimistic_rate=Decimal("3.0"),
        compounding_frequency=CompoundingFrequency.ANNUALLY
    )
    
    pension = pension_savings.create(db=db_session, obj_in=pension_data)
    assert pension.id is not None
    assert pension.name == pension_data.name
    assert pension.member_id == pension_data.member_id
    assert pension.start_date == pension_data.start_date
    assert pension.pessimistic_rate == pension_data.pessimistic_rate
    assert pension.realistic_rate == pension_data.realistic_rate
    assert pension.optimistic_rate == pension_data.optimistic_rate
    assert pension.compounding_frequency == pension_data.compounding_frequency

@pytest.mark.unit
def test_update(db_session: Session):
    """Test updating a savings pension."""
    pension = create_test_pension_savings(db_session)
    update_data = {
        "name": "Updated Savings Name",
        "notes": "Updated notes",
        "pessimistic_rate": Decimal("1.5"),
        "realistic_rate": Decimal("2.5"),
        "optimistic_rate": Decimal("3.5")
    }
    
    updated_pension = pension_savings.update(
        db=db_session,
        db_obj=pension,
        obj_in=update_data
    )
    assert updated_pension.name == update_data["name"]
    assert updated_pension.notes == update_data["notes"]
    assert updated_pension.pessimistic_rate == update_data["pessimistic_rate"]
    assert updated_pension.realistic_rate == update_data["realistic_rate"]
    assert updated_pension.optimistic_rate == update_data["optimistic_rate"]
```

### Phase 4: API Tests (Week 2, Days 1-3) ✅

```python
# src/backend/tests/api/test_pension_savings_api.py
from datetime import date
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.enums import PensionStatus, ContributionFrequency, CompoundingFrequency
from tests.factories import (
    create_test_member,
    create_test_pension_savings,
    create_test_savings_statement,
    create_test_savings_contribution_step
)

pytestmark = pytest.mark.api

@pytest.mark.integration
def test_get_pension_list(client: TestClient, db_session: Session):
    """Test GET /api/v1/pension/savings endpoint."""
    pension = create_test_pension_savings(db_session)
    
    response = client.get("/api/v1/pension/savings")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    
    # Test member_id filter
    response = client.get(f"/api/v1/pension/savings?member_id={pension.member_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == pension.id

@pytest.mark.integration
def test_get_pension_detail(client: TestClient, db_session: Session):
    """Test GET /api/v1/pension/savings/{id} endpoint."""
    pension = create_test_pension_savings(db_session)
    statement = create_test_savings_statement(db_session, pension_id=pension.id)
    contribution = create_test_savings_contribution_step(db_session, pension_savings_id=pension.id)
    
    response = client.get(f"/api/v1/pension/savings/{pension.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == pension.id
    assert data["name"] == pension.name
    assert len(data["statements"]) == 1
    assert len(data["contribution_plan_steps"]) == 1

@pytest.mark.integration
def test_create_pension(client: TestClient, db_session: Session):
    """Test POST /api/v1/pension/savings endpoint."""
    member = create_test_member(db_session)
    pension_data = {
        "name": "Test Savings Account",
        "member_id": member.id,
        "start_date": "2020-01-01",
        "status": "ACTIVE",
        "notes": "Test notes",
        "pessimistic_rate": 1.0,
        "realistic_rate": 2.0,
        "optimistic_rate": 3.0,
        "compounding_frequency": "ANNUALLY"
    }
    
    response = client.post("/api/v1/pension/savings", json=pension_data)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == pension_data["name"]
    assert data["pessimistic_rate"] == pension_data["pessimistic_rate"]
    assert data["realistic_rate"] == pension_data["realistic_rate"]
    assert data["optimistic_rate"] == pension_data["optimistic_rate"]

@pytest.mark.integration
def test_update_pension(client: TestClient, db_session: Session):
    """Test PUT /api/v1/pension/savings/{id} endpoint."""
    pension = create_test_pension_savings(db_session)
    update_data = {
        "name": "Updated Savings Account",
        "notes": "Updated notes",
        "pessimistic_rate": 1.5,
        "realistic_rate": 2.5,
        "optimistic_rate": 3.5
    }
    
    response = client.put(f"/api/v1/pension/savings/{pension.id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["notes"] == update_data["notes"]
    assert data["pessimistic_rate"] == update_data["pessimistic_rate"]

@pytest.mark.integration
def test_create_statement(client: TestClient, db_session: Session):
    """Test POST /api/v1/pension/savings/{id}/statements endpoint."""
    pension = create_test_pension_savings(db_session)
    statement_data = {
        "statement_date": "2023-01-01",
        "balance": 5000.00,
        "note": "First statement"
    }
    
    response = client.post(
        f"/api/v1/pension/savings/{pension.id}/statements", 
        json=statement_data
    )
    assert response.status_code == 201
    data = response.json()
    assert data["statement_date"] == statement_data["statement_date"]
    assert data["balance"] == statement_data["balance"]
    assert data["note"] == statement_data["note"]

@pytest.mark.integration
def test_get_pension_summary(client: TestClient, db_session: Session):
    """Test GET /api/v1/pension-summaries/savings endpoint."""
    pension = create_test_pension_savings(db_session)
    statement = create_test_savings_statement(db_session, pension_id=pension.id)
    
    response = client.get("/api/v1/pension-summaries/savings")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    
    # Test member_id filter
    response = client.get(f"/api/v1/pension-summaries/savings?member_id={pension.member_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == pension.id
```

### Phase 5: Projection Tests (Week 2, Days 4-5) ✅

```python
# src/backend/tests/services/test_pension_savings_projection.py
from datetime import date
from decimal import Decimal
import pytest
from app.services.pension_savings_projection import PensionSavingsProjectionService
from app.models.enums import ContributionFrequency, CompoundingFrequency
from tests.factories import (
    create_test_member,
    create_test_pension_savings,
    create_test_savings_statement,
    create_test_savings_contribution_step
)

pytestmark = pytest.mark.services

@pytest.mark.unit
def test_calculate_scenarios(db_session):
    """Test calculating projection scenarios for savings pension."""
    # Create test data
    member = create_test_member(db_session, 
                               retirement_age_planned=65,
                               retirement_date_planned=date(2040, 1, 1))
    
    pension = create_test_pension_savings(
        db_session,
        member_id=member.id,
        pessimistic_rate=Decimal("1.0"),
        realistic_rate=Decimal("2.0"),
        optimistic_rate=Decimal("3.0"),
        compounding_frequency=CompoundingFrequency.ANNUALLY
    )
    
    statement = create_test_savings_statement(
        db_session,
        pension_id=pension.id,
        balance=Decimal("5000.00")
    )
    
    contribution = create_test_savings_contribution_step(
        db_session,
        pension_savings_id=pension.id,
        amount=Decimal("100.00"),
        frequency=ContributionFrequency.MONTHLY
    )
    
    # Calculate projections
    service = PensionSavingsProjectionService()
    projections = service.calculate_scenarios(
        pension=pension,
        member=member,
        reference_date=date(2023, 1, 1)
    )
    
    # Verify the structure of projections
    assert "planned" in projections.dict()
    assert "possible" in projections.dict()
    
    planned = projections.planned
    assert "pessimistic" in planned
    assert "realistic" in planned
    assert "optimistic" in planned
    
    # Verify calculations
    assert planned["pessimistic"].balance > Decimal("5000.00")
    assert planned["realistic"].balance > planned["pessimistic"].balance
    assert planned["optimistic"].balance > planned["realistic"].balance
    
    # Test with no statements
    db_session.delete(statement)
    db_session.commit()
    
    empty_projections = service.calculate_scenarios(
        pension=pension,
        member=member,
        reference_date=date(2023, 1, 1)
    )
    
    # Should return empty dictionaries when no statements
    assert not empty_projections.planned
    assert not empty_projections.possible
```

## 3. Implementation Based on Tests

### Phase 1: Models (Week 1, Days 1-2) ✅

1. Implement pension_savings.py model with:
   - PensionSavings base model
   - PensionSavingsStatement model
   - PensionSavingsContributionPlanStep model

2. Update Enums (if needed)
   - Update PensionType enum to include SAVINGS
   - Create CompoundingFrequency enum with DAILY, MONTHLY, QUARTERLY, ANNUALLY options

### Phase 2: Schemas (Week 1, Day 3) ✅

1. Implement pension_savings.py schemas with:
   - PensionSavingsBase
   - PensionSavingsCreate
   - PensionSavingsUpdate
   - PensionSavingsResponse
   - PensionSavingsStatementBase
   - PensionSavingsStatementCreate
   - PensionSavingsStatementResponse
   - PensionSavingsListSchema

2. Implement validation logic:
   - Interest rate relationships (pessimistic ≤ realistic ≤ optimistic)
   - Range limits (0% to 20%)

### Phase 3: CRUD Operations (Week 1, Days 4-5) ✅

1. Implement pension_savings.py CRUD with:
   - Create operation
   - Read operations (get, get_multi, get_by_member)
   - Update operation
   - Delete operation
   - Statement management
   - Contribution plan management

### Phase 4: API Endpoints (Week 2, Days 1-3) ✅

1. Implement pension_savings.py router with:
   - GET /api/v1/pension/savings
   - GET /api/v1/pension/savings/{id}
   - POST /api/v1/pension/savings
   - PUT /api/v1/pension/savings/{id}
   - DELETE /api/v1/pension/savings/{id}
   - POST /api/v1/pension/savings/{id}/statements
   - GET /api/v1/pension-summaries/savings

2. Update API dependencies and routing configuration

### Phase 5: Projection Service (Week 2, Days 4-5) ✅

1. Implement pension_savings_projection.py service with: ✅
   - Calculation of compound interest with contributions
   - Support for different compounding frequencies
   - Generation of pessimistic, realistic, and optimistic scenarios
   - Support for planned and possible retirement dates

2. Implement projection API endpoint: ✅
   - GET /api/v1/pension/savings/{id}/scenarios

## 4. Integration ✅

1. Update household member model to include savings pensions relationship
2. Update the pension type enum
3. Update the frontend API paths
4. Add database migrations for the new models

## 5. Testing & Documentation ✅

1. Complete any remaining tests
2. Document the API endpoints
3. Update Swagger documentation
