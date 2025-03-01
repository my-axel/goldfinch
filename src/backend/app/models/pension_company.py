from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, Boolean, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.enums import ContributionFrequency, PensionStatus

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
    latest_statement_date = Column(Date, nullable=True)

    # Status management
    status = Column(SQLEnum(PensionStatus), nullable=False, default=PensionStatus.ACTIVE)
    paused_at = Column(Date, nullable=True)
    resume_at = Column(Date, nullable=True)

    # Relationships
    member = relationship("HouseholdMember", back_populates="company_pensions")
    contribution_plan_steps = relationship("PensionCompanyContributionPlanStep", back_populates="pension", cascade="all, delete-orphan")
    contribution_history = relationship("PensionCompanyContributionHistory", back_populates="pension", cascade="all, delete-orphan")
    projections = relationship("PensionCompanyProjection", back_populates="pension", cascade="all, delete-orphan")

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

# New model for projections
class PensionCompanyProjection(Base):
    __tablename__ = "pension_company_projections"

    id = Column(Integer, primary_key=True, index=True)
    pension_company_id = Column(Integer, ForeignKey("pension_company.id", ondelete="CASCADE"), nullable=False)
    retirement_age = Column(Integer, nullable=False)
    monthly_payout = Column(Numeric(20, 2), nullable=False)
    total_capital = Column(Numeric(20, 2), nullable=False)
    
    # Relationships
    pension = relationship("PensionCompany", back_populates="projections")
    
    # Indexes
    __table_args__ = (
        Index("ix_pension_company_projections_pension_id", "pension_company_id"),
    ) 