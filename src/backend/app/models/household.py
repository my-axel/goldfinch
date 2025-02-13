from sqlalchemy import Column, String, Date, Integer
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from app.db.base import Base

class HouseholdMember(Base):
    __tablename__ = "household_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    birthday = Column(Date, nullable=False)
    retirement_age_planned = Column(Integer, nullable=False, default=67)  # Default retirement age
    retirement_age_possible = Column(Integer, nullable=False, default=63)  # Default earliest possible retirement 