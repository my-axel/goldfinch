# Settings Enhancement Plan: Interest Rate Scenarios

> <details>
> <summary><strong>🤖 AI Assistant Guide</strong></summary>
>
> ## Purpose
> This plan outlines the enhancement of the settings section to support multiple pension type interest rates using a new grid layout.
>
> ## Implementation Process
> 1. Create new grid layout for interest rates
> 2. Implement state pension rates
> 3. Refactor existing projection rates
>
> ## Critical Guidelines
> 1. Maintain clear separation between pension type rates
> 2. Use consistent UI patterns
> 3. Ensure proper form validation
> </details>

## Overview
**Feature**: Settings Enhancement for Interest Rates
**Type**: Frontend
**Duration**: 2-3 days
**Status**: 📝 Not Started
**Priority**: High
**Related Plan**: [Frontend Core Implementation](frontend_core_implementation.md)

## Description
Enhance the settings section to support multiple pension type interest rates using a new grid layout. This includes refactoring the existing projection rates and adding new state pension rates.

## Important Rules & Guidelines
- Follow formatting best practices for rate inputs
- Use consistent validation patterns
- Maintain clear visual separation between rate types
- Use proper form reset patterns
- Follow existing validation rules for rate relationships

## Requirements

### Data Model Updates
```typescript
// src/frontend/types/settings.ts
export interface Settings {
  // Existing fields
  projection_pessimistic_rate: number;
  projection_realistic_rate: number;
  projection_optimistic_rate: number;
  
  // New state pension fields
  state_pension_pessimistic_rate: number;
  state_pension_realistic_rate: number;
  state_pension_optimistic_rate: number;
}

// Constants
const MIN_RATE = 0;
const MAX_RATE = 15;
```

### UI Components
1. **Interest Rate Grid**
   - Card layout with title "Interest Rate Scenarios"
   - Row headers: "ETF Investment Rates", "State Pension Rates"
   - Column headers: "Pessimistic", "Realistic", "Optimistic"
   - RateInput in each cell with proper validation

2. **RateInput Requirements**
   - Show percentage symbol
   - Validate range (0-15) based on backend constraints
   - Format to one decimal place
   - Show error state
   - Validate rate relationships (pessimistic ≤ realistic ≤ optimistic)

## Implementation Steps

### 1. Backend Changes

#### Model Updates
```python
# src/backend/app/models/settings.py
class Settings(Base):
    # Existing fields
    projection_pessimistic_rate = Column(Numeric(10, 4), nullable=False, default=4.0)
    projection_realistic_rate = Column(Numeric(10, 4), nullable=False, default=6.0)
    projection_optimistic_rate = Column(Numeric(10, 4), nullable=False, default=8.0)
    
    # New fields
    state_pension_pessimistic_rate = Column(Numeric(10, 4), nullable=False, default=2.0)
    state_pension_realistic_rate = Column(Numeric(10, 4), nullable=False, default=3.0)
    state_pension_optimistic_rate = Column(Numeric(10, 4), nullable=False, default=4.0)
```

#### Schema Updates
```python
# src/backend/app/schemas/settings.py

# Update constants section
MIN_PROJECTION_RATE = Decimal("0.0")
MAX_PROJECTION_RATE = Decimal("15.0")

class SettingsBase(BaseModel):
    # Existing fields
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
    
    # New fields
    state_pension_pessimistic_rate: Decimal = Field(
        default=Decimal("2.0"),
        description="Annual increase rate for pessimistic state pension scenario (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )
    state_pension_realistic_rate: Decimal = Field(
        default=Decimal("3.0"),
        description="Annual increase rate for realistic state pension scenario (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )
    state_pension_optimistic_rate: Decimal = Field(
        default=Decimal("4.0"),
        description="Annual increase rate for optimistic state pension scenario (in %)",
        ge=MIN_PROJECTION_RATE,
        le=MAX_PROJECTION_RATE
    )

    # Add new validators for state pension rates
    @field_validator("state_pension_realistic_rate")
    @classmethod
    def validate_state_pension_realistic_rate(cls, v: Decimal, values: dict) -> Decimal:
        pessimistic = values.data.get("state_pension_pessimistic_rate")
        if pessimistic is not None and v < pessimistic:
            raise ValueError("Realistic rate must be greater than or equal to pessimistic rate")
        return v

    @field_validator("state_pension_optimistic_rate")
    @classmethod
    def validate_state_pension_optimistic_rate(cls, v: Decimal, values: dict) -> Decimal:
        realistic = values.data.get("state_pension_realistic_rate")
        if realistic is not None and v < realistic:
            raise ValueError("Optimistic rate must be greater than or equal to realistic rate")
        return v
```

