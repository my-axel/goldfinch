from sqlalchemy import Column, String, Date, Integer, Numeric, UniqueConstraint
from app.db.base_class import Base
from datetime import date

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