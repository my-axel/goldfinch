from datetime import date, datetime, timezone
from decimal import Decimal
import pytest
from sqlalchemy.exc import IntegrityError
from app.models.pension_state import PensionState, PensionStateStatement
from app.models.enums import PensionStatus

pytestmark = pytest.mark.models  # Mark all tests in this file as model tests

@pytest.mark.unit
def test_pension_state_create(db_session, test_member):
    """Test creating a basic state pension."""
    pension = PensionState(
        member_id=test_member.id,
        name="Test State Pension",
        start_date=date(2020, 1, 1),
        status=PensionStatus.ACTIVE
    )
    db_session.add(pension)
    db_session.commit()
    
    assert pension.id is not None
    assert pension.name == "Test State Pension"
    assert pension.start_date == date(2020, 1, 1)
    assert pension.status == PensionStatus.ACTIVE
    assert pension.notes is None

@pytest.mark.unit
def test_pension_state_cascade_delete(db_session, test_member):
    """Test that deleting a pension cascades to its statements."""
    pension = PensionState(
        member_id=test_member.id,
        name="Test State Pension",
        start_date=date(2020, 1, 1)
    )
    db_session.add(pension)
    db_session.commit()  # Commit to get pension.id
    
    statement = PensionStateStatement(
        pension_id=pension.id,
        statement_date=date(2024, 1, 1),
        current_monthly_amount=Decimal("500.00"),
        projected_monthly_amount=Decimal("2000.00")
    )
    db_session.add(statement)
    db_session.commit()
    
    # Delete pension and verify statement is also deleted
    db_session.delete(pension)
    db_session.commit()
    
    # Verify statement is deleted
    assert db_session.query(PensionStateStatement).filter_by(id=statement.id).first() is None

@pytest.mark.unit
def test_pension_state_unique_member_name(db_session, test_member):
    """Test that member_id and name combination must be unique."""
    pension1 = PensionState(
        member_id=test_member.id,
        name="Test State Pension",
        start_date=date(2020, 1, 1)
    )
    db_session.add(pension1)
    db_session.commit()
    
    # Try to create another pension with same member_id and name
    pension2 = PensionState(
        member_id=test_member.id,
        name="Test State Pension",
        start_date=date(2020, 1, 1)
    )
    db_session.add(pension2)
    
    with pytest.raises(IntegrityError):
        db_session.commit()

@pytest.mark.unit
def test_statement_create(db_session, test_member):
    """Test creating a pension statement."""
    pension = PensionState(
        member_id=test_member.id,
        name="Test State Pension",
        start_date=date(2020, 1, 1)
    )
    db_session.add(pension)
    db_session.commit()  # Commit to get pension.id
    
    statement = PensionStateStatement(
        pension_id=pension.id,
        statement_date=date(2024, 1, 1),
        current_monthly_amount=Decimal("500.00"),
        projected_monthly_amount=Decimal("2000.00"),
        note="Test statement"
    )
    db_session.add(statement)
    db_session.commit()
    
    assert statement.id is not None
    assert statement.statement_date == date(2024, 1, 1)
    assert statement.current_monthly_amount == Decimal("500.00")
    assert statement.projected_monthly_amount == Decimal("2000.00")
    assert statement.note == "Test statement"

@pytest.mark.unit
def test_statement_ordering(db_session, test_member):
    """Test that statements are ordered by date descending."""
    pension = PensionState(
        member_id=test_member.id,
        name="Test State Pension",
        start_date=date(2020, 1, 1)
    )
    db_session.add(pension)
    db_session.commit()  # Commit to get pension.id
    
    # Add statements in random order
    dates = [date(2024, 1, 1), date(2023, 1, 1), date(2025, 1, 1)]
    for stmt_date in dates:
        statement = PensionStateStatement(
            pension_id=pension.id,
            statement_date=stmt_date,
            current_monthly_amount=Decimal("500.00"),
            projected_monthly_amount=Decimal("2000.00")
        )
        db_session.add(statement)
    
    db_session.commit()
    
    # Verify ordering
    statements = pension.statements
    assert len(statements) == 3
    assert statements[0].statement_date == date(2025, 1, 1)
    assert statements[1].statement_date == date(2024, 1, 1)
    assert statements[2].statement_date == date(2023, 1, 1)

@pytest.mark.unit
def test_statement_nullable_fields(db_session, test_member):
    """Test that certain statement fields can be null."""
    pension = PensionState(
        member_id=test_member.id,
        name="Test State Pension",
        start_date=date(2020, 1, 1)
    )
    db_session.add(pension)
    db_session.commit()  # Commit to get pension.id
    
    statement = PensionStateStatement(
        pension_id=pension.id,
        statement_date=date(2024, 1, 1),
        current_monthly_amount=None,  # Nullable in updated schema
        projected_monthly_amount=None,  # Nullable in updated schema
        note=None
    )
    db_session.add(statement)
    db_session.commit()
    
    assert statement.id is not None
    assert statement.current_monthly_amount is None
    assert statement.projected_monthly_amount is None
    assert statement.note is None

@pytest.mark.unit
def test_pension_state_relationships(db_session, test_member):
    """Test relationships between PensionState and related models."""
    pension = PensionState(
        member_id=test_member.id,
        name="Test State Pension",
        start_date=date(2020, 1, 1)
    )
    db_session.add(pension)
    db_session.commit()
    
    # Test member relationship (requires member fixture)
    assert pension.member_id == test_member.id
    
    # Test statements relationship
    statement1 = PensionStateStatement(
        pension_id=pension.id,
        statement_date=date(2024, 1, 1),
        current_monthly_amount=Decimal("500.00"),
        projected_monthly_amount=Decimal("2000.00")
    )
    statement2 = PensionStateStatement(
        pension_id=pension.id,
        statement_date=date(2023, 1, 1),
        current_monthly_amount=Decimal("400.00"),
        projected_monthly_amount=Decimal("1800.00")
    )
    db_session.add_all([statement1, statement2])
    db_session.commit()
    
    assert len(pension.statements) == 2
    assert pension.statements[0].statement_date > pension.statements[1].statement_date  # Check ordering 