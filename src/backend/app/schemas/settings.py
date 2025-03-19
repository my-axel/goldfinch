from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from decimal import Decimal
from pydantic import ConfigDict

# List of supported locales and currencies
SUPPORTED_LOCALES = ["en-US", "en-GB", "de-DE"]
SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP"]

# Projection rate constraints
MIN_PROJECTION_RATE = Decimal("0.0")
MAX_PROJECTION_RATE = Decimal("15.0")

class SettingsBase(BaseModel):
    """Base settings schema with validation."""
    ui_locale: str = Field(
        default="en-US",
        description="The locale used for UI elements",
        pattern="^[a-z]{2}-[A-Z]{2}$"  # Format: xx-XX
    )
    number_locale: str = Field(
        default="de-DE",
        description="The locale used for number and date formatting",
        pattern="^[a-z]{2}-[A-Z]{2}$"  # Format: xx-XX
    )
    currency: str = Field(
        default="EUR",
        description="The default currency for monetary values",
        min_length=3,
        max_length=3
    )
    projection_pessimistic_rate: Decimal = Field(
        default=Decimal("4.0"),
        description="Annual return rate for pessimistic projection scenario (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )
    projection_realistic_rate: Decimal = Field(
        default=Decimal("6.0"),
        description="Annual return rate for realistic projection scenario (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )
    projection_optimistic_rate: Decimal = Field(
        default=Decimal("8.0"),
        description="Annual return rate for optimistic projection scenario (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )
    state_pension_pessimistic_rate: Decimal = Field(
        default=Decimal("1.0"),
        description="Annual increase rate for pessimistic state pension scenario (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )
    state_pension_realistic_rate: Decimal = Field(
        default=Decimal("1.5"),
        description="Annual increase rate for realistic state pension scenario (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )
    state_pension_optimistic_rate: Decimal = Field(
        default=Decimal("2.0"),
        description="Annual increase rate for optimistic state pension scenario (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )
    inflation_rate: Decimal = Field(
        default=Decimal("2.0"),
        description="Annual inflation rate (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )

    @field_validator("ui_locale", "number_locale")
    @classmethod
    def validate_locale(cls, v: str) -> str:
        if v not in SUPPORTED_LOCALES:
            raise ValueError(f"Locale {v} not supported. Must be one of: {', '.join(SUPPORTED_LOCALES)}")
        return v

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        if v not in SUPPORTED_CURRENCIES:
            raise ValueError(f"Currency {v} not supported. Must be one of: {', '.join(SUPPORTED_CURRENCIES)}")
        return v

    @field_validator("projection_realistic_rate")
    @classmethod
    def validate_realistic_rate(cls, v: Decimal, values: dict) -> Decimal:
        pessimistic = values.data.get("projection_pessimistic_rate")
        if pessimistic is not None and v < pessimistic:
            raise ValueError("Realistic rate must be greater than or equal to pessimistic rate")
        return v

    @field_validator("projection_optimistic_rate")
    @classmethod
    def validate_optimistic_rate(cls, v: Decimal, values: dict) -> Decimal:
        realistic = values.data.get("projection_realistic_rate")
        if realistic is not None and v < realistic:
            raise ValueError("Optimistic rate must be greater than or equal to realistic rate")
        return v

    @field_validator("state_pension_realistic_rate")
    @classmethod
    def validate_state_pension_realistic_rate(cls, v: Decimal, values: dict) -> Decimal:
        pessimistic = values.data.get("state_pension_pessimistic_rate")
        if pessimistic is not None and v < pessimistic:
            raise ValueError("State pension realistic rate must be greater than or equal to pessimistic rate")
        return v

    @field_validator("state_pension_optimistic_rate")
    @classmethod
    def validate_state_pension_optimistic_rate(cls, v: Decimal, values: dict) -> Decimal:
        realistic = values.data.get("state_pension_realistic_rate")
        if realistic is not None and v < realistic:
            raise ValueError("State pension optimistic rate must be greater than or equal to realistic rate")
        return v

class SettingsCreate(SettingsBase):
    """Schema for creating new settings."""
    pass

class SettingsUpdate(BaseModel):
    """Schema for updating settings, all fields optional."""
    ui_locale: Optional[str] = Field(
        None,
        description="The locale used for UI elements",
        pattern="^[a-z]{2}-[A-Z]{2}$"
    )
    number_locale: Optional[str] = Field(
        None,
        description="The locale used for number and date formatting",
        pattern="^[a-z]{2}-[A-Z]{2}$"
    )
    currency: Optional[str] = Field(
        None,
        description="The default currency for monetary values",
        min_length=3,
        max_length=3
    )
    projection_pessimistic_rate: Optional[Decimal] = Field(
        None,
        description="Annual return rate for pessimistic projection scenario (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )
    projection_realistic_rate: Optional[Decimal] = Field(
        None,
        description="Annual return rate for realistic projection scenario (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )
    projection_optimistic_rate: Optional[Decimal] = Field(
        None,
        description="Annual return rate for optimistic projection scenario (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )
    state_pension_pessimistic_rate: Optional[Decimal] = Field(
        None,
        description="Annual increase rate for pessimistic state pension scenario (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )
    state_pension_realistic_rate: Optional[Decimal] = Field(
        None,
        description="Annual increase rate for realistic state pension scenario (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )
    state_pension_optimistic_rate: Optional[Decimal] = Field(
        None,
        description="Annual increase rate for optimistic state pension scenario (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )
    inflation_rate: Optional[Decimal] = Field(
        None,
        description="Annual inflation rate (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )

    @field_validator("ui_locale", "number_locale")
    @classmethod
    def validate_locale(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in SUPPORTED_LOCALES:
            raise ValueError(f"Locale {v} not supported. Must be one of: {', '.join(SUPPORTED_LOCALES)}")
        return v

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in SUPPORTED_CURRENCIES:
            raise ValueError(f"Currency {v} not supported. Must be one of: {', '.join(SUPPORTED_CURRENCIES)}")
        return v

    @field_validator("projection_realistic_rate")
    @classmethod
    def validate_realistic_rate(cls, v: Optional[Decimal], values: dict) -> Optional[Decimal]:
        if v is None:
            return v
        pessimistic = values.data.get("projection_pessimistic_rate")
        if pessimistic is not None and v < pessimistic:
            raise ValueError("Realistic rate must be greater than or equal to pessimistic rate")
        return v

    @field_validator("projection_optimistic_rate")
    @classmethod
    def validate_optimistic_rate(cls, v: Optional[Decimal], values: dict) -> Optional[Decimal]:
        if v is None:
            return v
        realistic = values.data.get("projection_realistic_rate")
        if realistic is not None and v < realistic:
            raise ValueError("Optimistic rate must be greater than or equal to realistic rate")
        return v

    @field_validator("state_pension_realistic_rate")
    @classmethod
    def validate_state_pension_realistic_rate(cls, v: Optional[Decimal], values: dict) -> Optional[Decimal]:
        if v is None:
            return v
        pessimistic = values.data.get("state_pension_pessimistic_rate")
        if pessimistic is not None and v < pessimistic:
            raise ValueError("State pension realistic rate must be greater than or equal to pessimistic rate")
        return v

    @field_validator("state_pension_optimistic_rate")
    @classmethod
    def validate_state_pension_optimistic_rate(cls, v: Optional[Decimal], values: dict) -> Optional[Decimal]:
        if v is None:
            return v
        realistic = values.data.get("state_pension_realistic_rate")
        if realistic is not None and v < realistic:
            raise ValueError("State pension optimistic rate must be greater than or equal to realistic rate")
        return v

class Settings(SettingsBase):
    """Schema for settings responses, includes all fields plus id and timestamps."""
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True) 