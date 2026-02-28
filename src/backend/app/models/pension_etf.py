from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, Boolean, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.enums import ContributionFrequency, PensionStatus

class PensionETF(Base):
    __tablename__ = "pension_etf"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("household_members.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    current_value = Column(Numeric(20, 2), nullable=False, default=0)
    notes = Column(String, nullable=True)
    
    # ETF specific
    etf_id = Column(String, ForeignKey("etfs.id", ondelete="CASCADE"), nullable=False, index=True)
    total_units = Column(Numeric(20, 6), nullable=False, default=0)
    
    # Investment initialization
    existing_units = Column(Numeric(20, 6), nullable=True)
    reference_date = Column(Date, nullable=True)
    invested_amount = Column(Numeric(20, 2), nullable=True)  # Optional user-entered cost basis

    # Status management
    status = Column(SQLEnum(PensionStatus), nullable=False, default=PensionStatus.ACTIVE)
    paused_at = Column(Date, nullable=True)
    resume_at = Column(Date, nullable=True)

    # Per-pension scenario rates (nullable; falls back to global settings when None)
    # Stored as percentages: 7.0 = 7% p.a.
    pessimistic_rate = Column(Numeric(6, 4), nullable=True)
    realistic_rate = Column(Numeric(6, 4), nullable=True)
    optimistic_rate = Column(Numeric(6, 4), nullable=True)

    # Relationships
    member = relationship("HouseholdMember", back_populates="etf_pensions")
    etf = relationship("ETF", back_populates="pensions")
    contribution_plan_steps = relationship("PensionETFContributionPlanStep", back_populates="pension", cascade="all, delete-orphan")
    contribution_history = relationship("PensionETFContributionHistory", back_populates="pension", cascade="all, delete-orphan")

class PensionETFContributionPlanStep(Base):
    __tablename__ = "pension_etf_contribution_plan_steps"

    id = Column(Integer, primary_key=True, index=True)
    pension_etf_id = Column(Integer, ForeignKey("pension_etf.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(20, 2), nullable=False)
    frequency = Column(SQLEnum(ContributionFrequency), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    note = Column(String, nullable=True)

    # Relationships
    pension = relationship("PensionETF", back_populates="contribution_plan_steps")

class PensionETFContributionHistory(Base):
    __tablename__ = "pension_etf_contribution_history"

    id = Column(Integer, primary_key=True, index=True)
    pension_etf_id = Column(Integer, ForeignKey("pension_etf.id", ondelete="CASCADE"), nullable=False)
    contribution_date = Column(Date, nullable=False)
    amount = Column(Numeric(20, 2), nullable=False)
    is_manual = Column(Boolean, nullable=False, default=False)
    note = Column(String, nullable=True)

    # Relationships
    pension = relationship("PensionETF", back_populates="contribution_history") 