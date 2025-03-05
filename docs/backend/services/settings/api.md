# Settings API Documentation

## Overview

The Settings API provides endpoints for managing user preferences related to localization and formatting. It handles locale settings for UI elements, number formatting, and currency display.

## Features

- Global settings management
- Locale-aware number formatting
- Currency display preferences
- Automatic defaults for new users
- Settings persistence and synchronization

## Supported Settings

### Locales

The service supports the following locales:
1. `en-US` - English (United States)
2. `en-GB` - English (United Kingdom)
3. `de-DE` - German (Germany)

### Currencies

The service supports the following currencies:
1. `USD` - US Dollar
2. `EUR` - Euro
3. `GBP` - British Pound

## API Endpoints

### Get Current Settings

```http
GET /api/v1/settings
```

Returns the current global settings. Creates and returns default settings if none exist.

**Response**
```json
{
    "id": 1,
    "ui_locale": "en-US",
    "number_locale": "de-DE",
    "currency": "EUR",
    "created_at": "2024-03-21T10:00:00Z",
    "updated_at": "2024-03-21T10:00:00Z"
}
```

### Update Settings

```http
PUT /api/v1/settings
```

Updates the global settings. Creates default settings first if none exist.

**Request Body**
```json
{
    "ui_locale": "de-DE",
    "number_locale": "de-DE",
    "currency": "EUR"
}
```

All fields are optional. Only provided fields will be updated.

**Response**
```json
{
    "id": 1,
    "ui_locale": "de-DE",
    "number_locale": "de-DE",
    "currency": "EUR",
    "created_at": "2024-03-21T10:00:00Z",
    "updated_at": "2024-03-21T10:05:00Z"
}
```

## Data Models

### Settings Model
```python
class Settings(Base):
    """Global application settings."""
    id: int
    ui_locale: str  # Default: "en-US"
    number_locale: str  # Default: "en-US"
    currency: str  # Default: "USD"
    inflation_rate: Decimal  # Default: 2.0
    projection_pessimistic_rate: Decimal  # Default: 2.0
    projection_realistic_rate: Decimal  # Default: 5.0
    projection_optimistic_rate: Decimal  # Default: 8.0
    created_at: datetime
    updated_at: datetime
```

### Settings Schema
```python
class SettingsBase(BaseModel):
    """Base settings schema with validation."""
    ui_locale: str = Field(
        default="en-US",
        pattern="^[a-z]{2}-[A-Z]{2}$"
    )
    number_locale: str = Field(
        default="de-DE",
        pattern="^[a-z]{2}-[A-Z]{2}$"
    )
    currency: str = Field(
        default="EUR",
        min_length=3,
        max_length=3
    )
    inflation_rate: Decimal = Field(
        default=Decimal("2.0"),
        description="Annual inflation rate (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )
    projection_pessimistic_rate: Decimal = Field(
        default=Decimal("2.0"),
        description="Annual return rate for pessimistic scenario (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )
    projection_realistic_rate: Decimal = Field(
        default=Decimal("5.0"),
        description="Annual return rate for realistic scenario (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )
    projection_optimistic_rate: Decimal = Field(
        default=Decimal("8.0"),
        description="Annual return rate for optimistic scenario (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )
```

### Response Example
```json
{
    "id": 1,
    "ui_locale": "en-US",
    "number_locale": "de-DE",
    "currency": "EUR",
    "inflation_rate": 2.0,
    "projection_pessimistic_rate": 2.0,
    "projection_realistic_rate": 5.0,
    "projection_optimistic_rate": 8.0,
    "created_at": "2024-03-21T10:00:00Z",
    "updated_at": "2024-03-21T10:00:00Z"
}
```

### Validation Rules

1. **Locale Format**
   - Must match pattern: `xx-XX` (e.g., "en-US", "de-DE")
   - Must be in supported locales list
   - Examples: "en-US", "en-GB", "de-DE"

2. **Currency Format**
   - Must be exactly 3 characters
   - Must be in supported currencies list
   - Examples: "USD", "EUR", "GBP"

3. **Rate Validation**
   - All rates must be between MIN_PROJECTION_RATE and MAX_PROJECTION_RATE
   - Pessimistic rate must be less than or equal to realistic rate
   - Realistic rate must be less than or equal to optimistic rate
   - Inflation rate must be non-negative
   - All rates are stored with 4 decimal places precision

## Usage Examples

### Retrieving Settings
```python
from app.crud.settings import settings

# Get current settings
current_settings = settings.get_settings(db)

# Create default settings if none exist
default_settings = settings.create_default_settings(db)
```

### Updating Settings
```python
from app.crud.settings import settings
from app.schemas.settings import SettingsUpdate

# Update specific fields
update_data = SettingsUpdate(
    currency="EUR",
    number_locale="de-DE"
)
updated_settings = settings.update_settings(db, obj_in=update_data)
```

## Error Handling

All endpoints follow this error response format:

```json
{
    "detail": "Error message describing what went wrong"
}
```

Common error codes:
- `422`: Validation Error (invalid locale or currency)
- `500`: Internal Server Error

### Validation Rules

1. **Locale Format**
   - Must match pattern: `xx-XX` (e.g., "en-US", "de-DE")
   - Must be in supported locales list
   - Examples: "en-US", "en-GB", "de-DE"

2. **Currency Format**
   - Must be exactly 3 characters
   - Must be in supported currencies list
   - Examples: "USD", "EUR", "GBP"

3. **Rate Validation**
   - All rates must be between MIN_PROJECTION_RATE and MAX_PROJECTION_RATE
   - Pessimistic rate must be less than or equal to realistic rate
   - Realistic rate must be less than or equal to optimistic rate
   - Inflation rate must be non-negative
   - All rates are stored with 4 decimal places precision

## Best Practices

1. **Default Values**
   - Always provide sensible defaults
   - Use "en-US" for new installations
   - Handle missing settings gracefully

2. **Validation**
   - Validate all user inputs
   - Check locale support in browser
   - Verify currency codes

3. **Error Handling**
   - Provide clear error messages
   - Fall back to defaults on error
   - Log validation failures

4. **Performance**
   - Cache settings where appropriate
   - Minimize database queries
   - Use bulk updates when possible 