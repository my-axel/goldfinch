from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Numeric
from app.db.base_class import Base

class Settings(Base):
    """Global application settings."""
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    ui_locale = Column(String, nullable=False, default="en-US")
    number_locale = Column(String, nullable=False, default="en-US")
    currency = Column(String, nullable=False, default="USD")
    
    # Projection rates (as percentages)
    projection_pessimistic_rate = Column(Numeric(10, 4), nullable=False, default=4.0)
    projection_realistic_rate = Column(Numeric(10, 4), nullable=False, default=6.0)
    projection_optimistic_rate = Column(Numeric(10, 4), nullable=False, default=8.0)
    
    # Inflation rate (as percentage)
    inflation_rate = Column(Numeric(10, 4), nullable=False, default=2.0)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"Settings(id={self.id}, ui_locale={self.ui_locale}, number_locale={self.number_locale}, currency={self.currency}, projection_rates={self.projection_pessimistic_rate}/{self.projection_realistic_rate}/{self.projection_optimistic_rate}, inflation_rate={self.inflation_rate})" 