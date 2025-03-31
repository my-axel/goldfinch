from datetime import date
from decimal import Decimal
import pytest
from sqlalchemy.orm import Session
from app.crud.pension_savings import pension_savings
from app.schemas.pension_savings import (
    PensionSavingsCreate, 
    PensionSavingsUpdate, 
    PensionSavingsStatementCreate,
    ContributionPlanStepCreate
)
from app.models.enums import PensionStatus, ContributionFrequency, CompoundingFrequency
from tests.factories import (
    create_test_member,
    create_test_pension_savings,
    create_test_savings_statement,
    create_test_savings_contribution_step
)

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
def test_get_multi(db_session: Session):
    """Test getting multiple savings pensions."""
    # Create multiple pensions
    member = create_test_member(db_session)
    pension1 = create_test_pension_savings(db_session, member_id=member.id, name="Savings 1")
    pension2 = create_test_pension_savings(db_session, member_id=member.id, name="Savings 2")
    
    # Get all pensions
    results = pension_savings.get_multi(db=db_session)
    assert len(results) >= 2
    assert any(p.id == pension1.id for p in results)
    assert any(p.id == pension2.id for p in results)
    
    # Test pagination
    limited_results = pension_savings.get_multi(db=db_session, skip=0, limit=1)
    assert len(limited_results) == 1

@pytest.mark.unit
def test_get_by_member(db_session: Session):
    """Test getting pensions by member ID."""
    member1 = create_test_member(db_session, first_name="Member1")
    member2 = create_test_member(db_session, first_name="Member2")
    
    pension1 = create_test_pension_savings(db_session, member_id=member1.id, name="Member1 Savings")
    pension2 = create_test_pension_savings(db_session, member_id=member2.id, name="Member2 Savings")
    
    # Get member1's pensions
    results = pension_savings.get_by_member(db=db_session, member_id=member1.id)
    assert len(results) == 1
    assert results[0].id == pension1.id
    assert results[0].name == "Member1 Savings"
    
    # Get member2's pensions
    results = pension_savings.get_by_member(db=db_session, member_id=member2.id)
    assert len(results) == 1
    assert results[0].id == pension2.id