#### Migration Steps
1. Create a new Alembic migration:
```bash
alembic revision -m "add_state_pension_rates"
```

2. Add migration logic:
```python
"""add_state_pension_rates

Revision ID: xxx
Revises: xxx
Create Date: 2024-03-21 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Add new columns with defaults
    op.add_column('settings', sa.Column('state_pension_pessimistic_rate', 
                                      sa.Numeric(10, 4), 
                                      nullable=False, 
                                      server_default='2.0'))
    op.add_column('settings', sa.Column('state_pension_realistic_rate', 
                                      sa.Numeric(10, 4), 
                                      nullable=False, 
                                      server_default='3.0'))
    op.add_column('settings', sa.Column('state_pension_optimistic_rate', 
                                      sa.Numeric(10, 4), 
                                      nullable=False, 
                                      server_default='4.0'))

def downgrade():
    # Remove columns in reverse order
    op.drop_column('settings', 'state_pension_optimistic_rate')
    op.drop_column('settings', 'state_pension_realistic_rate')
    op.drop_column('settings', 'state_pension_pessimistic_rate')
```

3. Update CRUD operations:
```python
# src/backend/app/crud/settings.py
def create_default_settings(self, db: Session) -> Settings:
    """Create default settings if none exist."""
    existing = self.get_settings(db)
    if existing:
        return existing

    default_settings = SettingsCreate(
        ui_locale="en-US",
        number_locale="en-US",
        currency="USD",
        # Add default values for new fields
        state_pension_pessimistic_rate=Decimal("2.0"),
        state_pension_realistic_rate=Decimal("3.0"),
        state_pension_optimistic_rate=Decimal("4.0")
    )
    return self.create(db, obj_in=default_settings)
```

### 2. Grid Layout Component
- [ ] Create InterestRateGrid component
```typescript
// src/frontend/components/settings/InterestRateGrid.tsx
function InterestRateGrid({ settings, onUpdate }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Interest Rate Scenarios</CardTitle>
        <CardDescription>
          Configure growth rates for different investment types
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {/* Header row */}
          <div className="col-start-2 col-span-3 grid grid-cols-3 gap-4">
            <div>Pessimistic</div>
            <div>Realistic</div>
            <div>Optimistic</div>
          </div>
          
          {/* ETF Investment Rates row */}
          <div>ETF Investment Rates</div>
          <div className="col-span-3 grid grid-cols-3 gap-4">
            <RateInput
              label="Pessimistic"
              value={settings.projection_pessimistic_rate}
              onChange={(value) => onUpdate('projection_pessimistic_rate', value)}
              min={MIN_RATE}
              max={MAX_RATE}
              step={0.1}
            />
            <RateInput
              label="Realistic"
              value={settings.projection_realistic_rate}
              onChange={(value) => onUpdate('projection_realistic_rate', value)}
              min={MIN_RATE}
              max={MAX_RATE}
              step={0.1}
            />
            <RateInput
              label="Optimistic"
              value={settings.projection_optimistic_rate}
              onChange={(value) => onUpdate('projection_optimistic_rate', value)}
              min={MIN_RATE}
              max={MAX_RATE}
              step={0.1}
            />
          </div>
          
          {/* State Pension Rates row */}
          <div>State Pension Rates</div>
          <div className="col-span-3 grid grid-cols-3 gap-4">
            <RateInput
              label="Pessimistic"
              value={settings.state_pension_pessimistic_rate}
              onChange={(value) => onUpdate('state_pension_pessimistic_rate', value)}
              min={MIN_RATE}
              max={MAX_RATE}
              step={0.1}
            />
            <RateInput
              label="Realistic"
              value={settings.state_pension_realistic_rate}
              onChange={(value) => onUpdate('state_pension_realistic_rate', value)}
              min={MIN_RATE}
              max={MAX_RATE}
              step={0.1}
            />
            <RateInput
              label="Optimistic"
              value={settings.state_pension_optimistic_rate}
              onChange={(value) => onUpdate('state_pension_optimistic_rate', value)}
              min={MIN_RATE}
              max={MAX_RATE}
              step={0.1}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 3. Rate Validation and Error Handling

#### Frontend Validation
```typescript
// src/frontend/components/settings/useRateValidation.ts
interface RateValidationProps {
  rateType: 'projection' | 'state_pension';
  scenarioType: 'pessimistic' | 'realistic' | 'optimistic';
  newValue: number;
  settings: Settings;
}

