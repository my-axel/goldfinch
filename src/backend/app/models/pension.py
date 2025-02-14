from enum import Enum
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import date

class ContributionFrequency(str, Enum):
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    SEMI_ANNUALLY = "SEMI_ANNUALLY"
    ANNUALLY = "ANNUALLY"
    ONE_TIME = "ONE_TIME"

class ContributionStatus(str, Enum):
    PLANNED = "PLANNED"
    REALIZED = "REALIZED"
    SKIPPED = "SKIPPED"
    MODIFIED = "MODIFIED"

class PensionType(str, Enum):
    ETF_PLAN = "ETF_PLAN"
    INSURANCE = "INSURANCE"
    COMPANY = "COMPANY"
    GOVERNMENT = "GOVERNMENT"
    OTHER = "OTHER"

class ContributionStep(Base):
    __tablename__ = "contribution_steps"

    id = Column(Integer, primary_key=True, index=True)
    pension_id = Column(Integer, ForeignKey("pensions.id"), nullable=False)
    amount = Column(Float, nullable=False)
    frequency = Column(SQLEnum(ContributionFrequency), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)

    # Relationships
    pension = relationship("BasePension", back_populates="contribution_plan")

class BasePension(Base):
    __tablename__ = "pensions"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(SQLEnum(PensionType), nullable=False)
    name = Column(String, nullable=False)
    member_id = Column(Integer, ForeignKey("household_members.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    initial_capital = Column(Float, nullable=False)
    current_value = Column(Float, nullable=False)
    notes = Column(String, nullable=True)

    # Relationships
    member = relationship("HouseholdMember", back_populates="pensions")
    contributions = relationship("PensionContribution", back_populates="pension", cascade="all, delete-orphan")
    contribution_plan = relationship("ContributionStep", back_populates="pension", cascade="all, delete-orphan")

    __mapper_args__ = {
        "polymorphic_on": type,
        "polymorphic_identity": None
    }

class ETFPension(BasePension):
    __tablename__ = "etf_pensions"

    id = Column(Integer, ForeignKey("pensions.id"), primary_key=True)
    etf_id = Column(String, ForeignKey("etfs.id"), nullable=False)
    
    etf = relationship("ETF", back_populates="pensions")

    __mapper_args__ = {
        "polymorphic_identity": PensionType.ETF_PLAN
    }

class InsurancePension(BasePension):
    __tablename__ = "insurance_pensions"
    __mapper_args__ = {"polymorphic_identity": PensionType.INSURANCE}

    id = Column(Integer, ForeignKey("pensions.id"), primary_key=True)
    provider = Column(String, nullable=False)
    contract_number = Column(String, nullable=False)
    guaranteed_interest = Column(Float, nullable=False)
    expected_return = Column(Float, nullable=False)

class CompanyPension(BasePension):
    __tablename__ = "company_pensions"
    __mapper_args__ = {"polymorphic_identity": PensionType.COMPANY}

    id = Column(Integer, ForeignKey("pensions.id"), primary_key=True)
    employer = Column(String, nullable=False)
    vesting_period = Column(Integer, nullable=False)
    matching_percentage = Column(Float, nullable=True)
    max_employer_contribution = Column(Float, nullable=True)

class PensionContribution(Base):
    __tablename__ = "pension_contributions"

    id = Column(Integer, primary_key=True, index=True)
    pension_id = Column(Integer, ForeignKey("pensions.id"), nullable=False)
    date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)  # Actual amount if realized, planned amount if planned
    planned_amount = Column(Float, nullable=False)  # Original planned amount
    status = Column(SQLEnum(ContributionStatus), nullable=False, default=ContributionStatus.PLANNED)
    is_manual_override = Column(Boolean, default=False)
    note = Column(String, nullable=True)

    # Relationships
    pension = relationship("BasePension", back_populates="contributions")
    etf_allocations = relationship("ETFAllocation", back_populates="contribution", cascade="all, delete-orphan")

class ETFAllocation(Base):
    __tablename__ = "etf_allocations"

    id = Column(Integer, primary_key=True, index=True)
    contribution_id = Column(Integer, ForeignKey("pension_contributions.id"), nullable=False)
    etf_id = Column(String, ForeignKey("etfs.id"), nullable=False)
    amount = Column(Float, nullable=False)
    units_bought = Column(Float, nullable=False)

    # Relationships
    contribution = relationship("PensionContribution", back_populates="etf_allocations")
    etf = relationship("ETF", back_populates="allocations") 