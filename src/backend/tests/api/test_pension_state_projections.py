from datetime import date
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from tests.factories import create_test_pension_state, create_test_pension_statement, create_test_member

pytestmark = pytest.mark.api

@pytest.mark.integration
def test_get_scenarios(client: TestClient, db_session: Session):
    """Test GET /api/v1/pension/state/{pension_id}/scenarios endpoint."""
    # Create test data
    member = create_test_member(db_session)
    pension = create_test_pension_state(db_session, member_id=member.id)
    statement = create_test_pension_statement(
        db_session,
        pension_id=pension.id,
        current_monthly_amount=Decimal("1000.00"),
        projected_monthly_amount=Decimal("2000.00")
    )
    
    response = client.get(f"/api/v1/pension/state/{pension.id}/scenarios")
    assert response.status_code == 200
    data = response.json()
    
    # Verify scenario structure matches API
    assert "planned" in data
    assert "possible" in data
    
    # Check that each retirement type has all scenario types
    for retirement_type in ["planned", "possible"]:
        assert "pessimistic" in data[retirement_type]
        assert "realistic" in data[retirement_type]
        assert "optimistic" in data[retirement_type]
        
        # Check fields in each scenario
        for scenario_type in ["pessimistic", "realistic", "optimistic"]:
            scenario = data[retirement_type][scenario_type]
            assert "monthly_amount" in scenario
            assert "annual_amount" in scenario
            assert "retirement_age" in scenario
            assert "years_to_retirement" in scenario
            assert "growth_rate" in scenario

@pytest.mark.integration
def test_scenarios_with_different_retirement_ages(client: TestClient, db_session: Session):
    """Test scenarios with different retirement ages."""
    member = create_test_member(
        db_session,
        retirement_age_planned=67,
        retirement_age_possible=63
    )
    pension = create_test_pension_state(db_session, member_id=member.id)
    statement = create_test_pension_statement(
        db_session,
        pension_id=pension.id,
        current_monthly_amount=Decimal("1000.00"),
        projected_monthly_amount=Decimal("2000.00")
    )
    
    response = client.get(f"/api/v1/pension/state/{pension.id}/scenarios")
    assert response.status_code == 200
    data = response.json()
    
    # Verify retirement ages match member settings
    assert data["planned"]["realistic"]["retirement_age"] == 67
    assert data["possible"]["realistic"]["retirement_age"] == 63
    
    # Later retirement age should yield higher amounts
    planned_amount = Decimal(data["planned"]["realistic"]["monthly_amount"])
    possible_amount = Decimal(data["possible"]["realistic"]["monthly_amount"])
    assert planned_amount > possible_amount

@pytest.mark.integration
def test_scenarios_with_no_statements(client: TestClient, db_session: Session):
    """Test scenario calculation for pension without statements."""
    pension = create_test_pension_state(db_session)
    
    # Should return empty projection structure when no statements
    response = client.get(f"/api/v1/pension/state/{pension.id}/scenarios")
    assert response.status_code == 200
    
    data = response.json()
    # Verify empty projection structure
    assert "planned" in data
    assert "possible" in data
    assert data["planned"] == {}
    assert data["possible"] == {}

@pytest.mark.integration
def test_scenarios_with_invalid_pension(client: TestClient, db_session: Session):
    """Test scenario calculation for non-existent pension."""
    response = client.get("/api/v1/pension/state/99999/scenarios")
    assert response.status_code == 404

@pytest.mark.integration
def test_scenarios_with_multiple_statements(client: TestClient, db_session: Session):
    """Test scenarios using latest statement when multiple exist."""
    pension = create_test_pension_state(db_session)
    
    # Create older statement
    create_test_pension_statement(
        db_session,
        pension_id=pension.id,
        statement_date=date(2023, 1, 1),
        current_monthly_amount=Decimal("800.00"),
        projected_monthly_amount=Decimal("1600.00")
    )
    
    # Create newer statement
    create_test_pension_statement(
        db_session,
        pension_id=pension.id,
        statement_date=date(2024, 1, 1),
        current_monthly_amount=Decimal("1000.00"),
        projected_monthly_amount=Decimal("2000.00")
    )
    
    response = client.get(f"/api/v1/pension/state/{pension.id}/scenarios")
    assert response.status_code == 200
    data = response.json()
    
    # Verify scenarios use latest statement values (>= 2000.00 since growth rates are applied)
    for retirement_type in ["planned", "possible"]:
        for scenario_type in ["pessimistic", "realistic", "optimistic"]:
            monthly_amount = Decimal(data[retirement_type][scenario_type]["monthly_amount"])
            assert monthly_amount >= Decimal("2000.00") 