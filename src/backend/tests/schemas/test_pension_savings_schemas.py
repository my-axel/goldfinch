from datetime import date
from decimal import Decimal
import pytest
from pydantic import ValidationError
from app.schemas.pension_savings import (
    PensionSavingsCreate,
    PensionSavingsUpdate,
    PensionSavingsResponse,
    PensionSavingsStatementCreate,
    PensionSavingsStatementResponse,
    ContributionPlanStepCreate,
    ContributionPlanStepResponse
)
from app.models.enums import PensionStatus, ContributionFrequency, CompoundingFrequency

pytestmark = pytest.mark.schemas

@pytest.mark.unit
def test_pension_savings_create_schema():
    """Test validation for PensionSavingsCreate schema."""
    # Valid data
    data = {
        "name": "Test Savings",
        "member_id": 1,
        "start_date": date(2020, 1, 1),
        "status": PensionStatus.ACTIVE,
        "notes": "Test notes",
        "pessimistic_rate": Decimal("1.0"),
        "realistic_rate": Decimal("2.0"),
        "optimistic_rate": Decimal("3.0"),
        "compounding_frequency": CompoundingFrequency.ANNUALLY,
        "contribution_plan_steps": []
    }
    pension = PensionSavingsCreate(**data)
    assert pension.name == data["name"]
    assert pension.member_id == data["member_id"]
    assert pension.pessimistic_rate == data["pessimistic_rate"]
    assert pension.realistic_rate == data["realistic_rate"]
    assert pension.optimistic_rate == data["optimistic_rate"]
    assert pension.compounding_frequency == data["compounding_frequency"]
    
    # Test validation errors
    with pytest.raises(ValidationError):
        PensionSavingsCreate(name="", member_id=1, contribution_plan_steps=[])  # Empty name
    
    with pytest.raises(ValidationError):
        PensionSavingsCreate(name="Test", member_id=-1, contribution_plan_steps=[])  # Invalid member_id
    
    # Test interest rate validation
    with pytest.raises(ValidationError):
        PensionSavingsCreate(
            name="Test", 
            member_id=1, 
            start_date=date(2020, 1, 1),
            pessimistic_rate=Decimal("3.0"),  # higher than realistic
            realistic_rate=Decimal("2.0"),
            contribution_plan_steps=[]
        )
    
    with pytest.raises(ValidationError):
        PensionSavingsCreate(
            name="Test", 
            member_id=1, 
            start_date=date(2020, 1, 1),
            realistic_rate=Decimal("5.0"),  # higher than optimistic
            optimistic_rate=Decimal("3.0"),
            contribution_plan_steps=[]
        )
    
    # Test rate range validation
    with pytest.raises(ValidationError):
        PensionSavingsCreate(
            name="Test",
            member_id=1,
            start_date=date(2020, 1, 1),
            pessimistic_rate=Decimal("-1.0"),  # negative rate not allowed
            contribution_plan_steps=[]
        )
    
    with pytest.raises(ValidationError):
        PensionSavingsCreate(
            name="Test",
            member_id=1,
            start_date=date(2020, 1, 1),
            optimistic_rate=Decimal("21.0"),  # rate too high (over 20%)
            contribution_plan_steps=[]
        )

@pytest.mark.unit
def test_pension_savings_update_schema():
    """Test validation for PensionSavingsUpdate schema."""
    # Valid partial update
    data = {
        "name": "Updated Savings",
        "notes": "Updated notes",
        "pessimistic_rate": Decimal("1.5"),
        "realistic_rate": Decimal("2.5"),
        "optimistic_rate": Decimal("3.5"),
    }
    update = PensionSavingsUpdate(**data)
    assert update.name == data["name"]
    assert update.notes == data["notes"]
    assert update.pessimistic_rate == data["pessimistic_rate"]
    
    # Test empty update
    empty_update = PensionSavingsUpdate()
    assert empty_update.name is None
    assert empty_update.pessimistic_rate is None
    
    # Test interest rate validation
    with pytest.raises(ValidationError):
        PensionSavingsUpdate(
            pessimistic_rate=Decimal("3.0"),
            realistic_rate=Decimal("2.0")
        )
    
    with pytest.raises(ValidationError):
        PensionSavingsUpdate(
            realistic_rate=Decimal("5.0"),
            optimistic_rate=Decimal("3.0")
        )

