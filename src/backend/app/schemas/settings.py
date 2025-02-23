from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

# List of supported locales and currencies
SUPPORTED_LOCALES = ["en-US", "en-GB", "de-DE"]
SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP"]

class SettingsBase(BaseModel):
    """Base settings schema with validation."""
    ui_locale: str = Field(
        default="en-US",
        description="The locale used for UI elements",
        pattern="^[a-z]{2}-[A-Z]{2}$"  # Format: xx-XX
    )
    number_locale: str = Field(
        default="en-US",
        description="The locale used for number and date formatting",
        pattern="^[a-z]{2}-[A-Z]{2}$"  # Format: xx-XX
    )
    currency: str = Field(
        default="USD",
        description="The default currency for monetary values",
        min_length=3,
        max_length=3
    )

    @Field.validator("ui_locale", "number_locale")
    def validate_locale(cls, v):
        if v not in SUPPORTED_LOCALES:
            raise ValueError(f"Locale {v} not supported. Must be one of: {', '.join(SUPPORTED_LOCALES)}")
        return v

    @Field.validator("currency")
    def validate_currency(cls, v):
        if v not in SUPPORTED_CURRENCIES:
            raise ValueError(f"Currency {v} not supported. Must be one of: {', '.join(SUPPORTED_CURRENCIES)}")
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

    @Field.validator("ui_locale", "number_locale")
    def validate_locale(cls, v):
        if v is not None and v not in SUPPORTED_LOCALES:
            raise ValueError(f"Locale {v} not supported. Must be one of: {', '.join(SUPPORTED_LOCALES)}")
        return v

    @Field.validator("currency")
    def validate_currency(cls, v):
        if v is not None and v not in SUPPORTED_CURRENCIES:
            raise ValueError(f"Currency {v} not supported. Must be one of: {', '.join(SUPPORTED_CURRENCIES)}")
        return v

class Settings(SettingsBase):
    """Schema for settings responses, includes all fields plus id and timestamps."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 