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
    
    # Add statements to first pension
    statement1 = create_test_pension_statement(db_session, pension_id=pension1.id)
    statement2 = create_test_pension_statement(db_session, pension_id=pension1.id)
    
    # Test basic list
    results = pension_state.get_list(db=db_session)
    assert len(results) == 2
    
    # Verify statements count
    pension1_result = next(r for r in results if r["id"] == pension1.id)
    pension2_result = next(r for r in results if r["id"] == pension2.id)
    assert pension1_result["statements_count"] == 2
    assert pension2_result["statements_count"] == 0
    
    # Test pagination
    results = pension_state.get_list(db=db_session, skip=0, limit=1)
    assert len(results) == 1
    
    # Test member_id filter
    results = pension_state.get_list(db=db_session, member_id=pension1.member_id)
    assert len(results) == 1
    assert results[0]["id"] == pension1.id
    assert results[0]["statements_count"] == 2

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
def test_update_with_statements(db_session: Session):
    """Test updating a state pension with statements."""
    # Create a pension with an existing statement
    pension = create_test_pension_state(db_session)
    existing_statement = create_test_pension_statement(
        db_session, 
        pension_id=pension.id,
        statement_date=date(2023, 1, 1),
        current_monthly_amount=Decimal("400.00")
    )
    
    # Prepare update data with:
    # 1. Update to existing statement
    # 2. New statement to be created
    update_data = {
        "name": "Updated With Statements",
        "notes": "Updated with statements test",
        "statements": [
            # Update existing statement
            {
                "id": existing_statement.id,
                "pension_id": pension.id,
                "statement_date": date(2023, 1, 1),
                "current_monthly_amount": Decimal("450.00"),  # Changed amount
                "note": "Updated statement"
            },
            # New statement to be created
            {
                "statement_date": date(2024, 1, 1),
                "current_monthly_amount": Decimal("500.00"),
                "projected_monthly_amount": Decimal("600.00"),
                "note": "New statement"
            }
        ]
    }
    
    # Update the pension with statements
    updated_pension = pension_state.update(
        db=db_session,
        db_obj=pension,
        obj_in=update_data
    )
    
    # Verify basic pension data is updated
    assert updated_pension.name == update_data["name"]
    assert updated_pension.notes == update_data["notes"]
    
    # Verify statements are updated properly
    assert len(updated_pension.statements) == 2
    
    # Check existing statement was updated
    updated_statement = next((s for s in updated_pension.statements if s.id == existing_statement.id), None)
    assert updated_statement is not None
    assert updated_statement.current_monthly_amount == Decimal("450.00")
    assert updated_statement.note == "Updated statement"
    
    # Check new statement was created
    new_statement = next((s for s in updated_pension.statements if s.id != existing_statement.id), None)
    assert new_statement is not None
    assert new_statement.statement_date == date(2024, 1, 1)
    assert new_statement.current_monthly_amount == Decimal("500.00")
    assert new_statement.projected_monthly_amount == Decimal("600.00")
    assert new_statement.note == "New statement"

@pytest.mark.unit
def test_update_preserves_unmentioned_statements(db_session: Session):
    """Test that statements not included in the update data are preserved."""
    # Create a pension with multiple statements
    pension = create_test_pension_state(db_session)
    statement1 = create_test_pension_statement(
        db_session, 
        pension_id=pension.id,
        statement_date=date(2023, 1, 1),
        current_monthly_amount=Decimal("400.00"),
        note="Statement 1"
    )
    statement2 = create_test_pension_statement(
        db_session, 
        pension_id=pension.id,
        statement_date=date(2023, 6, 1),
        current_monthly_amount=Decimal("450.00"),
        note="Statement 2"
    )
    
    # Update data only mentions one of the existing statements
    update_data = {
        "name": "Updated With Partial Statements",
        "statements": [
            # Update only the first statement
            {
                "id": statement1.id,
                "pension_id": pension.id,
                "statement_date": date(2023, 1, 1),
                "current_monthly_amount": Decimal("420.00"),
                "note": "Updated statement 1"
            }
        ]
    }
    
    # Update the pension
    updated_pension = pension_state.update(
        db=db_session,
        db_obj=pension,
        obj_in=update_data
    )
    
    # Verify basic pension data is updated
    assert updated_pension.name == update_data["name"]
    
    # Verify both statements still exist
    assert len(updated_pension.statements) == 2
    
    # Verify first statement was updated
    updated_statement = next((s for s in updated_pension.statements if s.id == statement1.id), None)
    assert updated_statement is not None
    assert updated_statement.current_monthly_amount == Decimal("420.00")
    assert updated_statement.note == "Updated statement 1"
    
    # Verify second statement was preserved unchanged
    preserved_statement = next((s for s in updated_pension.statements if s.id == statement2.id), None)
    assert preserved_statement is not None
    assert preserved_statement.current_monthly_amount == Decimal("450.00")
    assert preserved_statement.note == "Statement 2"

@pytest.mark.unit
def test_update_with_invalid_statements(db_session: Session):
    """Test error handling when updating with invalid statements."""
    # Create a pension
    pension = create_test_pension_state(db_session)
    
    # Create initial statement to check for rollback
    initial_statement = create_test_pension_statement(
        db_session, 
        pension_id=pension.id,
        statement_date=date(2023, 1, 1),
        current_monthly_amount=Decimal("400.00")
    )
    
    # Get original name for verification later
    original_name = pension.name
    
    # Create update data with a valid statement and an invalid one (missing required field)
    update_data = {
        "name": "Should Not Update",
        "statements": [
            # Valid statement update
            {
                "id": initial_statement.id,
                "pension_id": pension.id,
                "statement_date": date(2023, 1, 1),
                "current_monthly_amount": Decimal("450.00")
            },
            # Invalid statement (missing required statement_date)
            {
                "current_monthly_amount": Decimal("500.00"),
                "note": "Invalid statement"
            }
        ]
    }
    
    # Try to update and expect an exception
    with pytest.raises(Exception):
        updated_pension = pension_state.update(
            db=db_session,
            db_obj=pension,
            obj_in=update_data
        )
    
    # Reload pension from DB and verify it wasn't changed (transaction rolled back)
    db_session.refresh(pension)
    assert pension.name == original_name
    
    # Verify statement wasn't updated
    db_session.refresh(initial_statement)
    assert initial_statement.current_monthly_amount == Decimal("400.00")

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