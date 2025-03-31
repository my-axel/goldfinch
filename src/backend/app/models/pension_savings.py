from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.enums import PensionStatus, ContributionFrequency, CompoundingFrequency

class PensionSavings(Base):
    """
    Model representing a savings account used for retirement planning.
    Each account can have multiple statements tracking its balance over time
    and contribution plan steps defining regular contributions.
    """
    __tablename__ = "pension_savings"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("household_members.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    notes = Column(String, nullable=True)
    
    # Savings specific fields
    pessimistic_rate = Column(Numeric(4, 2), nullable=False, default=1.0)
    realistic_rate = Column(Numeric(4, 2), nullable=False, default=2.0)
    optimistic_rate = Column(Numeric(4, 2), nullable=False, default=3.0)
    compounding_frequency = Column(SQLEnum(CompoundingFrequency), nullable=False, default=CompoundingFrequency.ANNUALLY)
    
    # Status management
    status = Column(SQLEnum(PensionStatus), nullable=False, default=PensionStatus.ACTIVE)
    paused_at = Column(Date, nullable=True)
    resume_at = Column(Date, nullable=True)

    # Relationships
    member = relationship("HouseholdMember", back_populates="savings_pensions")
    statements = relationship(
        "PensionSavingsStatement", 
        back_populates="pension", 
        cascade="all, delete-orphan",
        order_by="desc(PensionSavingsStatement.statement_date)"
    )
    contribution_plan_steps = relationship(
        "PensionSavingsContributionPlanStep", 
        back_populates="pension", 
        cascade="all, delete-orphan"
    )

class PensionSavingsStatement(Base):
    """
    Model for tracking savings account balances over time.
    Each statement represents a snapshot of the account at a certain date.
    """
    __tablename__ = "pension_savings_statements"

    id = Column(Integer, primary_key=True, index=True)
    pension_id = Column(Integer, ForeignKey("pension_savings.id", ondelete="CASCADE"), nullable=False, index=True)
    statement_date = Column(Date, nullable=False)
    balance = Column(Numeric(20, 2), nullable=False)
    note = Column(String, nullable=True)

    # Relationships
    pension = relationship("PensionSavings", back_populates="statements")
    
    # Indexes
    __table_args__ = (
        Index("ix_pension_savings_statements_pension_id_date", 
              "pension_id", "statement_date"),
    )

class PensionSavingsContributionPlanStep(Base):
    """
    Model for planned regular contributions to a savings account.
    Defines the amount, frequency, and time period for contributions.
    """
    __tablename__ = "pension_savings_contribution_plan_steps"

    id = Column(Integer, primary_key=True, index=True)
    pension_savings_id = Column(Integer, ForeignKey("pension_savings.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(20, 2), nullable=False)
    frequency = Column(SQLEnum(ContributionFrequency), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    note = Column(String, nullable=True)

    # Relationships
    pension = relationship("PensionSavings", back_populates="contribution_plan_steps") 