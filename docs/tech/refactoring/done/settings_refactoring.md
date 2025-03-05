# Settings Page Refactoring

## 1. Container Width Fix
- [x] Update app layout container width in `app/layout.tsx`:
```typescript
// Current
<div className="mx-auto h-full w-full max-w-[1440px] py-8">

// New
<div className="mx-auto h-full w-full max-w-[1280px] py-8">
```

## 2. Backend Changes for Inflation Rate

### Model Updates
- [x] Update Settings model in `app/models/settings.py`:
```python
class Settings(Base):
    # ... existing fields ...
    inflation_rate = Column(Numeric(10, 4), nullable=False, default=2.0)
```

### Schema Updates
- [x] Update Settings schemas in `app/schemas/settings.py`:
```python
class SettingsBase(BaseModel):
    # ... existing fields ...
    inflation_rate: Decimal = Field(
        default=Decimal("2.0"),
        description="Annual inflation rate (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )
```

### Database Changes
- [x] Create new Alembic migration for adding inflation_rate:
```python
"""Add inflation rate to settings

Revision ID: xxxx
Revises: xxxx
Create Date: 2024-03-xx
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade() -> None:
    op.add_column('settings', sa.Column('inflation_rate', sa.Numeric(10, 4), nullable=False, server_default='2.0'))

def downgrade() -> None:
    op.drop_column('settings', 'inflation_rate')
```

## 3. Frontend Type Updates

### Type Definitions
- [x] Update Settings interface in `frontend/types/settings.ts`:
```typescript
export interface Settings {
    // ... existing fields ...
    inflation_rate: number;
}
```

### Context Updates
- [x] Update default settings in `frontend/context/SettingsContext.tsx`:
```typescript
const defaultSettings: FrontendSettings = {
    // ... existing fields ...
    inflation_rate: 2.0,
}
```

## 4. UI Implementation

### Layout Structure
- [x] Create grid layout with alternating form/explanation rows
- [x] Implement responsive design for smaller screens
- [x] Ensure proper spacing between sections

### General Preferences Section
- [x] Create Language Settings card and explanation

### Number & Currency Format Section
- [x] Create Format Settings card
- [x] Implement live preview in Explanation component
- [x] Add example values for different formats

### Investment Settings Section
- [x] Create Investment Settings card
- [x] Create reusable rate input component
- [x] Implement rate inputs using the new component
- [x] Create projection preview
- [x] Add inflation impact calculation
- [x] Add validation for rate relationships
- [x] Add loading states for rate inputs
- [x] Implement proper TypeScript types for rate changes

### Display Settings Section
- [x] Create Theme Settings card
- [x] Add theme preview explanation

### Form Validation
- [x] Implement form validation for all inputs
- [x] Add error messages
- [x] Ensure rate relationships are maintained (pessimistic ≤ realistic ≤ optimistic)

### Preview Components
- [x] Create number format preview component
- [x] Create projection preview component
- [x] Add inflation impact calculation

### State Management
- [x] Implement form state management
- [x] Add loading states
- [x] Handle API errors
- [x] Add success notifications
- [x] Remove unnecessary slider state (using direct settings values)

### Form Organization
- [x] Group related settings logically:
  - [x] Move currency settings next to number format
  - [x] Group all projection rates together
  - [x] Place inflation rate with projection settings
- [x] Add clear visual separation between groups
- [x] Ensure consistent spacing between form elements

## 6. Documentation

### Backend Documentation
- [x] Update API documentation
- [x] Document new inflation rate field
- [x] Update schema documentation

### Frontend Documentation
- [x] Document new components
- [x] Update type definitions
- [x] Add comments for complex calculations