@pytest.mark.unit
def test_create(db_session: Session):
    """Test creating a new savings pension."""
    member = create_test_member(db_session)
    
    contribution_steps = [
        ContributionPlanStepCreate(
            amount=Decimal("100.00"),
            frequency=ContributionFrequency.MONTHLY,
            start_date=date(2020, 1, 1)
        ),
        ContributionPlanStepCreate(
            amount=Decimal("200.00"),
            frequency=ContributionFrequency.QUARTERLY,
            start_date=date(2025, 1, 1),
            end_date=date(2030, 1, 1)
        )
    ]
    
    pension_data = PensionSavingsCreate(
        member_id=member.id,
        name="New Test Savings",
        start_date=date(2020, 1, 1),
        status=PensionStatus.ACTIVE,
        notes="Test notes",
        pessimistic_rate=Decimal("1.0"),
        realistic_rate=Decimal("2.0"),
        optimistic_rate=Decimal("3.0"),
        compounding_frequency=CompoundingFrequency.ANNUALLY,
        contribution_plan_steps=contribution_steps
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
    assert len(pension.contribution_plan_steps) == 2
    assert pension.contribution_plan_steps[0].amount == Decimal("100.00")
    assert pension.contribution_plan_steps[1].amount == Decimal("200.00")

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

@pytest.mark.unit
def test_update_with_contribution_plan_steps(db_session: Session):
    """Test updating a savings pension with new contribution steps."""
    pension = create_test_pension_savings(db_session)
    
    # Add initial contribution step
    create_test_savings_contribution_step(
        db_session, 
        pension_savings_id=pension.id, 
        amount=Decimal("100.00")
    )
    
    # Check initial state
    assert len(pension.contribution_plan_steps) == 1
    
    # Update with new contribution plan steps
    new_steps = [
        ContributionPlanStepCreate(
            amount=Decimal("200.00"),
            frequency=ContributionFrequency.MONTHLY,
            start_date=date(2023, 1, 1)
        ),
        ContributionPlanStepCreate(
            amount=Decimal("300.00"),
            frequency=ContributionFrequency.QUARTERLY,
            start_date=date(2025, 1, 1),
            end_date=date(2030, 1, 1)
        )
    ]
    
    update_data = PensionSavingsUpdate(
        name="Updated with Steps",
        contribution_plan_steps=new_steps
    )
    
    updated_pension = pension_savings.update(
        db=db_session,
        db_obj=pension,
        obj_in=update_data
    )
    
    # The old steps should be replaced by the new ones
    assert len(updated_pension.contribution_plan_steps) == 2
    amounts = [step.amount for step in updated_pension.contribution_plan_steps]
    assert Decimal("200.00") in amounts
    assert Decimal("300.00") in amounts

@pytest.mark.unit
def test_delete(db_session: Session):
    """Test deleting a savings pension."""
    pension = create_test_pension_savings(db_session)
    
    # Add statement and contribution step to test cascade deletion
    statement = create_test_savings_statement(db_session, pension_id=pension.id)
    step = create_test_savings_contribution_step(db_session, pension_savings_id=pension.id)
    
    # Delete the pension
    deleted = pension_savings.remove(db=db_session, id=pension.id)
    assert deleted.id == pension.id
    
    # Verify it's gone
    assert pension_savings.get(db=db_session, id=pension.id) is None

@pytest.mark.unit
def test_add_statement(db_session: Session):
    """Test adding a statement to a savings pension."""
    pension = create_test_pension_savings(db_session)
    
    statement_data = PensionSavingsStatementCreate(
        statement_date=date(2023, 1, 1),
        balance=Decimal("5000.00"),
        note="Test statement"
    )
    
    statement = pension_savings.add_statement(
        db=db_session, 
        pension_id=pension.id, 
        statement_in=statement_data
    )
    
    assert statement.id is not None
    assert statement.pension_id == pension.id
    assert statement.statement_date == statement_data.statement_date
    assert statement.balance == statement_data.balance
    
    # Verify it's in the pension's statements - using get method to ensure eager loading
    updated_pension = pension_savings.get(db=db_session, id=pension.id)
    assert len(updated_pension.statements) == 1
    assert updated_pension.statements[0].id == statement.id

@pytest.mark.unit
def test_get_latest_statement(db_session: Session):
    """Test getting the latest statement of a savings pension."""
    pension = create_test_pension_savings(db_session)
    
    # Add statements in non-chronological order
    statement1 = create_test_savings_statement(
        db_session, 
        pension_id=pension.id, 
        statement_date=date(2022, 1, 1),
        balance=Decimal("3000.00")
    )
    statement2 = create_test_savings_statement(
        db_session, 
        pension_id=pension.id, 
        statement_date=date(2024, 1, 1),
        balance=Decimal("5000.00")
    )
    statement3 = create_test_savings_statement(
        db_session, 
        pension_id=pension.id, 
        statement_date=date(2023, 1, 1),
        balance=Decimal("4000.00")
    )
    
    # Get latest statement
    latest = pension_savings.get_latest_statement(db=db_session, pension_id=pension.id)
    assert latest is not None
    assert latest.id == statement2.id
    assert latest.statement_date == date(2024, 1, 1)
    assert latest.balance == Decimal("5000.00")

@pytest.mark.unit
def test_get_current_contribution_step(db_session: Session):
    """Test getting the current contribution step of a savings pension."""
    pension = create_test_pension_savings(db_session)
    
    # Add contribution steps
    past_step = create_test_savings_contribution_step(
        db_session, 
        pension_savings_id=pension.id, 
        start_date=date(2020, 1, 1),
        end_date=date(2022, 12, 31),
        amount=Decimal("100.00")
    )
    
    current_step = create_test_savings_contribution_step(
        db_session, 
        pension_savings_id=pension.id, 
        start_date=date(2023, 1, 1),
        end_date=None,  # no end date means it's ongoing
        amount=Decimal("200.00")
    )
    
    future_step = create_test_savings_contribution_step(
        db_session, 
        pension_savings_id=pension.id, 
        start_date=date(2030, 1, 1),
        end_date=None,
        amount=Decimal("300.00")
    )
    
    # Get current step (assuming today is between 2023 and 2030)
    current = pension_savings.get_current_contribution_step(
        db=db_session, 
        pension_id=pension.id,
        reference_date=date(2024, 1, 1)
    )
    
    assert current is not None
    assert current.id == current_step.id
    assert current.amount == Decimal("200.00")

@pytest.mark.unit
def test_update_status(db_session: Session):
    """Test updating the status of a savings pension."""
    pension = create_test_pension_savings(db_session)
    assert pension.status == PensionStatus.ACTIVE
    
    # Pause the pension
    paused_pension = pension_savings.update_status(
        db=db_session,
        pension_id=pension.id,
        status=PensionStatus.PAUSED,
        paused_at=date(2023, 1, 1),
        resume_at=date(2024, 1, 1)
    )
    
    assert paused_pension.status == PensionStatus.PAUSED
    assert paused_pension.paused_at == date(2023, 1, 1)
    assert paused_pension.resume_at == date(2024, 1, 1)
    
    # Resume the pension
    resumed_pension = pension_savings.update_status(
        db=db_session,
        pension_id=pension.id,
        status=PensionStatus.ACTIVE
    )
    
    assert resumed_pension.status == PensionStatus.ACTIVE
    assert resumed_pension.paused_at is None
    assert resumed_pension.resume_at is None 