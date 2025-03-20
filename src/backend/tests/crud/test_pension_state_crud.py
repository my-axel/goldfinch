from datetime import date
from decimal import Decimal
import pytest
from sqlalchemy.orm import Session
from app.crud.pension_state import pension_state
from app.models.enums import PensionStatus
from tests.factories import create_test_pension_state, create_test_pension_statement, create_test_member
from app.schemas.pension_state import PensionStateCreate
from app.models.pension_state import PensionStateStatement

pytestmark = pytest.mark.crud

@pytest.mark.unit
def test_get_list(db_session: Session):
    """Test getting list of state pensions with filtering."""
    # Create test data
    pension1 = create_test_pension_state(db_session, name="Test Pension 1")
    pension2 = create_test_pension_state(db_session, name="Test Pension 2")
    
    # Test basic list
    results = pension_state.get_list(db=db_session)
    assert len(results) == 2
    
    # Test pagination
    results = pension_state.get_list(db=db_session, skip=0, limit=1)
    assert len(results) == 1
    
    # Test member_id filter
    results = pension_state.get_list(db=db_session, member_id=pension1.member_id)
    assert len(results) == 1
    assert results[0]["id"] == pension1.id

@pytest.mark.unit
def test_get_by_id(db_session: Session):
    """Test getting a specific state pension by ID."""
    pension = create_test_pension_state(db_session)
    result = pension_state.get(db=db_session, id=pension.id)
    assert result is not None
    assert result.id == pension.id
    assert result.name == pension.name

@pytest.mark.unit
def test_create(db_session: Session):
    """Test creating a new state pension."""
    member = create_test_member(db_session)
    pension_data = PensionStateCreate(
        member_id=member.id,
        name="New Test Pension",
        start_date=date(2020, 1, 1),
        status=PensionStatus.ACTIVE,
        notes="Test notes"
    )
    
    pension = pension_state.create(db=db_session, obj_in=pension_data)
    assert pension.id is not None
    assert pension.name == pension_data.name
    assert pension.member_id == pension_data.member_id
    assert pension.start_date == pension_data.start_date

@pytest.mark.unit
def test_update(db_session: Session):
    """Test updating a state pension."""
    pension = create_test_pension_state(db_session)
    update_data = {
        "name": "Updated Pension Name",
        "notes": "Updated notes"
    }
    
    updated_pension = pension_state.update(
        db=db_session,
        db_obj=pension,
        obj_in=update_data
    )
    assert updated_pension.name == update_data["name"]
    assert updated_pension.notes == update_data["notes"]

@pytest.mark.unit
def test_delete(db_session: Session):
    """Test deleting a state pension."""
    pension = create_test_pension_state(db_session)
    statement = create_test_pension_statement(db_session, pension_id=pension.id)
    
    pension_state.remove(db=db_session, id=pension.id)
    
    # Verify pension is deleted
    result = pension_state.get(db=db_session, id=pension.id)
    assert result is None
    
    # Verify statements are cascade deleted
    stmt_result = db_session.query(PensionStateStatement).filter_by(id=statement.id).first()
    assert stmt_result is None

@pytest.mark.unit
def test_get_latest_statement(db_session: Session):
    """Test getting the latest statement for a pension."""
    pension = create_test_pension_state(db_session)
    
    # Create statements with different dates
    statement1 = create_test_pension_statement(
        db_session,
        pension_id=pension.id,
        statement_date=date(2023, 1, 1),
        current_monthly_amount=Decimal("400.00")
    )
    statement2 = create_test_pension_statement(
        db_session,
        pension_id=pension.id,
        statement_date=date(2024, 1, 1),
        current_monthly_amount=Decimal("500.00")
    )
    
    latest = pension_state.get_latest_statement(db=db_session, pension_id=pension.id)
    assert latest is not None
    assert latest.id == statement2.id
    assert latest.statement_date == date(2024, 1, 1)
    assert latest.current_monthly_amount == Decimal("500.00") 