from datetime import date
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from tests.factories import create_test_pension_state, create_test_pension_statement, create_test_member

pytestmark = pytest.mark.api

@pytest.mark.integration
def test_get_pensions_list(client: TestClient, db_session: Session):
    """Test GET /api/v1/pensions/state endpoint."""
    # Create test data
    pension1 = create_test_pension_state(db_session, name="Test Pension 1")
    pension2 = create_test_pension_state(db_session, name="Test Pension 2")
    
    # Test basic list
    response = client.get("/api/v1/pensions/state")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    
    # Test pagination
    response = client.get("/api/v1/pensions/state?skip=0&limit=1")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    
    # Test member_id filter
    response = client.get(f"/api/v1/pensions/state?member_id={pension1.member_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == pension1.id

@pytest.mark.integration
def test_get_pension_detail(client: TestClient, db_session: Session):
    """Test GET /api/v1/pensions/state/{id} endpoint."""
    pension = create_test_pension_state(db_session)
    
    response = client.get(f"/api/v1/pensions/state/{pension.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == pension.id
    assert data["name"] == pension.name
    
    # Test non-existent pension
    response = client.get("/api/v1/pensions/state/99999")
    assert response.status_code == 404

@pytest.mark.integration
def test_create_pension(client: TestClient, db_session: Session):
    """Test POST /api/v1/pensions/state endpoint."""
    member = create_test_member(db_session)
    pension_data = {
        "member_id": member.id,
        "name": "New Test Pension",
        "start_date": "2020-01-01",
        "status": "ACTIVE",
        "notes": "Test notes"
    }
    
    response = client.post("/api/v1/pensions/state", json=pension_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == pension_data["name"]
    assert data["member_id"] == pension_data["member_id"]
    
    # Test validation error
    invalid_data = {
        "name": "Invalid Pension",  # Missing required member_id
        "start_date": "2020-01-01"
    }
    response = client.post("/api/v1/pensions/state", json=invalid_data)
    assert response.status_code == 422

@pytest.mark.integration
def test_update_pension(client: TestClient, db_session: Session):
    """Test PUT /api/v1/pensions/state/{id} endpoint."""
    pension = create_test_pension_state(db_session)
    update_data = {
        "name": "Updated Pension Name",
        "notes": "Updated notes"
    }
    
    response = client.put(f"/api/v1/pensions/state/{pension.id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["notes"] == update_data["notes"]
    
    # Test non-existent pension
    response = client.put("/api/v1/pensions/state/99999", json=update_data)
    assert response.status_code == 404

@pytest.mark.integration
def test_delete_pension(client: TestClient, db_session: Session):
    """Test DELETE /api/v1/pensions/state/{id} endpoint."""
    pension = create_test_pension_state(db_session)
    statement = create_test_pension_statement(db_session, pension_id=pension.id)
    
    response = client.delete(f"/api/v1/pensions/state/{pension.id}")
    assert response.status_code == 200
    
    # Verify pension is deleted
    response = client.get(f"/api/v1/pensions/state/{pension.id}")
    assert response.status_code == 404
    
    # Test non-existent pension
    response = client.delete("/api/v1/pensions/state/99999")
    assert response.status_code == 404

@pytest.mark.integration
def test_get_pension_statements(client: TestClient, db_session: Session):
    """Test GET /api/v1/pensions/state/{pension_id}/statements endpoint."""
    pension = create_test_pension_state(db_session)
    statement1 = create_test_pension_statement(
        db_session,
        pension_id=pension.id,
        statement_date=date(2023, 1, 1)
    )
    statement2 = create_test_pension_statement(
        db_session,
        pension_id=pension.id,
        statement_date=date(2024, 1, 1)
    )
    
    response = client.get(f"/api/v1/pensions/state/{pension.id}/statements")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["statement_date"] > data[1]["statement_date"]  # Check ordering

@pytest.mark.integration
def test_create_pension_statement(client: TestClient, db_session: Session):
    """Test POST /api/v1/pensions/state/{pension_id}/statements endpoint."""
    pension = create_test_pension_state(db_session)
    statement_data = {
        "statement_date": "2024-01-01",
        "current_monthly_amount": "500.00",
        "projected_monthly_amount": "2000.00",
        "note": "Test statement"
    }
    
    response = client.post(
        f"/api/v1/pensions/state/{pension.id}/statements",
        json=statement_data
    )
    assert response.status_code == 200
    data = response.json()
    assert data["statement_date"] == statement_data["statement_date"]
    assert data["current_monthly_amount"] == statement_data["current_monthly_amount"]
    
    # Test validation error
    invalid_data = {
        "statement_date": "invalid-date"  # Invalid date format
    }
    response = client.post(
        f"/api/v1/pensions/state/{pension.id}/statements",
        json=invalid_data
    )
    assert response.status_code == 422

@pytest.mark.integration
def test_get_pension_summary(client: TestClient, db_session: Session):
    """Test GET /api/v1/pension-summaries/state endpoint."""
    pension = create_test_pension_state(db_session)
    statement = create_test_pension_statement(db_session, pension_id=pension.id)
    
    response = client.get("/api/v1/pension-summaries/state")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    
    # Test member_id filter
    response = client.get(f"/api/v1/pension-summaries/state?member_id={pension.member_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == pension.id 