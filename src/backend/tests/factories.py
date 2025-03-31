from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from app.models.household import HouseholdMember
from app.models.pension_state import PensionState, PensionStateStatement
from app.models.pension_savings import PensionSavings, PensionSavingsStatement, PensionSavingsContributionPlanStep
from app.models.enums import PensionStatus, ContributionFrequency, CompoundingFrequency

def create_test_member(db_session, **kwargs) -> HouseholdMember:
    """Factory function to create a test household member."""
    birthday = date(1990, 1, 1)
    retirement_age_planned = 67
    retirement_age_possible = 63
    
    defaults = {
        "first_name": "Test",
        "last_name": "User",
        "birthday": birthday,
        "retirement_age_planned": retirement_age_planned,
        "retirement_age_possible": retirement_age_possible,
        "retirement_date_planned": date(birthday.year + retirement_age_planned, birthday.month, birthday.day),
        "retirement_date_possible": date(birthday.year + retirement_age_possible, birthday.month, birthday.day)
    }
    defaults.update(kwargs)
    
    member = HouseholdMember(**defaults)
    db_session.add(member)
    db_session.commit()
    return member

def create_test_pension_state(db_session, member_id: Optional[int] = None, **kwargs) -> PensionState:
    """Factory function to create a test pension state."""
    if not member_id:
        test_member = create_test_member(db_session)
        member_id = test_member.id

    defaults = {
        "member_id": member_id,
        "name": "Test State Pension",
        "start_date": date(2020, 1, 1),
        "status": PensionStatus.ACTIVE,
        "notes": None
    }
    defaults.update(kwargs)
    
    pension = PensionState(**defaults)
    db_session.add(pension)
    db_session.commit()
    return pension

def create_test_pension_statement(db_session, pension_id: Optional[int] = None, **kwargs) -> PensionStateStatement:
    """Factory function to create a test pension statement."""
    if not pension_id:
        test_pension = create_test_pension_state(db_session)
        pension_id = test_pension.id

    defaults = {
        "pension_id": pension_id,
        "statement_date": date(2024, 1, 1),
        "current_monthly_amount": Decimal("500.00"),
        "projected_monthly_amount": Decimal("2000.00"),
        "note": "Test statement"
    }
    defaults.update(kwargs)
    
    statement = PensionStateStatement(**defaults)
    db_session.add(statement)
    db_session.commit()
    return statement

def create_test_pension_savings(db_session, member_id: Optional[int] = None, **kwargs) -> PensionSavings:
    """Factory function to create a test savings pension."""
    if not member_id:
        test_member = create_test_member(db_session)
        member_id = test_member.id

    defaults = {
        "member_id": member_id,
        "name": "Test Savings Account",
        "start_date": date(2020, 1, 1),
        "status": PensionStatus.ACTIVE,
        "pessimistic_rate": Decimal("1.0"),
        "realistic_rate": Decimal("2.0"),
        "optimistic_rate": Decimal("3.0"),
        "compounding_frequency": CompoundingFrequency.ANNUALLY,
        "notes": None
    }
    defaults.update(kwargs)
    
    pension = PensionSavings(**defaults)
    db_session.add(pension)
    db_session.commit()
    return pension

def create_test_savings_statement(db_session, pension_id: int, **kwargs) -> PensionSavingsStatement:
    """Factory function to create a test savings statement."""
    defaults = {
        "pension_id": pension_id,
        "statement_date": date(2023, 1, 1),
        "balance": Decimal("5000.00"),
        "note": None
    }
    defaults.update(kwargs)
    
    statement = PensionSavingsStatement(**defaults)
    db_session.add(statement)
    db_session.commit()
    return statement

def create_test_savings_contribution_step(db_session, pension_savings_id: int, **kwargs) -> PensionSavingsContributionPlanStep:
    """Factory function to create a test savings contribution plan step."""
    defaults = {
        "pension_savings_id": pension_savings_id,
        "amount": Decimal("100.00"),
        "frequency": ContributionFrequency.MONTHLY,
        "start_date": date(2020, 1, 1),
        "end_date": None,
        "note": None
    }
    defaults.update(kwargs)
    
    contribution = PensionSavingsContributionPlanStep(**defaults)
    db_session.add(contribution)
    db_session.commit()
    return contribution 