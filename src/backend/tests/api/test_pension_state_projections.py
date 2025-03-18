from datetime import date
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from tests.factories import create_test_pension_state, create_test_pension_statement, create_test_member

pytestmark = pytest.mark.api

@pytest.mark.integration
def test_get_scenarios(client: TestClient, db_session: Session):
    """Test GET /api/v1/pensions/state/{pension_id}/scenarios endpoint."""
    # Create test data
    member = create_test_member(db_session)
    pension = create_test_pension_state(db_session, member_id=member.id)
    statement = create_test_pension_statement(
        db_session,
        pension_id=pension.id,
        current_monthly_amount=Decimal("1000.00"),
        projected_monthly_amount=Decimal("2000.00")
    )
    
    response = client.get(f"/api/v1/pensions/state/{pension.id}/scenarios")
    assert response.status_code == 200
    data = response.json()
    
    # Verify scenario structure
    assert "scenarios" in data
    assert len(data["scenarios"]) > 0
    
    # Verify each scenario has required fields
    scenario = data["scenarios"][0]
    assert "name" in scenario
    assert "monthly_amount" in scenario
    assert "annual_amount" in scenario
    assert "retirement_age" in scenario
    assert "retirement_date" in scenario

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
    
    response = client.get(f"/api/v1/pensions/state/{pension.id}/scenarios")
    assert response.status_code == 200
    data = response.json()
    
    # Find scenarios for different retirement ages
    planned_scenario = next(
        (s for s in data["scenarios"] if s["retirement_age"] == 67),
        None
    )
    possible_scenario = next(
        (s for s in data["scenarios"] if s["retirement_age"] == 63),
        None
    )
    
    assert planned_scenario is not None
    assert possible_scenario is not None
    assert planned_scenario["monthly_amount"] > possible_scenario["monthly_amount"]

@pytest.mark.integration
def test_scenarios_with_no_statements(client: TestClient, db_session: Session):
    """Test scenario calculation for pension without statements."""
    pension = create_test_pension_state(db_session)
    
    response = client.get(f"/api/v1/pensions/state/{pension.id}/scenarios")
    assert response.status_code == 200
    data = response.json()
    
    # Should return empty or default scenarios
    assert "scenarios" in data
    assert len(data["scenarios"]) == 0

@pytest.mark.integration
def test_scenarios_with_invalid_pension(client: TestClient, db_session: Session):
    """Test scenario calculation for non-existent pension."""
    response = client.get("/api/v1/pensions/state/99999/scenarios")
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
    
    response = client.get(f"/api/v1/pensions/state/{pension.id}/scenarios")
    assert response.status_code == 200
    data = response.json()
    
    # Verify scenarios use latest statement values
    for scenario in data["scenarios"]:
        assert scenario["monthly_amount"] >= Decimal("1000.00")  # Should use latest values 