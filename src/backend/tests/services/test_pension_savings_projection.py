from datetime import date
from decimal import Decimal
import pytest
from app.services.pension_savings_projection import PensionSavingsProjectionService
from app.models.enums import ContributionFrequency, CompoundingFrequency
from tests.factories import (
    create_test_member,
    create_test_pension_savings,
    create_test_savings_statement,
    create_test_savings_contribution_step
)

pytestmark = pytest.mark.services

@pytest.mark.unit
def test_calculate_scenarios(db_session):
    """Test calculating projection scenarios for savings pension."""
    # Create test data
    member = create_test_member(
        db_session, 
        retirement_age_planned=65,
        retirement_date_planned=date(2040, 1, 1)
    )
    
    pension = create_test_pension_savings(
        db_session,
        member_id=member.id,
        pessimistic_rate=Decimal("1.0"),
        realistic_rate=Decimal("2.0"),
        optimistic_rate=Decimal("3.0"),
        compounding_frequency=CompoundingFrequency.ANNUALLY
    )
    
    statement = create_test_savings_statement(
        db_session,
        pension_id=pension.id,
        balance=Decimal("5000.00")
    )
    
    contribution = create_test_savings_contribution_step(
        db_session,
        pension_savings_id=pension.id,
        amount=Decimal("100.00"),
        frequency=ContributionFrequency.MONTHLY
    )
    
    # Calculate projections
    service = PensionSavingsProjectionService()
    projections = service.calculate_scenarios(
        pension=pension,
        member=member,
        reference_date=date(2023, 1, 1)
    )
    
    # Verify the structure of projections
    assert "planned" in projections.dict()
    assert "possible" in projections.dict()
    
    planned = projections.planned
    assert "pessimistic" in planned
    assert "realistic" in planned
    assert "optimistic" in planned
    
    # Verify calculations
    assert planned["pessimistic"].balance > Decimal("5000.00")
    assert planned["realistic"].balance > planned["pessimistic"].balance
    assert planned["optimistic"].balance > planned["realistic"].balance
    
    # Test with no statements
    db_session.delete(statement)
    db_session.commit()
    
    empty_projections = service.calculate_scenarios(
        pension=pension,
        member=member,
        reference_date=date(2023, 1, 1)
    )
    
    # Should return empty dictionaries when no statements
    assert not empty_projections.planned
    assert not empty_projections.possible

@pytest.mark.unit
def test_compounding_frequencies(db_session):
    """Test compound interest calculations with different frequencies."""
    member = create_test_member(
        db_session, 
        retirement_age_planned=65,
        retirement_date_planned=date(2040, 1, 1)
    )
    
    # Create 4 pensions with different compounding frequencies
    pension_daily = create_test_pension_savings(
        db_session,
        member_id=member.id,
        pessimistic_rate=Decimal("2.0"),
        realistic_rate=Decimal("2.0"),
        optimistic_rate=Decimal("2.0"),
        compounding_frequency=CompoundingFrequency.DAILY
    )
    
    pension_monthly = create_test_pension_savings(
        db_session,
        member_id=member.id,
        pessimistic_rate=Decimal("2.0"),
        realistic_rate=Decimal("2.0"),
        optimistic_rate=Decimal("2.0"),
        compounding_frequency=CompoundingFrequency.MONTHLY
    )
    
    pension_quarterly = create_test_pension_savings(
        db_session,
        member_id=member.id,
        pessimistic_rate=Decimal("2.0"),
        realistic_rate=Decimal("2.0"),
        optimistic_rate=Decimal("2.0"),
        compounding_frequency=CompoundingFrequency.QUARTERLY
    )
    
    pension_annually = create_test_pension_savings(
        db_session,
        member_id=member.id,
        pessimistic_rate=Decimal("2.0"),
        realistic_rate=Decimal("2.0"),
        optimistic_rate=Decimal("2.0"),
        compounding_frequency=CompoundingFrequency.ANNUALLY
    )
    
    # Add same initial balance to all
    initial_balance = Decimal("10000.00")
    
    create_test_savings_statement(
        db_session,
        pension_id=pension_daily.id,
        balance=initial_balance
    )
    
    create_test_savings_statement(
        db_session,
        pension_id=pension_monthly.id,
        balance=initial_balance
    )
    
    create_test_savings_statement(
        db_session,
        pension_id=pension_quarterly.id,
        balance=initial_balance
    )
    
    create_test_savings_statement(
        db_session,
        pension_id=pension_annually.id,
        balance=initial_balance
    )
    
    # Calculate projections
    service = PensionSavingsProjectionService()
    daily_proj = service.calculate_scenarios(
        pension=pension_daily,
        member=member,
        reference_date=date(2023, 1, 1)
    )
    
    monthly_proj = service.calculate_scenarios(
        pension=pension_monthly,
        member=member,
        reference_date=date(2023, 1, 1)
    )
    
    quarterly_proj = service.calculate_scenarios(
        pension=pension_quarterly,
        member=member,
        reference_date=date(2023, 1, 1)
    )
    
    annually_proj = service.calculate_scenarios(
        pension=pension_annually,
        member=member,
        reference_date=date(2023, 1, 1)
    )
    
    # More frequent compounding should yield higher balances
    daily_balance = daily_proj.planned["realistic"].balance
    monthly_balance = monthly_proj.planned["realistic"].balance
    quarterly_balance = quarterly_proj.planned["realistic"].balance
    annual_balance = annually_proj.planned["realistic"].balance
    
    assert daily_balance > monthly_balance
    assert monthly_balance > quarterly_balance
    assert quarterly_balance > annual_balance

