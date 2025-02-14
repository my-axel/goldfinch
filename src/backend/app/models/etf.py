from sqlalchemy import Column, String, Float, Boolean, JSON, Integer, Date, ForeignKey, DateTime
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
    fund_size = Column(Float)
    ter = Column(Float)
    distribution_policy = Column(String)
    last_price = Column(Float)
    last_update = Column(DateTime)
    ytd_return = Column(Float)
    one_year_return = Column(Float)
    volatility_30d = Column(Float)
    sharpe_ratio = Column(Float)

    # Relationships
    pensions = relationship("ETFPension", back_populates="etf")
    allocations = relationship("ETFAllocation", back_populates="etf")
    historical_prices = relationship("ETFPrice", back_populates="etf")

class ETFPrice(Base):
    __tablename__ = "etf_prices"

    id = Column(Integer, primary_key=True)
    etf_id = Column(String, ForeignKey("etfs.id"), nullable=False)
    date = Column(Date, nullable=False)
    price = Column(Float, nullable=False)
    currency = Column(String, nullable=False)

    # Relationship
    etf = relationship("ETF", back_populates="historical_prices") 