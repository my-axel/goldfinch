from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, Boolean, Index, Enum as SQLEnum, Text, DateTime
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.enums import ContributionFrequency, PensionStatus
from sqlalchemy.sql import func

class PensionCompany(Base):
    __tablename__ = "pension_company"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("household_members.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    current_value = Column(Numeric(20, 2), nullable=False, default=0)
    notes = Column(String, nullable=True)
    
    # Company specific
    employer = Column(String, nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    
    # New fields
    contribution_amount = Column(Numeric(20, 2), nullable=True)
    contribution_frequency = Column(SQLEnum(ContributionFrequency), nullable=True)

    # Status management
    status = Column(SQLEnum(PensionStatus), nullable=False, default=PensionStatus.ACTIVE)
    paused_at = Column(Date, nullable=True)
    resume_at = Column(Date, nullable=True)

    # Relationships
    member = relationship("HouseholdMember", back_populates="company_pensions")
    contribution_plan_steps = relationship("PensionCompanyContributionPlanStep", back_populates="pension", cascade="all, delete-orphan")
    contribution_history = relationship("PensionCompanyContributionHistory", back_populates="pension", cascade="all, delete-orphan")
    statements = relationship("PensionCompanyStatement", back_populates="pension", cascade="all, delete-orphan")

class PensionCompanyContributionPlanStep(Base):
    __tablename__ = "pension_company_contribution_plan_steps"

    id = Column(Integer, primary_key=True, index=True)
    pension_company_id = Column(Integer, ForeignKey("pension_company.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(20, 2), nullable=False)
    frequency = Column(SQLEnum(ContributionFrequency), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    note = Column(String, nullable=True)

    # Relationships
    pension = relationship("PensionCompany", back_populates="contribution_plan_steps")

class PensionCompanyContributionHistory(Base):
    __tablename__ = "pension_company_contribution_history"

    id = Column(Integer, primary_key=True, index=True)
    pension_company_id = Column(Integer, ForeignKey("pension_company.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    amount = Column(Numeric(20, 2), nullable=False)
    is_manual = Column(Boolean, nullable=False, default=False)
    note = Column(String, nullable=True)

    # Relationships
    pension = relationship("PensionCompany", back_populates="contribution_history")

class PensionCompanyStatement(Base):
    """
    Represents a statement for a company pension plan.
    Each statement contains projections for retirement benefits.
    """
    __tablename__ = "pension_company_statements"

    id = Column(Integer, primary_key=True, index=True)
    pension_id = Column(Integer, ForeignKey("pension_company.id", ondelete="CASCADE"), nullable=False)
    statement_date = Column(Date, nullable=False)
    value = Column(Numeric(precision=20, scale=2), nullable=False)  # Total capital/value at statement date
    note = Column(Text, nullable=True)  # Renamed from notes to note
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    pension = relationship("PensionCompany", back_populates="statements")
    retirement_projections = relationship("PensionCompanyRetirementProjection", back_populates="statement", cascade="all, delete-orphan")

class PensionCompanyRetirementProjection(Base):
    """
    Represents a retirement projection associated with a pension company statement.
    Contains information about projected retirement benefits.
    """
    __tablename__ = "pension_company_retirement_projections"

    id = Column(Integer, primary_key=True, index=True)
    statement_id = Column(Integer, ForeignKey("pension_company_statements.id", ondelete="CASCADE"), nullable=False)
    retirement_age = Column(Integer, nullable=False)
    monthly_payout = Column(Numeric(precision=10, scale=2), nullable=True)  # Made nullable
    total_capital = Column(Numeric(precision=10, scale=2), nullable=True)   # Made nullable

    # Relationships
    statement = relationship("PensionCompanyStatement", back_populates="retirement_projections")
    
    # Indexes
    __table_args__ = (
        Index("ix_pension_company_retirement_projections_statement_id", "statement_id"),
    ) 