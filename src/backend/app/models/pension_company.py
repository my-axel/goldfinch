from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, Boolean, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.enums import ContributionFrequency

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
    vesting_period = Column(Integer, nullable=False)
    matching_percentage = Column(Numeric(10, 4), nullable=True)
    max_employer_contribution = Column(Numeric(20, 2), nullable=True)

    # Relationships
    member = relationship("HouseholdMember", back_populates="company_pensions")
    contribution_plan_steps = relationship("PensionCompanyContributionPlanStep", back_populates="pension", cascade="all, delete-orphan")
    contribution_plan = relationship("PensionCompanyContributionPlan", back_populates="pension", cascade="all, delete-orphan")
    contribution_history = relationship("PensionCompanyContributionHistory", back_populates="pension", cascade="all, delete-orphan")

class PensionCompanyContributionPlanStep(Base):
    __tablename__ = "pension_company_contribution_plan_steps"

    id = Column(Integer, primary_key=True, index=True)
    pension_company_id = Column(Integer, ForeignKey("pension_company.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(20, 2), nullable=False)
    frequency = Column(SQLEnum(ContributionFrequency), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)

    # Relationships
    pension = relationship("PensionCompany", back_populates="contribution_plan_steps")

class PensionCompanyContributionPlan(Base):
    __tablename__ = "pension_company_contribution_plan"

    id = Column(Integer, primary_key=True, index=True)
    pension_company_id = Column(Integer, ForeignKey("pension_company.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    employee_amount = Column(Numeric(20, 2), nullable=False)
    employer_amount = Column(Numeric(20, 2), nullable=False)
    note = Column(String, nullable=True)

    # Relationships
    pension = relationship("PensionCompany", back_populates="contribution_plan")

class PensionCompanyContributionHistory(Base):
    __tablename__ = "pension_company_contribution_history"

    id = Column(Integer, primary_key=True, index=True)
    pension_company_id = Column(Integer, ForeignKey("pension_company.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    employee_amount = Column(Numeric(20, 2), nullable=False)
    employer_amount = Column(Numeric(20, 2), nullable=False)
    is_manual = Column(Boolean, nullable=False, default=False)
    note = Column(String, nullable=True)

    # Relationships
    pension = relationship("PensionCompany", back_populates="contribution_history") 