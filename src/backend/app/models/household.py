from sqlalchemy import Column, Integer, String, Date, ForeignKey, Boolean, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import date

class HouseholdMember(Base):
    __tablename__ = "household_members"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    birthday = Column(Date, nullable=False)
    retirement_age_planned = Column(Integer, nullable=False, default=67)
    retirement_age_possible = Column(Integer, nullable=False, default=63)
    
    # Computed fields for retirement dates
    retirement_date_planned = Column(Date, nullable=False)
    retirement_date_possible = Column(Date, nullable=False)
    
    # Pension relationships
    etf_pensions = relationship("PensionETF", back_populates="member", cascade="all, delete-orphan")
    insurance_pensions = relationship("PensionInsurance", back_populates="member", cascade="all, delete-orphan")
    company_pensions = relationship("PensionCompany", back_populates="member", cascade="all, delete-orphan")
    state_pensions = relationship("PensionState", back_populates="member", cascade="all, delete-orphan")

    @property
    def pensions(self):
        """Returns all pensions of all types for this member."""
        return [
            *self.etf_pensions,
            *self.insurance_pensions,
            *self.company_pensions,
            *self.state_pensions
        ]

    def calculate_retirement_dates(self):
        """Calculate retirement dates based on birthday and retirement ages."""
        if not self.birthday:
            return
            
        planned_date = date(
            self.birthday.year + self.retirement_age_planned,
            self.birthday.month,
            self.birthday.day
        )
        possible_date = date(
            self.birthday.year + self.retirement_age_possible,
            self.birthday.month,
            self.birthday.day
        )
        
        self.retirement_date_planned = planned_date
        self.retirement_date_possible = possible_date 