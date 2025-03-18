from datetime import date
from decimal import Decimal
import pytest
from sqlalchemy.orm import Session
from app.services.exchange_rate import ExchangeRateService
from tests.factories import create_test_pension_state, create_test_pension_statement

pytestmark = pytest.mark.models

@pytest.mark.unit
def test_currency_precision(db_session: Session):
    """Test that monetary values maintain proper precision."""
    statement = create_test_pension_statement(
        db_session,
        current_monthly_amount=Decimal("1234.56"),
        projected_monthly_amount=Decimal("5678.90")
    )
    
    # Verify precision is maintained
    assert statement.current_monthly_amount == Decimal("1234.56")
    assert statement.projected_monthly_amount == Decimal("5678.90")
    
    # Test with more decimal places
    statement.current_monthly_amount = Decimal("1234.567")  # Should round to 2 places
    db_session.commit()
    db_session.refresh(statement)
    assert statement.current_monthly_amount == Decimal("1234.57")

@pytest.mark.unit
def test_currency_storage_in_eur(db_session: Session):
    """Test that monetary values are stored in EUR."""
    # Create statement with EUR values
    statement = create_test_pension_statement(
        db_session,
        current_monthly_amount=Decimal("1000.00"),  # EUR
        projected_monthly_amount=Decimal("2000.00")  # EUR
    )
    
    # Values should be stored as is (in EUR)
    assert statement.current_monthly_amount == Decimal("1000.00")
    assert statement.projected_monthly_amount == Decimal("2000.00")

@pytest.mark.unit
def test_currency_conversion(db_session: Session):
    """Test currency conversion integration."""
    exchange_service = ExchangeRateService()
    
    # Create statement with EUR values
    statement = create_test_pension_statement(
        db_session,
        current_monthly_amount=Decimal("1000.00"),  # EUR
        projected_monthly_amount=Decimal("2000.00")  # EUR
    )
    
    # Convert to USD (example rate: 1 EUR = 1.1 USD)
    usd_current = exchange_service.convert(
        amount=statement.current_monthly_amount,
        from_currency="EUR",
        to_currency="USD"
    )
    assert usd_current > statement.current_monthly_amount  # USD should be more than EUR
    
    # Convert back to EUR
    eur_current = exchange_service.convert(
        amount=usd_current,
        from_currency="USD",
        to_currency="EUR"
    )
    assert pytest.approx(eur_current, rel=1e-10) == statement.current_monthly_amount

@pytest.mark.unit
def test_currency_rounding(db_session: Session):
    """Test proper rounding of monetary values."""
    statement = create_test_pension_statement(
        db_session,
        current_monthly_amount=Decimal("1000.555"),  # Should round to 1000.56
        projected_monthly_amount=Decimal("2000.554")  # Should round to 2000.55
    )
    
    assert statement.current_monthly_amount == Decimal("1000.56")
    assert statement.projected_monthly_amount == Decimal("2000.55")

@pytest.mark.unit
def test_currency_validation(db_session: Session):
    """Test validation of monetary values."""
    pension = create_test_pension_state(db_session)
    
    # Test negative amounts
    with pytest.raises(ValueError):
        create_test_pension_statement(
            db_session,
            pension_id=pension.id,
            current_monthly_amount=Decimal("-1000.00")
        )
    
    # Test too many decimal places
    with pytest.raises(ValueError):
        create_test_pension_statement(
            db_session,
            pension_id=pension.id,
            current_monthly_amount=Decimal("1000.1234")
        )
    
    # Test valid amounts
    statement = create_test_pension_statement(
        db_session,
        pension_id=pension.id,
        current_monthly_amount=Decimal("1000.12"),
        projected_monthly_amount=Decimal("2000.00")
    )
    assert statement.id is not None 