export function useRateValidation() {
  const [rateErrors, setRateErrors] = useState<{[key: string]: string}>({});

  const validateRateRelationships = (
    rateType: 'projection' | 'state_pension',
    scenarioType: 'pessimistic' | 'realistic' | 'optimistic',
    newValue: number,
    settings: Settings
  ): boolean => {
    const prefix = rateType === 'projection' ? 'projection' : 'state_pension';
    const updatedValues = {
      pessimistic: scenarioType === 'pessimistic' ? newValue : settings[`${prefix}_pessimistic_rate`],
      realistic: scenarioType === 'realistic' ? newValue : settings[`${prefix}_realistic_rate`],
      optimistic: scenarioType === 'optimistic' ? newValue : settings[`${prefix}_optimistic_rate`]
    };

    const errorKey = `${prefix}_${scenarioType}`;

    if (scenarioType === 'pessimistic' && updatedValues.pessimistic > updatedValues.realistic) {
      setRateErrors({
        ...rateErrors,
        [errorKey]: `${rateType === 'projection' ? 'Investment' : 'State pension'} pessimistic rate cannot be higher than realistic rate`
      });
      return false;
    }

    if (scenarioType === 'realistic') {
      if (updatedValues.realistic < updatedValues.pessimistic) {
        setRateErrors({
          ...rateErrors,
          [errorKey]: `${rateType === 'projection' ? 'Investment' : 'State pension'} realistic rate cannot be lower than pessimistic rate`
        });
        return false;
      }
      if (updatedValues.realistic > updatedValues.optimistic) {
        setRateErrors({
          ...rateErrors,
          [errorKey]: `${rateType === 'projection' ? 'Investment' : 'State pension'} realistic rate cannot be higher than optimistic rate`
        });
        return false;
      }
    }

    if (scenarioType === 'optimistic' && updatedValues.optimistic < updatedValues.realistic) {
      setRateErrors({
        ...rateErrors,
        [errorKey]: `${rateType === 'projection' ? 'Investment' : 'State pension'} optimistic rate cannot be lower than realistic rate`
      });
      return false;
    }

    // Clear errors for the current type if validation passes
    if (rateErrors[errorKey]) {
      setRateErrors({
        ...rateErrors,
        [errorKey]: ''
      });
    }

    return true;
  };

  return { rateErrors, validateRateRelationships };
}

// Usage in InterestRateGrid component
const handleRateChange = (
  rateType: 'projection' | 'state_pension',
  scenarioType: 'pessimistic' | 'realistic' | 'optimistic',
  value: number
) => {
  if (validateRateRelationships(rateType, scenarioType, value, settings)) {
    const rateKey = `${rateType}_${scenarioType}_rate` as const;
    updateSettings({ [rateKey]: value });
  }
};
```

#### Backend Error Handling
```python
# src/backend/app/api/v1/endpoints/settings.py

@router.put("", response_model=Settings)
def update_settings(
    settings_update: SettingsUpdate,
    db: Session = Depends(get_db)
):
    """
    Update global settings.
    Creates default settings first if none exist.
    
    Validates:
    - Locale and currency support
    - Projection rate ranges (0-15%)
    - State pension rate ranges (0-15%)
    - Projection rate relationships (pessimistic ≤ realistic ≤ optimistic)
    - State pension rate relationships (pessimistic ≤ realistic ≤ optimistic)
    """
    try:
        # The Pydantic model will handle basic validation
        return settings.update_settings(db=db, obj_in=settings_update)
    except ValueError as e:
        # Make error messages more specific and user-friendly
        error_msg = str(e)
        if "state_pension" in error_msg.lower():
            error_msg = f"State pension {error_msg.lower()}"
        elif "projection" in error_msg.lower():
            error_msg = f"Investment {error_msg.lower()}"
        
        raise HTTPException(
            status_code=422,
            detail=error_msg
        )
    except InvalidOperation as e:
        # Handle decimal conversion errors
        raise HTTPException(
            status_code=422,
            detail=f"Invalid number format for rate values: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error updating settings: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Could not update settings"
        )
