from pydantic import BaseModel, Field
from datetime import date
from uuid import UUID

class HouseholdMemberBase(BaseModel):
    first_name: str
    last_name: str
    birthday: date
    retirement_age_planned: int = Field(default=67, ge=40, le=100)
    retirement_age_possible: int = Field(default=63, ge=40, le=100)

class HouseholdMemberCreate(HouseholdMemberBase):
    pass

class HouseholdMember(HouseholdMemberBase):
    id: int

    class Config:
        from_attributes = True 