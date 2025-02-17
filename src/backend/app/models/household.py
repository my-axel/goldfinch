from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class HouseholdMember(Base):
    __tablename__ = "household_members"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    birthday = Column(Date, nullable=False)
    retirement_age_planned = Column(Integer, nullable=False, default=67)
    retirement_age_possible = Column(Integer, nullable=False, default=63)
    
    # Pension relationships
    etf_pensions = relationship("PensionETF", back_populates="member", cascade="all, delete-orphan")
    insurance_pensions = relationship("PensionInsurance", back_populates="member", cascade="all, delete-orphan")
    company_pensions = relationship("PensionCompany", back_populates="member", cascade="all, delete-orphan")

    @property
    def pensions(self):
        """Returns all pensions of all types for this member."""
        return [
            *self.etf_pensions,
            *self.insurance_pensions,
            *self.company_pensions
        ] 