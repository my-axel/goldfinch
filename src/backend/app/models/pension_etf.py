from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, Boolean, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.enums import ContributionFrequency

class PensionETF(Base):
    __tablename__ = "pension_etf"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("household_members.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    current_value = Column(Numeric(20, 2), nullable=False, default=0)
    notes = Column(String, nullable=True)
    
    # ETF specific
    etf_id = Column(String, ForeignKey("etfs.id"), nullable=False, index=True)
    total_units = Column(Numeric(20, 6), nullable=False, default=0)

    # Relationships
    member = relationship("HouseholdMember", back_populates="etf_pensions")
    etf = relationship("ETF", back_populates="pensions")
    contribution_plan_steps = relationship("PensionETFContributionPlanStep", back_populates="pension", cascade="all, delete-orphan")
    contribution_plan = relationship("PensionETFContributionPlan", back_populates="pension", cascade="all, delete-orphan")
    contribution_history = relationship("PensionETFContributionHistory", back_populates="pension", cascade="all, delete-orphan")

class PensionETFContributionPlanStep(Base):
    __tablename__ = "pension_etf_contribution_plan_steps"

    id = Column(Integer, primary_key=True, index=True)
    pension_etf_id = Column(Integer, ForeignKey("pension_etf.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(20, 2), nullable=False)
    frequency = Column(SQLEnum(ContributionFrequency), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)

    # Relationships
    pension = relationship("PensionETF", back_populates="contribution_plan_steps")

class PensionETFContributionPlan(Base):
    __tablename__ = "pension_etf_contribution_plan"

    id = Column(Integer, primary_key=True, index=True)
    pension_etf_id = Column(Integer, ForeignKey("pension_etf.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    amount = Column(Numeric(20, 2), nullable=False)
    note = Column(String, nullable=True)

    # Relationships
    pension = relationship("PensionETF", back_populates="contribution_plan")
    allocations = relationship("PensionETFAllocationPlan", back_populates="contribution", cascade="all, delete-orphan")

class PensionETFContributionHistory(Base):
    __tablename__ = "pension_etf_contribution_history"

    id = Column(Integer, primary_key=True, index=True)
    pension_etf_id = Column(Integer, ForeignKey("pension_etf.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    amount = Column(Numeric(20, 2), nullable=False)
    is_manual = Column(Boolean, nullable=False, default=False)
    note = Column(String, nullable=True)

    # Relationships
    pension = relationship("PensionETF", back_populates="contribution_history")
    allocations = relationship("PensionETFAllocationHistory", back_populates="contribution", cascade="all, delete-orphan")

class PensionETFAllocationPlan(Base):
    __tablename__ = "pension_etf_allocation_plan"

    id = Column(Integer, primary_key=True, index=True)
    pension_etf_contribution_plan_id = Column(Integer, ForeignKey("pension_etf_contribution_plan.id", ondelete="CASCADE"), nullable=False)
    etf_id = Column(String, ForeignKey("etfs.id"), nullable=False)
    amount = Column(Numeric(20, 2), nullable=False)
    percentage = Column(Numeric(5, 2), nullable=False)

    # Relationships
    contribution = relationship("PensionETFContributionPlan", back_populates="allocations")
    etf = relationship("ETF", back_populates="allocation_plans")

class PensionETFAllocationHistory(Base):
    __tablename__ = "pension_etf_allocation_history"

    id = Column(Integer, primary_key=True, index=True)
    pension_etf_contribution_history_id = Column(Integer, ForeignKey("pension_etf_contribution_history.id", ondelete="CASCADE"), nullable=False)
    etf_id = Column(String, ForeignKey("etfs.id"), nullable=False)
    amount = Column(Numeric(20, 2), nullable=False)
    units = Column(Numeric(20, 6), nullable=False)
    price_per_unit = Column(Numeric(20, 6), nullable=False)
    percentage = Column(Numeric(5, 2), nullable=False)

    # Relationships
    contribution = relationship("PensionETFContributionHistory", back_populates="allocations")
    etf = relationship("ETF", back_populates="allocation_history") 