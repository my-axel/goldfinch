from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime


class DataSourceConfig(Base):
    __tablename__ = "data_source_configs"

    source_id = Column(String, primary_key=True)          # "yfinance", "stooq", "tiingo"
    name = Column(String, nullable=False)                  # Display name
    enabled = Column(Boolean, nullable=False, default=True)
    api_key = Column(String, nullable=True)                # NULL if no key required
    priority = Column(Integer, nullable=False, default=100)  # Lower = higher priority
    requires_api_key = Column(Boolean, nullable=False, default=False)
    supports_search = Column(Boolean, nullable=False, default=False)
    extra_config = Column(JSONB, nullable=True)            # e.g. {"max_retries": 3}
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    source_symbols = relationship("ETFSourceSymbol", back_populates="data_source", cascade="all, delete-orphan")


class ETFSourceSymbol(Base):
    """Maps an ETF to its source-specific ticker symbol."""
    __tablename__ = "etf_source_symbols"

    id = Column(Integer, primary_key=True)
    etf_id = Column(String, ForeignKey("etfs.id", ondelete="CASCADE"), nullable=False)
    source_id = Column(String, ForeignKey("data_source_configs.source_id", ondelete="CASCADE"), nullable=False)
    symbol = Column(String, nullable=False)               # e.g. "VWRL.UK" for Stooq
    verified = Column(Boolean, nullable=False, default=False)  # Successfully fetched?
    last_verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    etf = relationship("ETF", back_populates="source_symbols")
    data_source = relationship("DataSourceConfig", back_populates="source_symbols")

    __table_args__ = (
        UniqueConstraint('etf_id', 'source_id', name='uix_etf_source_symbol'),
    )
