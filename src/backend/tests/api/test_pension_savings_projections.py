from datetime import date
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.enums import ContributionFrequency, CompoundingFrequency
from tests.factories import (
    create_test_member,
    create_test_pension_savings,
    create_test_savings_statement,
    create_test_savings_contribution_step
)

pytestmark = pytest.mark.api

@pytest.mark.integration
def test_calculate_scenarios_success(client: TestClient, db_session: Session):
    """Test successful calculation of projection scenarios."""
    # Create test data
    member = create_test_member(
        db_session, 
        retirement_age_planned=67,
        retirement_date_planned=date(2040, 1, 1),
        retirement_age_possible=63,
        retirement_date_possible=date(2036, 1, 1)
    )
    
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
    
    # Call the scenarios endpoint
    response = client.get(f"/api/v1/pension/savings/{pension.id}/scenarios")
    assert response.status_code == 200
    data = response.json()
    
    # Verify structure
    assert "planned" in data
    assert "possible" in data
    
    # Verify planned scenarios
    planned = data["planned"]
    assert "pessimistic" in planned
    assert "realistic" in planned
    assert "optimistic" in planned
    
    # Verify possible scenarios
    possible = data["possible"]
    assert "pessimistic" in possible
    assert "realistic" in possible
    assert "optimistic" in possible
    
    # Verify retirement ages
    assert planned["realistic"]["retirement_age"] == 67
    assert possible["realistic"]["retirement_age"] == 63
    
    # Verify amounts and rates
    assert float(planned["pessimistic"]["balance"]) > 5000.0
    assert float(planned["realistic"]["balance"]) > float(planned["pessimistic"]["balance"])
    assert float(planned["optimistic"]["balance"]) > float(planned["realistic"]["balance"])
    
    # Verify growth rates
    assert float(planned["pessimistic"]["growth_rate"]) == 1.0
    assert float(planned["realistic"]["growth_rate"]) == 2.0
    assert float(planned["optimistic"]["growth_rate"]) == 3.0
    
    # Verify total contributions and balance without contributions
    assert "total_contributions" in planned["realistic"]
    assert "balance_without_contributions" in planned["realistic"]
    assert float(planned["realistic"]["total_contributions"]) > 0
    assert float(planned["realistic"]["balance"]) > float(planned["realistic"]["balance_without_contributions"])

@pytest.mark.integration
def test_calculate_scenarios_no_statements(client: TestClient, db_session: Session):
    """Test scenarios endpoint with no statements."""
    # Create test data without statements
    member = create_test_member(db_session)
    pension = create_test_pension_savings(db_session, member_id=member.id)
    
    # Call the scenarios endpoint
    response = client.get(f"/api/v1/pension/savings/{pension.id}/scenarios")
    assert response.status_code == 200
    data = response.json()
    
    # Verify empty projection structure
    assert data["planned"] == {}
    assert data["possible"] == {}

@pytest.mark.integration
def test_calculate_scenarios_pension_not_found(client: TestClient, db_session: Session):
    """Test scenarios endpoint with non-existent pension ID."""
    response = client.get("/api/v1/pension/savings/9999/scenarios")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data

@pytest.mark.integration
def test_calculate_scenarios_with_reference_date(client: TestClient, db_session: Session):
    """Test scenarios endpoint with a specific reference date."""
    # Create test data
    member = create_test_member(db_session)
    pension = create_test_pension_savings(db_session, member_id=member.id)
    statement = create_test_savings_statement(db_session, pension_id=pension.id)
    
    # Call the scenarios endpoint with reference date
    response = client.get(
        f"/api/v1/pension/savings/{pension.id}/scenarios?reference_date=2023-01-01"
    )
    assert response.status_code == 200
    
    # Call the scenarios endpoint without reference date (uses today)
    response_default = client.get(f"/api/v1/pension/savings/{pension.id}/scenarios")
    assert response_default.status_code == 200 