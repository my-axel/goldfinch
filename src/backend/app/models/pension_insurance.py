from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, Boolean, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.enums import ContributionFrequency, PensionStatus

class PensionInsurance(Base):
    __tablename__ = "pension_insurance"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("household_members.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    current_value = Column(Numeric(20, 2), nullable=False, default=0)
    notes = Column(String, nullable=True)
    
    # Insurance specific
    provider = Column(String, nullable=False)
    contract_number = Column(String, nullable=True)
    start_date = Column(Date, nullable=False)
    guaranteed_interest = Column(Numeric(10, 4), nullable=True)
    expected_return = Column(Numeric(10, 4), nullable=True)
    status = Column(SQLEnum(PensionStatus), nullable=False, default=PensionStatus.ACTIVE)
    
    # Policy term fields (all optional)
    policy_duration_years = Column(Integer, nullable=True)
    policy_end_date = Column(Date, nullable=True)
    is_lifetime_policy = Column(Boolean, nullable=True)

    # Relationships
    member = relationship("HouseholdMember", back_populates="insurance_pensions")
    contribution_plan_steps = relationship("PensionInsuranceContributionPlanStep", back_populates="pension", cascade="all, delete-orphan")
    contribution_history = relationship("PensionInsuranceContributionHistory", back_populates="pension", cascade="all, delete-orphan")
    statements = relationship("PensionInsuranceStatement", back_populates="pension", cascade="all, delete-orphan", order_by="desc(PensionInsuranceStatement.statement_date)")
    # NOTE: The benefits relationship is defined but not currently used in the frontend.
    # The PensionInsuranceBenefit model exists in the database but is not populated.
    # Currently, only the total_benefits field in PensionInsuranceStatement is used.
    benefits = relationship("PensionInsuranceBenefit", back_populates="pension", cascade="all, delete-orphan")

    # Create a unique index on member_id, provider, name
    __table_args__ = (
        Index('ix_pension_insurance_member_provider_name', member_id, provider, name, unique=True),
    )

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

# New models as per implementation plan

class PensionInsuranceBenefit(Base):
    """
    Model for tracking additional benefits for insurance pensions.
    
    NOTE: This model is currently not used in the frontend implementation.
    The database table exists but is not populated through the UI.
    It was designed to track individual benefits (e.g., government subsidies, 
    employer matches, child bonuses) with specific durations and frequencies,
    but currently only the total_benefits field in PensionInsuranceStatement 
    is used as a summary value.
    
    This model may be used in future implementations to provide more detailed
    tracking of individual benefits.
    """
    __tablename__ = "pension_insurance_benefits"
    
    id = Column(Integer, primary_key=True, index=True)
    pension_insurance_id = Column(Integer, ForeignKey("pension_insurance.id", ondelete="CASCADE"), nullable=False)
    source = Column(String, nullable=False)
    amount = Column(Numeric(20, 2), nullable=False)  # EUR
    frequency = Column(SQLEnum(ContributionFrequency), nullable=False)
    description = Column(String, nullable=True)
    valid_from = Column(Date, nullable=False)
    valid_until = Column(Date, nullable=True)
    status = Column(String, nullable=False, default="ACTIVE")  # ACTIVE, PAUSED, ENDED
    
    # Relationships
    pension = relationship("PensionInsurance", back_populates="benefits")

class PensionInsuranceStatement(Base):
    __tablename__ = "pension_insurance_statements"
    
    id = Column(Integer, primary_key=True, index=True)
    pension_insurance_id = Column(Integer, ForeignKey("pension_insurance.id", ondelete="CASCADE"), nullable=False)
    statement_date = Column(Date, nullable=False, index=True)
    value = Column(Numeric(20, 2), nullable=False)  # EUR
    total_contributions = Column(Numeric(20, 2), nullable=False)  # EUR
    total_benefits = Column(Numeric(20, 2), nullable=False)  # EUR
    costs_amount = Column(Numeric(20, 2), nullable=True)  # EUR
    costs_percentage = Column(Numeric(5, 2), nullable=True)
    note = Column(String, nullable=True)
    
    # Relationships
    pension = relationship("PensionInsurance", back_populates="statements")
    projections = relationship(
        "PensionInsuranceProjection",
        back_populates="statement",
        cascade="all, delete-orphan"
    )

class PensionInsuranceProjection(Base):
    __tablename__ = "pension_insurance_projections"
    
    id = Column(Integer, primary_key=True, index=True)
    statement_id = Column(Integer, ForeignKey("pension_insurance_statements.id", ondelete="CASCADE"), nullable=False)
    scenario_type = Column(String, nullable=False)  # "with_contributions" or "without_contributions"
    return_rate = Column(Numeric(5, 2), nullable=False)
    value_at_retirement = Column(Numeric(20, 2), nullable=False)  # EUR
    monthly_payout = Column(Numeric(20, 2), nullable=False)  # EUR
    
    # Relationships
    statement = relationship("PensionInsuranceStatement", back_populates="projections") 