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
    assert data[0]["name"] == pension.name

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
    assert float(data["pessimistic_rate"]) == float(pension.pessimistic_rate)
    assert float(data["realistic_rate"]) == float(pension.realistic_rate)
    assert float(data["optimistic_rate"]) == float(pension.optimistic_rate)
    assert data["compounding_frequency"] == pension.compounding_frequency.value

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
        "compounding_frequency": "ANNUALLY",
        "contribution_plan_steps": [
            {
                "amount": 100.00,
                "frequency": "MONTHLY",
                "start_date": "2020-01-01"
            }
        ]
    }
    
    response = client.post("/api/v1/pension/savings", json=pension_data)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == pension_data["name"]
    assert float(data["pessimistic_rate"]) == pension_data["pessimistic_rate"]
    assert float(data["realistic_rate"]) == pension_data["realistic_rate"]
    assert float(data["optimistic_rate"]) == pension_data["optimistic_rate"]
    assert len(data["contribution_plan_steps"]) == 1
    assert float(data["contribution_plan_steps"][0]["amount"]) == 100.0
    assert data["contribution_plan_steps"][0]["frequency"] == "MONTHLY"

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
    assert float(data["pessimistic_rate"]) == update_data["pessimistic_rate"]
    assert float(data["realistic_rate"]) == update_data["realistic_rate"]
    assert float(data["optimistic_rate"]) == update_data["optimistic_rate"]

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
    assert float(data["balance"]) == statement_data["balance"]
    assert data["note"] == statement_data["note"]
    
    # Verify it's in the pension
    response = client.get(f"/api/v1/pension/savings/{pension.id}")
    assert response.status_code == 200
    pension_data = response.json()
    assert len(pension_data["statements"]) == 1

@pytest.mark.integration
def test_update_status(client: TestClient, db_session: Session):
    """Test PUT /api/v1/pension/savings/{id}/status endpoint."""
    pension = create_test_pension_savings(db_session)
    status_data = {
        "status": "PAUSED",
        "paused_at": "2023-01-01",
        "resume_at": "2024-01-01"
    }
    
    response = client.put(
        f"/api/v1/pension/savings/{pension.id}/status", 
        json=status_data
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "PAUSED"
    assert data["paused_at"] == "2023-01-01"
    assert data["resume_at"] == "2024-01-01"
    
    # Test resuming
    resume_data = {
        "status": "ACTIVE"
    }
    response = client.put(
        f"/api/v1/pension/savings/{pension.id}/status", 
        json=resume_data
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ACTIVE"
    assert data["paused_at"] is None
    assert data["resume_at"] is None

@pytest.mark.integration
def test_delete_pension(client: TestClient, db_session: Session):
    """Test DELETE /api/v1/pension/savings/{id} endpoint."""
    pension = create_test_pension_savings(db_session)
    
    response = client.delete(f"/api/v1/pension/savings/{pension.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    
    # Verify it's gone
    response = client.get(f"/api/v1/pension/savings/{pension.id}")
    assert response.status_code == 404

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
    assert data[0]["name"] == pension.name
    assert "latest_balance" in data[0]
    assert "latest_statement_date" in data[0]
    assert "current_step_amount" in data[0] 