@pytest.mark.unit
def test_contribution_plans(db_session):
    """Test projections with different contribution plans."""
    # Create test data
    member = create_test_member(
        db_session, 
        retirement_age_planned=65,
        retirement_date_planned=date(2040, 1, 1)
    )
    
    # Create a pension without contributions
    pension_no_contrib = create_test_pension_savings(
        db_session,
        member_id=member.id,
        pessimistic_rate=Decimal("2.0"),
        realistic_rate=Decimal("2.0"),
        optimistic_rate=Decimal("2.0")
    )
    
    # Create a pension with contributions
    pension_with_contrib = create_test_pension_savings(
        db_session,
        member_id=member.id,
        pessimistic_rate=Decimal("2.0"),
        realistic_rate=Decimal("2.0"),
        optimistic_rate=Decimal("2.0")
    )
    
    # Add same initial balance to both
    initial_balance = Decimal("10000.00")
    
    create_test_savings_statement(
        db_session,
        pension_id=pension_no_contrib.id,
        balance=initial_balance
    )
    
    create_test_savings_statement(
        db_session,
        pension_id=pension_with_contrib.id,
        balance=initial_balance
    )
    
    # Add contribution plan to one pension
    create_test_savings_contribution_step(
        db_session,
        pension_savings_id=pension_with_contrib.id,
        amount=Decimal("100.00"),
        frequency=ContributionFrequency.MONTHLY,
        start_date=date(2023, 1, 1)
    )
    
    # Calculate projections
    service = PensionSavingsProjectionService()
    no_contrib_proj = service.calculate_scenarios(
        pension=pension_no_contrib,
        member=member,
        reference_date=date(2023, 1, 1)
    )
    
    with_contrib_proj = service.calculate_scenarios(
        pension=pension_with_contrib,
        member=member,
        reference_date=date(2023, 1, 1)
    )
    
    # Pension with contributions should have higher projected balance
    no_contrib_balance = no_contrib_proj.planned["realistic"].balance
    with_contrib_balance = with_contrib_proj.planned["realistic"].balance
    
    assert with_contrib_balance > no_contrib_balance
    
    # Create a pension with multiple contribution steps
    pension_multi_steps = create_test_pension_savings(
        db_session,
        member_id=member.id,
        pessimistic_rate=Decimal("2.0"),
        realistic_rate=Decimal("2.0"),
        optimistic_rate=Decimal("2.0")
    )
    
    create_test_savings_statement(
        db_session,
        pension_id=pension_multi_steps.id,
        balance=initial_balance
    )
    
    # First step: 100 monthly for 5 years
    create_test_savings_contribution_step(
        db_session,
        pension_savings_id=pension_multi_steps.id,
        amount=Decimal("100.00"),
        frequency=ContributionFrequency.MONTHLY,
        start_date=date(2023, 1, 1),
        end_date=date(2027, 12, 31)
    )
    
    # Second step: 200 monthly after 5 years
    create_test_savings_contribution_step(
        db_session,
        pension_savings_id=pension_multi_steps.id,
        amount=Decimal("200.00"),
        frequency=ContributionFrequency.MONTHLY,
        start_date=date(2028, 1, 1)
    )
    
    multi_steps_proj = service.calculate_scenarios(
        pension=pension_multi_steps,
        member=member,
        reference_date=date(2023, 1, 1)
    )
    
    # Multiple step contributions should result in higher balance than single step
    multi_steps_balance = multi_steps_proj.planned["realistic"].balance
    
    assert multi_steps_balance > with_contrib_balance

@pytest.mark.unit
def test_retirement_dates(db_session):
    """Test projections for different retirement dates."""
    # Create test data with different planned vs possible retirement dates
    member = create_test_member(
        db_session, 
        retirement_age_planned=67,
        retirement_age_possible=63,
        birthday=date(1980, 1, 1)
    )
    
    pension = create_test_pension_savings(
        db_session,
        member_id=member.id,
        pessimistic_rate=Decimal("2.0"),
        realistic_rate=Decimal("2.0"),
        optimistic_rate=Decimal("2.0")
    )
    
    create_test_savings_statement(
        db_session,
        pension_id=pension.id,
        balance=Decimal("10000.00")
    )
    
    create_test_savings_contribution_step(
        db_session,
        pension_savings_id=pension.id,
        amount=Decimal("100.00"),
        frequency=ContributionFrequency.MONTHLY,
        start_date=date(2023, 1, 1)
    )
    
    # Calculate projections
    service = PensionSavingsProjectionService()
    projections = service.calculate_scenarios(
        pension=pension,
        member=member,
        reference_date=date(2023, 1, 1)
    )
    
    # Check that both retirement dates are calculated
    planned_balance = projections.planned["realistic"].balance
    possible_balance = projections.possible["realistic"].balance
    
    # Earlier retirement (possible) should have lower balance than later retirement (planned)
    assert planned_balance > possible_balance
    
    # Check that retirement ages are correctly reported
    assert projections.planned["realistic"].retirement_age == 67
    assert projections.possible["realistic"].retirement_age == 63 