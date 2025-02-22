from sqlalchemy import Column, String, Integer, Date, ForeignKey, DateTime, Numeric, UniqueConstraint, ARRAY, Index, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime

class ETF(Base):
    __tablename__ = "etfs"

    id = Column(String, primary_key=True, index=True)
    isin = Column(String, nullable=True)
    symbol = Column(String, index=True)
    name = Column(String)
    currency = Column(String)
    asset_class = Column(String)
    domicile = Column(String)
    inception_date = Column(Date)
    fund_size = Column(Numeric(20, 2))
    ter = Column(Numeric(10, 4))
    distribution_policy = Column(String)
    last_price = Column(Numeric(20, 2))
    last_update = Column(DateTime)
    ytd_return = Column(Numeric(10, 4))
    one_year_return = Column(Numeric(10, 4))
    volatility_30d = Column(Numeric(10, 4))
    sharpe_ratio = Column(Numeric(10, 4))

    # Relationships
    pensions = relationship("PensionETF", back_populates="etf")
    historical_prices = relationship("ETFPrice", back_populates="etf", cascade="all, delete-orphan")
    updates = relationship("ETFUpdate", back_populates="etf", cascade="all, delete-orphan")
    errors = relationship("ETFError", back_populates="etf", cascade="all, delete-orphan")

class ETFPrice(Base):
    __tablename__ = "etf_prices"

    id = Column(Integer, primary_key=True)
    etf_id = Column(String, ForeignKey("etfs.id"), nullable=False)
    date = Column(Date, nullable=False)
    price = Column(Numeric(20, 2), nullable=False)  # Close price
    currency = Column(String, nullable=False, default="EUR")
    
    # Additional price information
    volume = Column(Numeric(20, 2), nullable=True)
    high = Column(Numeric(20, 2), nullable=True)
    low = Column(Numeric(20, 2), nullable=True)
    open = Column(Numeric(20, 2), nullable=True)
    
    # Corporate actions
    dividends = Column(Numeric(20, 6), nullable=True)  # Using higher precision for dividends
    stock_splits = Column(Numeric(10, 6), nullable=True)  # Stock splits are often expressed as ratios
    capital_gains = Column(Numeric(20, 6), nullable=True)  # Capital gains distributions
    
    # Metadata
    original_currency = Column(String, nullable=True)  # The currency the price was in before conversion to EUR
    
    __table_args__ = (
        # Ensure we don't have duplicate prices for the same ETF and date
        UniqueConstraint('etf_id', 'date', name='uix_etf_price_date'),
    )

    # Relationship
    etf = relationship("ETF", back_populates="historical_prices")

class ETFUpdate(Base):
    """
    Tracks ETF data update operations.
    Used to monitor both scheduled and manual updates, track their progress,
    and maintain a history of update operations.
    """
    __tablename__ = "etf_updates"

    id = Column(Integer, primary_key=True)
    etf_id = Column(String, ForeignKey("etfs.id", ondelete="CASCADE"), nullable=False)
    update_type = Column(String, nullable=False)  # 'full', 'prices_only', 'info_only', 'manual'
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, nullable=False)  # 'pending', 'processing', 'completed', 'failed'
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error = Column(String, nullable=True)
    missing_dates = Column(ARRAY(Date), nullable=True)  # Array of dates where price updates failed
    retry_count = Column(Integer, nullable=False, default=0)
    notes = Column(String, nullable=True)  # For tracking date adjustments or other special cases
    
    # Relationships
    etf = relationship("ETF", back_populates="updates")
    
    __table_args__ = (
        # Index for cleanup and status queries
        Index('ix_etf_updates_status_completed', status, completed_at),
        # Index for ETF-specific queries
        Index('ix_etf_updates_etf_id_date', etf_id, start_date, end_date),
    )

class ETFError(Base):
    """
    Tracks ETF data errors for later resolution.
    Used when data fetching or processing fails for specific dates or operations.
    """
    __tablename__ = "etf_errors"

    id = Column(Integer, primary_key=True)
    etf_id = Column(String, ForeignKey("etfs.id", ondelete="CASCADE"), nullable=False)
    error_type = Column(String, nullable=False)  # 'price_missing', 'info_incomplete', 'api_error'
    date = Column(Date, nullable=True)  # Optional, as some errors might not be date-specific
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    resolved = Column(Boolean, nullable=False, default=False)
    resolved_at = Column(DateTime, nullable=True)
    context = Column(String, nullable=True)  # Additional context about where the error occurred
    
    # Relationships
    etf = relationship("ETF", back_populates="errors")
    
    __table_args__ = (
        # Ensure we don't log duplicate errors for the same ETF and date
        UniqueConstraint('etf_id', 'error_type', 'date', name='uix_etf_error'),
        # Index for cleanup and status queries
        Index('ix_etf_errors_resolved', resolved, resolved_at),
    ) 