from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, Boolean, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.enums import ContributionFrequency

class PensionInsurance(Base):
    __tablename__ = "pension_insurance"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("household_members.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    current_value = Column(Numeric(20, 2), nullable=False, default=0)
    notes = Column(String, nullable=True)
    
    # Insurance specific
    provider = Column(String, nullable=False)
    contract_number = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    guaranteed_interest = Column(Numeric(10, 4), nullable=False)
    expected_return = Column(Numeric(10, 4), nullable=False)

    # Relationships
    member = relationship("HouseholdMember", back_populates="insurance_pensions")
    contribution_plan_steps = relationship("PensionInsuranceContributionPlanStep", back_populates="pension", cascade="all, delete-orphan")
    contribution_plan = relationship("PensionInsuranceContributionPlan", back_populates="pension", cascade="all, delete-orphan")
    contribution_history = relationship("PensionInsuranceContributionHistory", back_populates="pension", cascade="all, delete-orphan")

class PensionInsuranceContributionPlanStep(Base):
    __tablename__ = "pension_insurance_contribution_plan_steps"

    id = Column(Integer, primary_key=True, index=True)
    pension_insurance_id = Column(Integer, ForeignKey("pension_insurance.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(20, 2), nullable=False)
    frequency = Column(SQLEnum(ContributionFrequency), nullable=False)  # Changed from String to Enum
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    note = Column(String, nullable=True)

    # Relationships
    pension = relationship("PensionInsurance", back_populates="contribution_plan_steps")

class PensionInsuranceContributionPlan(Base):
    __tablename__ = "pension_insurance_contribution_plan"

    id = Column(Integer, primary_key=True, index=True)
    pension_insurance_id = Column(Integer, ForeignKey("pension_insurance.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    amount = Column(Numeric(20, 2), nullable=False)
    note = Column(String, nullable=True)

    # Relationships
    pension = relationship("PensionInsurance", back_populates="contribution_plan")

class PensionInsuranceContributionHistory(Base):
    __tablename__ = "pension_insurance_contribution_history"

    id = Column(Integer, primary_key=True, index=True)
    pension_insurance_id = Column(Integer, ForeignKey("pension_insurance.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    amount = Column(Numeric(20, 2), nullable=False)
    is_manual = Column(Boolean, nullable=False, default=False)
    note = Column(String, nullable=True)

    # Relationships
    pension = relationship("PensionInsurance", back_populates="contribution_history") 