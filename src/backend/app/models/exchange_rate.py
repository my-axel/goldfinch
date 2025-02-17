from sqlalchemy import Column, String, Date, Integer, Numeric, UniqueConstraint, Boolean, DateTime
from app.db.base_class import Base
from datetime import datetime

class ExchangeRate(Base):
    """
    Stores daily exchange rates from ECB.
    All rates are stored with EUR as the base currency (1 EUR = X foreign currency).
    """
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    currency = Column(String, nullable=False)  # The target currency (e.g., 'USD', 'CHF')
    rate = Column(Numeric(20, 6), nullable=False)  # Rate: 1 EUR = X currency
    
    # Ensure we don't have duplicate rates for the same currency and date
    __table_args__ = (
        UniqueConstraint('date', 'currency', name='uix_date_currency'),
    )

class ExchangeRateError(Base):
    """
    Tracks exchange rate conversion errors for later resolution.
    Used when exchange rates are missing or invalid for a particular currency pair and date.
    """
    __tablename__ = "exchange_rate_errors"

    id = Column(Integer, primary_key=True)
    source_currency = Column(String, nullable=False)
    target_currency = Column(String, nullable=False, default="EUR")
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    resolved = Column(Boolean, nullable=False, default=False)
    resolved_at = Column(DateTime, nullable=True)
    context = Column(String, nullable=True)  # Additional context about where the error occurred
    
    __table_args__ = (
        # Ensure we don't log duplicate errors for the same currency pair and date
        UniqueConstraint('source_currency', 'target_currency', 'date', name='uix_exchange_rate_error'),
    ) 