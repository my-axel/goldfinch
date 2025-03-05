# Value Development and Projection Chart Implementation

## Backend Implementation

### Database and Schema Updates
- [x] Update settings model:
  ```python
  class Settings(Base):
      # ... existing fields ...
      projection_pessimistic_rate = Column(Numeric(10, 4), nullable=False, default=4.0)
      projection_realistic_rate = Column(Numeric(10, 4), nullable=False, default=6.0)
      projection_optimistic_rate = Column(Numeric(10, 4), nullable=False, default=8.0)
  ```
- [x] Create database migration for new settings fields
- [x] Update settings Pydantic schemas
- [x] Add settings validation for rate ranges (0-15%)

### API Endpoints
- [x] Add projection rates to settings GET/PUT endpoints
- [x] Add basic error handling for projection calculations

## Frontend Implementation

### Settings Integration
- [x] Update settings interface:
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
- [x] Update settings context and API client
- [x] Add projection settings to settings page:
  - [x] Add "Investment Projections" section
  - [x] Add three sliders (0.1% step size)
  - [x] Add preview of projection values

### Data Processing
- [x] Create utility functions for projection calculations:
  - [x] Function to calculate compound interest with regular contributions
  - [x] Function to merge historical data with projections
  - [x] Function to calculate three projection scenarios
- [x] Add types for projection data:
  ```typescript
  interface ProjectionDataPoint {
    date: Date
    value: number
    isProjection: boolean
    scenarioType?: 'pessimistic' | 'realistic' | 'optimistic'
  }
  ```
- [x] Create data transformation utilities:
  - [x] Convert historical value data
  - [x] Calculate future values based on:
    - [x] Current portfolio value
    - [x] Planned contributions
    - [x] Selected return rates
    - [x] Time until retirement

### Chart Component Updates
- [x] Remove standalone ValueDevelopmentChart
- [x] Remove PerformanceMetricsChart
- [x] Create new CombinedProjectionChart component:
  - [x] Historical value line
  - [x] Three projection lines
  - [x] Contribution history visualization (area chart)
  - [x] Clear visual distinction between historical and projected data
  - [x] Interactive tooltips showing:
    - [x] Date
    - [x] Actual/Projected value
    - [x] Contribution amount (if any)
    - [x] Return rate (for projections)
  - [x] Highlight retirement date on the chart
  - [x] Option to toggle visibility of different scenarios
- [x] Add legend with:
  - [x] Historical value
  - [x] Planned contributions
  - [x] Three projection scenarios with their respective return rates
- [x] Add error boundary for chart component

### KPI and Context Components
- [x] Create ProjectionScenarioKPIs component:
  - [x] Display projected wealth at retirement for each scenario
  - [x] Show total contributions vs. projected returns
  - [x] Add visual indicators for each scenario (color-coded)
- [x] Create ProjectionContext component:
  - [x] Display current projection rate settings
  - [x] Add explanatory text about projection assumptions
  - [x] Include tips for interpreting the chart

### UI/UX Improvements
- [x] Update layout:
  - [x] Remove Performance section
  - [x] Adjust grid layout to 8:4 split (instead of 7:5) for better content hierarchy
  - [x] Add the projection chart section in the left column (8), and KPI and context information in the right column (4)
  - [x] Update section title to "Value Development and Projections"
  - [x] Use right column consistently for KPIs and explanatory content
  - [x] Display projection KPIs (projected wealth for each scenario) in right column
  - [x] Show context information (percentages per scenario from settings) in right column
- [x] Add visual indicators:
  - [x] Vertical line or marker for "today"
  - [x] Different background colors/patterns for historical vs. projected areas
- [x] Implement responsive design:
  - [x] Adjust chart height based on screen size
  - [x] Optimize for mobile view
  - [x] Handle touch interactions

### Chart Styling
- [x] Define color scheme:
  - [x] Historical value line: solid, prominent color
  - [x] Projection lines: 
    - [x] Pessimistic: warm/cautionary color
    - [x] Realistic: neutral/balanced color
    - [x] Optimistic: cool/positive color
