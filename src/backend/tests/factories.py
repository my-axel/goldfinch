from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from app.models.household import HouseholdMember
from app.models.pension_state import PensionState, PensionStateStatement
from app.models.enums import PensionStatus

def create_test_member(db_session, **kwargs) -> HouseholdMember:
    """Factory function to create a test household member."""
    defaults = {
        "first_name": "Test",
        "last_name": "User",
        "birthday": date(1990, 1, 1),
        "retirement_age_planned": 67,
        "retirement_age_possible": 63
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