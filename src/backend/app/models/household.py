from sqlalchemy import Column, String, Date, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class HouseholdMember(Base):
    __tablename__ = "household_members"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    birthday = Column(Date, nullable=False)
    retirement_age_planned = Column(Integer, nullable=False, default=67)  # Default retirement age
    retirement_age_possible = Column(Integer, nullable=False, default=63)  # Default earliest possible retirement

    # Add the relationship to pensions
    pensions = relationship("BasePension", back_populates="member") 