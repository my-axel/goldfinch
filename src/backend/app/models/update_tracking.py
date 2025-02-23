from datetime import date
from sqlalchemy import Column, String, Date, Boolean, Text
from app.db.base_class import Base

class DailyUpdateTracking(Base):
    """
    Tracks daily update attempts for exchange rates and ETF prices.
    This helps avoid unnecessary updates on weekends and holidays.
    """
    __tablename__ = "daily_update_tracking"

    # Composite primary key of date and update_type
    date = Column(Date, primary_key=True)
    update_type = Column(String(50), primary_key=True)  # 'exchange_rates' or 'etf_prices'
    
    # Whether an update was attempted
    attempted = Column(Boolean, default=False)
    
    # Whether data was actually found and updated
    data_found = Column(Boolean, default=False)
    
    # Any notes about the update (e.g., "Weekend - no data expected")
    notes = Column(Text, nullable=True) 