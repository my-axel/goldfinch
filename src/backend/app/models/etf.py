from sqlalchemy import Column, String, Float, Boolean, JSON, Integer, Date, ForeignKey, DateTime, Numeric
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import date, datetime

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
    pensions = relationship("ETFPension", back_populates="etf")
    allocations = relationship("ETFAllocation", back_populates="etf")
    historical_prices = relationship("ETFPrice", back_populates="etf")

class ETFPrice(Base):
    __tablename__ = "etf_prices"

    id = Column(Integer, primary_key=True)
    etf_id = Column(String, ForeignKey("etfs.id"), nullable=False)
    date = Column(Date, nullable=False)
    price = Column(Numeric(20, 2), nullable=False)
    currency = Column(String, nullable=False, default="EUR")

    # Relationship
    etf = relationship("ETF", back_populates="historical_prices") 