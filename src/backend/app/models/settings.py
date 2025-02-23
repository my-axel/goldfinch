from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.db.base_class import Base

class Settings(Base):
    """Global application settings."""
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    ui_locale = Column(String, nullable=False, default="en-US")
    number_locale = Column(String, nullable=False, default="en-US")
    currency = Column(String, nullable=False, default="USD")
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"Settings(id={self.id}, ui_locale={self.ui_locale}, number_locale={self.number_locale}, currency={self.currency})" 