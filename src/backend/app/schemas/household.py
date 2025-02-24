from pydantic import BaseModel, Field
from datetime import date
from uuid import UUID
from typing import Optional

class HouseholdMemberBase(BaseModel):
    first_name: str
    last_name: str
    birthday: date
    retirement_age_planned: int = Field(default=67, ge=40, le=100)
    retirement_age_possible: int = Field(default=63, ge=40, le=100)
    retirement_date_planned: date
    retirement_date_possible: date

class HouseholdMemberCreate(HouseholdMemberBase):
    pass

class HouseholdMemberUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birthday: Optional[date] = None
    retirement_age_planned: Optional[int] = Field(default=None, ge=40, le=100)
    retirement_age_possible: Optional[int] = Field(default=None, ge=40, le=100)

class HouseholdMemberInDB(HouseholdMemberBase):
    id: int

    class Config:
        from_attributes = True

class HouseholdMemberResponse(HouseholdMemberInDB):
    pass 