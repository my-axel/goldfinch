from sqlalchemy import Column, Integer, ForeignKey, Numeric, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base


class RetirementGapConfig(Base):
    __tablename__ = "retirement_gap_config"

    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("household_members.id"), unique=True, nullable=False)
    net_monthly_income = Column(Numeric(12, 2), nullable=False)
    desired_monthly_pension = Column(Numeric(12, 2), nullable=True)
    replacement_rate = Column(Numeric(5, 4), nullable=False, default=0.80)
    withdrawal_rate = Column(Numeric(5, 4), nullable=False, default=0.04)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    member = relationship("HouseholdMember", back_populates="gap_config")