```

### 4. Testing
```python
# src/backend/app/tests/api/test_settings.py

def test_state_pension_rate_validation(client: TestClient):
    """Test state pension rate validation rules."""
    # Test pessimistic > realistic
    response = client.put("/api/v1/settings", json={
        "state_pension_pessimistic_rate": 5.0,
        "state_pension_realistic_rate": 4.0
    })
    assert response.status_code == 422
    assert "state pension realistic rate must be greater than" in response.json()["detail"].lower()

    # Test realistic > optimistic
    response = client.put("/api/v1/settings", json={
        "state_pension_realistic_rate": 8.0,
        "state_pension_optimistic_rate": 7.0
    })
    assert response.status_code == 422
    assert "state pension optimistic rate must be greater than" in response.json()["detail"].lower()

    # Test valid update
    response = client.put("/api/v1/settings", json={
        "state_pension_pessimistic_rate": 2.0,
        "state_pension_realistic_rate": 3.0,
        "state_pension_optimistic_rate": 4.0
    })
    assert response.status_code == 200
    data = response.json()
    assert data["state_pension_pessimistic_rate"] == 2.0
    assert data["state_pension_realistic_rate"] == 3.0
    assert data["state_pension_optimistic_rate"] == 4.0
```

### 5. Settings Integration
- [ ] Update settings page to use new grid layout
- [ ] Implement validation for both rate types
- [ ] Add error handling and loading states

### 6. Migration
- [ ] Create database migration for new fields
- [ ] Add default values for state pension rates
- [ ] Test all scenarios and validation rules

## Dependencies
- Existing settings components and validation
- Backend API changes
- Database migration

## Technical Notes

### Form Validation Rules
1. Value Range: 0-15% for all rates
2. Decimal Places: Maximum 1 decimal place
3. Rate Relationships:
   - Pessimistic ≤ Realistic ≤ Optimistic (for both types)
   - Each type's rates are validated independently

### Error Handling
```typescript
interface RateError {
  field: string;
  message: string;
  type: 'range' | 'relationship';
}

function handleRateUpdate(
  type: 'projection' | 'state_pension',
  scenario: 'pessimistic' | 'realistic' | 'optimistic',
  value: number
) {
  // Validate range
  if (value < MIN_RATE || value > MAX_RATE) {
    setError({
      field: `${type}_${scenario}_rate`,
      message: `Rate must be between ${MIN_RATE} and ${MAX_RATE}`,
      type: 'range'
    });
    return;
  }

  // Validate relationships
  const relationshipError = validateRateRelationships(type, scenario, value, settings);
  if (relationshipError) {
    setError({
      field: `${type}_${scenario}_rate`,
      message: relationshipError,
      type: 'relationship'
    });
    return;
  }

  // Update if valid
  updateSettings({ [`${type}_${scenario}_rate`]: value });
}
```

## Testing
```typescript
describe('InterestRateGrid', () => {
  it('validates rate relationships correctly', async () => {
    const { result } = renderHook(() => useRateValidation());
    
    // Test projection rates
    expect(result.current.validateRateRelationships(
      'projection',
      'realistic',
      5.0,
      {
        projection_pessimistic_rate: 6.0,
        projection_realistic_rate: 7.0,
        projection_optimistic_rate: 8.0
      }
    )).toBe('Realistic rate cannot be lower than pessimistic rate');
    
    // Test state pension rates
    expect(result.current.validateRateRelationships(
      'state_pension',
      'optimistic',
      3.0,
      {
        state_pension_pessimistic_rate: 2.0,
        state_pension_realistic_rate: 4.0,
        state_pension_optimistic_rate: 5.0
      }
    )).toBe('Optimistic rate cannot be lower than realistic rate');
  });
});
``` 