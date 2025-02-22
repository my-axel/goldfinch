from sqlalchemy import Column, String, Date, Integer, Numeric, UniqueConstraint, Boolean, DateTime, ARRAY, Index
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

class ExchangeRateUpdate(Base):
    """
    Tracks exchange rate update operations.
    Used to monitor both scheduled and manual updates, track their progress,
    and maintain a history of update operations.
    """
    __tablename__ = "exchange_rate_updates"

    id = Column(Integer, primary_key=True)
    update_type = Column(String, nullable=False)  # 'historical', 'daily', 'manual_historical', 'manual_latest'
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, nullable=False)  # 'pending', 'processing', 'completed', 'failed'
    currencies = Column(ARRAY(String), nullable=False)  # Array of currency codes
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error = Column(String, nullable=True)
    missing_dates = Column(ARRAY(Date), nullable=True)  # Array of dates where update failed
    retry_count = Column(Integer, nullable=False, default=0)
    
    __table_args__ = (
        # Index for cleanup queries
        Index('ix_exchange_rate_updates_status_completed', status, completed_at),
    ) 