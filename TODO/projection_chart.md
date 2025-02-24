# Value Development and Projection Chart Implementation

## Backend Implementation

### Database and Schema Updates
- [ ] Update settings model:
  ```python
  class Settings(Base):
      # ... existing fields ...
      projection_pessimistic_rate = Column(Numeric(10, 4), nullable=False, default=4.0)
      projection_realistic_rate = Column(Numeric(10, 4), nullable=False, default=6.0)
      projection_optimistic_rate = Column(Numeric(10, 4), nullable=False, default=8.0)
  ```
- [ ] Create database migration for new settings fields
- [ ] Update settings Pydantic schemas
- [ ] Add settings validation for rate ranges (0-15%)

### API Endpoints
- [ ] Add projection rates to settings GET/PUT endpoints
- [ ] Add basic error handling for projection calculations

## Frontend Implementation

### Settings Integration
- [ ] Update settings interface:
  ```typescript
  interface Settings {
    // ... existing fields ...
    projection_rates: {
      pessimistic: number
      realistic: number
      optimistic: number
    }
  }
  ```
- [ ] Add projection settings to settings page:
  - [ ] Add "Investment Projections" section
  - [ ] Add three sliders (0.1% step size)
  - [ ] Add preview of projection values
- [ ] Update settings context and API client

### Data Processing
- [ ] Create utility functions for projection calculations:
  - [ ] Function to calculate compound interest with regular contributions
  - [ ] Function to merge historical data with projections
  - [ ] Function to calculate three projection scenarios
- [ ] Add types for projection data:
  ```typescript
  interface ProjectionDataPoint {
    date: Date
    value: number
    isProjection: boolean
    scenarioType?: 'pessimistic' | 'realistic' | 'optimistic'
  }
  ```
- [ ] Create data transformation utilities:
  - [ ] Convert historical value data
  - [ ] Calculate future values based on:
    - [ ] Current portfolio value
    - [ ] Planned contributions
    - [ ] Selected return rates
    - [ ] Time until retirement

### Chart Component Updates
- [ ] Remove standalone ValueDevelopmentChart
- [ ] Remove PerformanceMetricsChart
- [ ] Create new CombinedProjectionChart component:
  - [ ] Historical value line
  - [ ] Three projection lines
  - [ ] Clear visual distinction between historical and projected data
  - [ ] Interactive tooltips showing:
    - [ ] Date
    - [ ] Actual/Projected value
    - [ ] Contribution amount (if any)
    - [ ] Return rate (for projections)
- [ ] Add legend with:
  - [ ] Historical value
  - [ ] Planned contributions
  - [ ] Three projection scenarios with their respective return rates
- [ ] Add error boundary for chart component

### UI/UX Improvements
- [ ] Update layout:
  - [ ] Remove Performance section
  - [ ] Make chart section full width (12 columns)
  - [ ] Update section title to "Value Development and Projections"
- [ ] Add visual indicators:
  - [ ] Vertical line or marker for "today"
  - [ ] Different background colors/patterns for historical vs. projected areas
- [ ] Implement responsive design:
  - [ ] Adjust chart height based on screen size
  - [ ] Optimize for mobile view
  - [ ] Handle touch interactions

### Chart Styling
- [ ] Define color scheme:
  - [ ] Historical value line: solid, prominent color
  - [ ] Projection lines: 
    - [ ] Pessimistic: warm/cautionary color
    - [ ] Realistic: neutral/balanced color
    - [ ] Optimistic: cool/positive color
- [ ] Add grid lines and axes:
  - [ ] Y-axis: currency values with appropriate formatting
  - [ ] X-axis: dates with appropriate intervals
  - [ ] Subtle grid lines for value reference

### Documentation
- [ ] Add technical documentation:
  - [ ] Projection calculation methodology
  - [ ] Component API
  - [ ] Settings configuration
- [ ] Update user documentation:
  - [ ] Explanation of projection scenarios
  - [ ] How to customize return rates
  - [ ] How to interpret the chart

## Future Enhancements (Optional)
- [ ] Add ability to compare different contribution scenarios
- [ ] Add inflation adjustment option
- [ ] Add risk metrics/confidence intervals
- [ ] Export chart data/image functionality
- [ ] Real-time scenario rate adjustments
- [ ] Performance optimizations for multiple pensions:
  - [ ] Redis caching system for calculations
  - [ ] Adaptive data point density
  - [ ] Web Worker implementation
  - [ ] Calculation queue manager
  - [ ] Progressive loading
  - [ ] Dashboard optimizations
  - [ ] Memory management
  - [ ] Debouncing for rate changes 