- [x] Add grid lines and axes:
  - [x] Y-axis: currency values with appropriate formatting
  - [x] X-axis: dates with appropriate intervals
  - [x] Subtle grid lines for value reference

### Documentation
- [ ] Add technical documentation:
  - [ ] Projection calculation methodology
  - [ ] Component API
  - [ ] Settings configuration
- [ ] Update user documentation:
  - [ ] Explanation of projection scenarios
  - [ ] How to customize return rates
  - [ ] How to interpret the chart

## Current Project Structure

Goldfinch
├── app
│   ├── household
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── pension
│   │   ├── company
│   │   │   ├── [id]
│   │   │   │   └── edit
│   │   │   └── new
│   │   │       └── page.tsx
│   │   ├── etf
│   │   │   ├── [id]
│   │   │   │   ├── edit
│   │   │   │   └── page.tsx
│   │   │   └── new
│   │   │       └── page.tsx
│   │   ├── insurance
│   │   │   ├── [id]
│   │   │   │   └── edit
│   │   │   └── new
│   │   │       └── page.tsx
│   │   └── page.tsx
│   ├── settings
│   │   └── page.tsx
│   └── styles
│       └── globals.css
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── next-env.d.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── public
│   └── goldfinch_logo.jpg
├── README.md
├── src
│   ├── backend
│   │   ├── alembic
│   │   │   ├── env.py
│   │   │   ├── README
│   │   │   └── script.py.mako
│   │   ├── alembic.ini
│   │   ├── app
│   │   │   ├── api
│   │   │   │   └── v1
│   │   │   ├── core
│   │   │   │   ├── celery_app.py
│   │   │   │   ├── config.py
│   │   │   │   ├── currency.py
│   │   │   │   ├── logging.py
│   │   │   │   └── startup.py
│   │   │   ├── crud
│   │   │   │   ├── base.py
│   │   │   │   ├── etf.py
│   │   │   │   ├── etf_update.py
│   │   │   │   ├── household.py
│   │   │   │   ├── pension_company.py
│   │   │   │   ├── pension_etf.py
│   │   │   │   ├── pension_insurance.py
│   │   │   │   ├── settings.py
│   │   │   │   └── update_tracking.py
│   │   │   ├── db
│   │   │   │   ├── base_class.py
│   │   │   │   ├── base.py
│   │   │   │   └── session.py
│   │   │   ├── main.py
│   │   │   ├── models
│   │   │   │   ├── enums.py
│   │   │   │   ├── etf.py
│   │   │   │   ├── exchange_rate.py
│   │   │   │   ├── household.py
│   │   │   │   ├── pension_company.py
│   │   │   │   ├── pension_etf.py
│   │   │   │   ├── pension_insurance.py
│   │   │   │   ├── settings.py
│   │   │   │   ├── task.py
│   │   │   │   └── update_tracking.py
│   │   │   ├── schemas
│   │   │   │   ├── etf.py
│   │   │   │   ├── etf_update.py
│   │   │   │   ├── exchange_rate.py
│   │   │   │   ├── household.py
│   │   │   │   ├── pension_company.py
│   │   │   │   ├── pension_etf.py
│   │   │   │   ├── pension_insurance.py
│   │   │   │   ├── pension.py
│   │   │   │   ├── settings.py
│   │   │   │   └── task.py
│   │   │   ├── services
│   │   │   │   ├── etf_service.py
│   │   │   │   ├── exchange_rate.py
│   │   │   │   └── yfinance.py
│   │   │   └── tasks
│   │   │       ├── etf_pension.py
│   │   │       ├── etf.py
│   │   │       └── exchange_rates.py
│   │   ├── docs
│   │   │   ├── etf_service
│   │   │   │   ├── etf_service_deployment.md
│   │   │   │   ├── etf_service_internal.md
│   │   │   │   ├── etf_service.md
│   │   │   │   └── etf_service_security.md
│   │   │   ├── exchange_rates
│   │   │   │   ├── exchange_rates_internal.md
│   │   │   │   ├── exchange_rates.md
│   │   │   │   ├── exchange_rates_migration.md
│   │   │   │   └── exchange_rates_security.md
│   │   │   └── settings
│   │   │       ├── settings_deployment.md
│   │   │       └── settings.md
│   │   ├── logs
│   │   │   ├── api.log
│   │   │   ├── goldfinch.log
│   │   │   ├── models.log
│   │   │   ├── services.log
│   │   │   └── tasks.log
│   │   ├── README.md
│   │   ├── requirements.txt
│   │   └── setup.py
│   └── frontend
│       ├── app
│       │   └── pension
│       │       └── etf
│       │   └── components
│       │       ├── charts
│       │       │   ├── ChartErrorBoundary.tsx
│       │       │   ├── ChartLegend.tsx
│       │       │   ├── chart-theme.ts
│       │       │   ├── ChartTooltip.tsx
│       │       │   ├── ChartWrapper.tsx
│       │       │   ├── ContributionHistoryChart.tsx
│       │       │   ├── index.ts
│       │       │   ├── PerformanceMetricsChart.tsx
│       │       │   └── ValueDevelopmentChart.tsx
│       │       ├── common
│       │       ├── etf
│       │       │   └── ETFSearchCombobox.tsx
│       │       ├── household
│       │       │   ├── AddMemberDialog.tsx
│       │       │   ├── EditMemberDialog.tsx
│       │       │   ├── MemberForm.tsx
│       │       │   └── MemberList.tsx
│       │       ├── layout
│       │       │   ├── AppSidebar.tsx
│       │       │   ├── mode-toggle.tsx
│       │       │   └── theme-provider.tsx
│       │       ├── pension
│       │       │   ├── ETFPensionStats.tsx
│       │       │   ├── form
│       │       │   ├── OneTimeInvestmentModal.tsx
│       │       │   ├── PauseConfirmationDialog.tsx
│       │       │   ├── PensionList.tsx
│       │       │   ├── PensionTypeSelectionModal.tsx
│       │       │   └── ResumeDateDialog.tsx
│       │       └── ui
│       │           ├── alert-dialog.tsx
│       │           ├── badge.tsx
│       │           ├── button.tsx
│       │           ├── card.tsx
│       │           ├── checkbox.tsx
│       │           ├── command.tsx
│       │           ├── dialog.tsx
│       │           ├── dropdown-menu.tsx
│       │           ├── form.tsx
│       │           ├── input.tsx
│       │           ├── label.tsx
│       │           ├── popover.tsx
│       │           ├── radio-group.tsx
│       │           ├── select.tsx
│       │           ├── separator.tsx
│       │           ├── sheet.tsx
│       │           ├── sidebar.tsx
│       │           ├── skeleton.tsx
│       │           ├── sonner.tsx
│       │           ├── switch.tsx
│       │           ├── textarea.tsx
│       │           └── tooltip.tsx
│       ├── context
│       │   ├── ETFContext.tsx
│       │   ├── HouseholdContext.tsx
│       │   ├── PensionContext.tsx
│       │   └── SettingsContext.tsx
│       ├── docs
│       │   ├── charts.md
│       │   └── formatting.md
│       ├── hooks
│       │   ├── useApi.ts
│       │   ├── useDebounce.ts
│       │   └── use-mobile.ts
│       ├── lib
│       │   ├── api-client.ts
│       │   ├── contribution-plan.ts
│       │   ├── routes
│       │   │   ├── api
│       │   │   ├── constants.ts
│       │   │   ├── index.ts
│       │   │   ├── pages
│       │   │   └── types.ts
│       │   ├── routes.ts
│       │   ├── transforms.ts
│       │   ├── utils.ts
│       │   └── validations
│       │       └── pension.ts
│       ├── providers
│       │   └── AppProviders.tsx
│       └── types
│           ├── etf.ts
│           ├── household-helpers.ts
│           ├── household.ts
│           ├── pension-form.ts
│           ├── pension-helpers.ts
│           ├── pension-statistics.ts
│           └── pension.ts
├── tailwind.config.ts
└── tsconfig.json




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