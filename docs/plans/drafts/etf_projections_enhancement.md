# ETF Projections Enhancement Draft

## Overview
Add support for settings-based increase rates in ETF pension projections, similar to the state pension implementation.

## Current State
- ETF pensions currently use hardcoded increase rates for projections
- No connection to user settings
- Less flexibility for scenario planning

## Proposed Changes

### Settings Enhancement
```python
class PensionProjectionSettings(BaseModel):
    # Existing ETF settings
    etf_pessimistic_return: float
    etf_realistic_return: float
    etf_optimistic_return: float
    
    # New state pension settings
    state_pessimistic_increase: float
    state_realistic_increase: float
    state_optimistic_increase: float

```

### New Projection Endpoint
```python
@router.get("/api/v1/pensions/etf/{pension_id}/projections")
async def get_etf_projections(
    pension_id: int,
    db: Session = Depends(deps.get_db),
    settings: PensionProjectionSettings = Depends(deps.get_projection_settings)
) -> ProjectionResponse:
    """
    Calculate ETF projections using settings-based rates
    """
    # Implementation would:
    # 1. Get current ETF value and units
    # 2. Use settings-based rates for calculations
    # 3. Return projections for all scenarios
    pass
```

### Benefits
1. Consistent projection handling across pension types
2. User-configurable rates
3. More flexible scenario planning
4. Easier comparison between pension types

### Technical Considerations
1. Keep existing projection logic for backward compatibility
2. Add new endpoint for settings-based calculations
3. Consider caching for performance
4. Add migration path for existing implementations

## Next Steps
1. Review current ETF projection implementation
2. Design detailed technical specification
3. Plan migration strategy
4. Create full implementation plan 