@pytest.mark.unit
def test_contribution_plan_step_schema():
    """Test validation for ContributionPlanStep schema."""
    # Valid data
    data = {
        "amount": Decimal("100.00"),
        "frequency": ContributionFrequency.MONTHLY,
        "start_date": date(2023, 1, 1),
        "end_date": date(2025, 1, 1),
        "note": "Test note"
    }
    step = ContributionPlanStepCreate(**data)
    assert step.amount == data["amount"]
    assert step.frequency == data["frequency"]
    assert step.start_date == data["start_date"]
    assert step.end_date == data["end_date"]
    
    # Test without end_date
    no_end_data = {
        "amount": Decimal("200.00"),
        "frequency": ContributionFrequency.ANNUALLY,
        "start_date": date(2023, 1, 1)
    }
    step_no_end = ContributionPlanStepCreate(**no_end_data)
    assert step_no_end.end_date is None
    
    # Test validation errors
    with pytest.raises(ValidationError):
        ContributionPlanStepCreate(
            amount=Decimal("-100.00"),  # negative amount
            frequency=ContributionFrequency.MONTHLY,
            start_date=date(2023, 1, 1)
        )
    
    with pytest.raises(ValidationError):
        ContributionPlanStepCreate(
            amount=Decimal("100.00"),
            frequency=ContributionFrequency.MONTHLY,
            start_date=date(2025, 1, 1),
            end_date=date(2023, 1, 1)  # end_date before start_date
        )

@pytest.mark.unit
def test_pension_savings_statement_schema():
    """Test validation for PensionSavingsStatement schema."""
    # Valid data
    data = {
        "statement_date": date(2023, 1, 1),
        "balance": Decimal("5000.00"),
        "note": "Test statement"
    }
    statement = PensionSavingsStatementCreate(**data)
    assert statement.statement_date == data["statement_date"]
    assert statement.balance == data["balance"]
    assert statement.note == data["note"]
    
    # Test without note
    no_note_data = {
        "statement_date": date(2023, 1, 1),
        "balance": Decimal("5000.00")
    }
    statement_no_note = PensionSavingsStatementCreate(**no_note_data)
    assert statement_no_note.note is None
    
    # Test validation errors
    with pytest.raises(ValidationError):
        PensionSavingsStatementCreate(
            statement_date=date(2023, 1, 1),
            balance=Decimal("-100.00")  # negative balance
        )

@pytest.mark.unit
def test_pension_savings_with_contribution_steps():
    """Test PensionSavingsCreate with contribution plan steps."""
    data = {
        "name": "Test Savings",
        "member_id": 1,
        "start_date": date(2020, 1, 1),
        "pessimistic_rate": Decimal("1.0"),
        "realistic_rate": Decimal("2.0"),
        "optimistic_rate": Decimal("3.0"),
        "contribution_plan_steps": [
            {
                "amount": Decimal("100.00"),
                "frequency": ContributionFrequency.MONTHLY,
                "start_date": date(2020, 1, 1)
            },
            {
                "amount": Decimal("200.00"),
                "frequency": ContributionFrequency.QUARTERLY,
                "start_date": date(2025, 1, 1),
                "end_date": date(2030, 1, 1)
            }
        ]
    }
    
    pension = PensionSavingsCreate(**data)
    assert len(pension.contribution_plan_steps) == 2
    assert pension.contribution_plan_steps[0].amount == Decimal("100.00")
    assert pension.contribution_plan_steps[1].frequency == ContributionFrequency.QUARTERLY 