from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.enums import PensionStatus

class PensionState(Base):
    __tablename__ = "pension_state"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("household_members.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    
    # State pension specific
    start_date = Column(Date, nullable=False)  # When person started accumulating state pension
    status = Column(SQLEnum(PensionStatus), nullable=False, default=PensionStatus.ACTIVE)

    # Relationships
    member = relationship("HouseholdMember", back_populates="state_pensions")
    statements = relationship("PensionStateStatement", back_populates="pension", cascade="all, delete-orphan", order_by="desc(PensionStateStatement.statement_date)")

    # Create a unique index on member_id and name
    __table_args__ = (
        Index('ix_pension_state_member_name', member_id, name, unique=True),
    )

class PensionStateStatement(Base):
    __tablename__ = "pension_state_statements"
    
    id = Column(Integer, primary_key=True, index=True)
    pension_id = Column(Integer, ForeignKey("pension_state.id", ondelete="CASCADE"), nullable=False)
    statement_date = Column(Date, nullable=False, index=True)
    current_value = Column(Numeric(20, 2), nullable=True)  # Current value of pension
    current_monthly_amount = Column(Numeric(20, 2), nullable=True)  # Current monthly pension based on contributions so far
    projected_monthly_amount = Column(Numeric(20, 2), nullable=True)  # Projected monthly pension at retirement
    note = Column(String, nullable=True)
    
    # Relationships
    pension = relationship("PensionState", back_populates="statements") 