# ETF Projections Enhancement Draft

## Overview
Move ETF projection calculations from frontend to backend for improved performance and consistency.

## Current State
- ETF projections are currently calculated in the frontend
- Frontend uses settings-based rates for calculations
- Moving calculations to backend could improve performance

## Proposed Changes

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
1. Improved performance by moving calculations to backend
2. Consistent projection handling across pension types
3. Reduced frontend complexity
4. Easier maintenance of projection logic in one place

### Technical Considerations
1. Ensure projection results match current frontend calculations
2. Consider caching for performance optimization
3. Plan frontend migration to use new endpoint
4. Add proper error handling and validation

## Next Steps
1. Review current frontend projection implementation
2. Design detailed technical specification
3. Plan frontend migration strategy
4. Create full implementation plan 