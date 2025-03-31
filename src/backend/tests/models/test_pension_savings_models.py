from datetime import date
from decimal import Decimal
import pytest
from sqlalchemy.exc import IntegrityError
from app.models.pension_savings import PensionSavings, PensionSavingsStatement, PensionSavingsContributionPlanStep
from app.models.enums import PensionStatus, ContributionFrequency, CompoundingFrequency, PensionType

pytestmark = pytest.mark.models

@pytest.mark.unit
def test_compounding_frequency_enum():
    """Test CompoundingFrequency enum values."""
    assert CompoundingFrequency.DAILY.value == "DAILY"
    assert CompoundingFrequency.MONTHLY.value == "MONTHLY"
    assert CompoundingFrequency.QUARTERLY.value == "QUARTERLY"
    assert CompoundingFrequency.ANNUALLY.value == "ANNUALLY"

@pytest.mark.unit
def test_pension_type_enum():
    """Test PensionType enum has SAVINGS value."""
    assert PensionType.SAVINGS.value == "SAVINGS"

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

@pytest.mark.unit
def test_pension_savings_statement_create(db_session, test_member):
    """Test creating a savings statement."""
    pension = PensionSavings(
        member_id=test_member.id,
        name="Test Savings Account",
        start_date=date(2020, 1, 1)
    )
    db_session.add(pension)
    db_session.commit()
    
    statement = PensionSavingsStatement(
        pension_id=pension.id,
        statement_date=date(2023, 1, 1),
        balance=Decimal("5000.00"),
        note="Test statement"
    )
    db_session.add(statement)
    db_session.commit()
    
    assert statement.id is not None
    assert statement.pension_id == pension.id
    assert statement.statement_date == date(2023, 1, 1)
    assert statement.balance == Decimal("5000.00")
    assert statement.note == "Test statement"
    
    # Test relationship back to pension
    assert statement.pension.id == pension.id

@pytest.mark.unit
def test_pension_savings_contribution_plan_step_create(db_session, test_member):
    """Test creating a savings contribution plan step."""
    pension = PensionSavings(
        member_id=test_member.id,
        name="Test Savings Account",
        start_date=date(2020, 1, 1)
    )
    db_session.add(pension)
    db_session.commit()
    
    contribution = PensionSavingsContributionPlanStep(
        pension_savings_id=pension.id,
        amount=Decimal("100.00"),
        frequency=ContributionFrequency.MONTHLY,
        start_date=date(2023, 1, 1),
        end_date=date(2025, 1, 1),
        note="Test contribution plan"
    )
    db_session.add(contribution)
    db_session.commit()
    
    assert contribution.id is not None
    assert contribution.pension_savings_id == pension.id
    assert contribution.amount == Decimal("100.00")
    assert contribution.frequency == ContributionFrequency.MONTHLY
    assert contribution.start_date == date(2023, 1, 1)
    assert contribution.end_date == date(2025, 1, 1)
    assert contribution.note == "Test contribution plan"
    
    # Test relationship back to pension
    assert contribution.pension.id == pension.id

@pytest.mark.unit
def test_pension_savings_statement_ordering(db_session, test_member):
    """Test that statements are ordered by date descending."""
    pension = PensionSavings(
        member_id=test_member.id,
        name="Test Savings Account",
        start_date=date(2020, 1, 1)
    )
    db_session.add(pension)
    db_session.commit()
    
    # Add statements in a non-chronological order
    statement1 = PensionSavingsStatement(
        pension_id=pension.id,
        statement_date=date(2022, 1, 1),
        balance=Decimal("3000.00")
    )
    statement2 = PensionSavingsStatement(
        pension_id=pension.id,
        statement_date=date(2024, 1, 1),
        balance=Decimal("5000.00")
    )
    statement3 = PensionSavingsStatement(
        pension_id=pension.id,
        statement_date=date(2023, 1, 1),
        balance=Decimal("4000.00")
    )
    db_session.add_all([statement1, statement2, statement3])
    db_session.commit()
    
    # Verify ordering by date descending
    assert pension.statements[0].statement_date == date(2024, 1, 1)
    assert pension.statements[1].statement_date == date(2023, 1, 1)
    assert pension.statements[2].statement_date == date(2022, 1, 1) 