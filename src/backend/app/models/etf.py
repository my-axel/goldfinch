from sqlalchemy import Column, String, Integer, Date, ForeignKey, DateTime, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base

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
    allocation_plans = relationship("PensionETFAllocationPlan", back_populates="etf")
    allocation_history = relationship("PensionETFAllocationHistory", back_populates="etf")
    historical_prices = relationship("ETFPrice", back_populates="etf", cascade="all, delete-orphan")

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