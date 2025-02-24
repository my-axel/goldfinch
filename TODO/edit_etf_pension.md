# ETF Pension Edit Page Enhancement

## Backend Tasks

### Database Changes
- [x] Add status management to pension_etf table
  * Create new enum PensionStatus in app/models/enums.py (ACTIVE, PAUSED)
  * Add status column to pension_etf table with default ACTIVE
  * Add paused_at and resume_at columns to pension_etf table (nullable)
  * Create database migration
  * Update pension_etf model

### Schema Updates
- [x] Update pension ETF schemas
  * Add status field to PensionETFBase
  * Add paused_at and resume_at to PensionETFResponse
  * Create new PensionStatusUpdate schema for status changes
  * Update PensionETFUpdate schema

### API Endpoints
- [x] Add pension status management endpoint
  * Implement PUT /api/v1/pension/etf/{id}/status endpoint
  * Add validation for resume_date when status changes to active
  * Update contribution calculation logic to respect paused periods

- [x] Add pension statistics endpoint
  * Implement GET /api/v1/pension/etf/{id}/statistics endpoint
  * Calculate total invested amount
  * Calculate current value based on ETF price
  * Calculate performance metrics (total return, annual return)
  * Aggregate contribution history
  * Aggregate value history
  * Add proper error handling

### CRUD Updates
- [x] Update pension_etf CRUD operations
  * Add status handling to create method
  * Add status handling to update method
  * Update contribution calculation to skip paused periods
  * Add methods for status management

## Frontend Tasks

### State Management
- [x] Extend PensionContext
  * Add pauseEtfPension function
  * Add resumeEtfPension function
  * Add getPensionStatistics function
  * Add loading states for new functions
  * Add error handling for new functions

### Layout Implementation
- [x] Create new layout structure
  * Implement two-column grid layout
  * Add responsive design for mobile view
  * Style header section with title and description
  * Add loading states and skeletons
  * Fix infinite update loop in useEffect
  * Improve card alignment and grouping

### Basic Information Section
- [x] Update EditETFPensionForm component
  * Keep existing fields (name, ETF selection)
  * Add status indicator
  * Add pause/resume button
  * Style according to current design system
  * Add proper validation

### Contribution Management Section
- [ ] Enhance contribution plan management
  * Keep existing contribution step functionality
  * Add one-time investment button
  * Integrate existing OneTimeInvestmentModal
  * Add contribution notes/comments field
  * Style according to current design system

### Status Management
- [x] Implement pause/resume functionality
  * Create PauseConfirmationModal component
  * Create ResumeDateModal component
  * Add status indicators
  * Implement status change handlers
  * Add proper validation
  * Add success/error notifications

### Charts Implementation
- [ ] Set up recharts
  * Add recharts dependency
  * Create shared chart components (tooltip, legend)
  * Add responsive chart wrapper
  * Create chart theme matching current design

- [ ] Implement ContributionHistoryChart
  * Create bar chart showing all contributions
  * Add hover tooltips with exact values
  * Add proper date formatting
  * Add loading state
  * Style according to current design system

- [ ] Implement ValueDevelopmentChart
  * Create line chart showing ETF value over time
  * Add hover tooltips with exact values
  * Add proper date and currency formatting
  * Add loading state
  * Style according to current design system

- [ ] Implement ContributionPlanChart
  * Create combined bar/line chart for planned contributions
  * Add hover tooltips with exact values
  * Add proper date and currency formatting
  * Add loading state
  * Style according to current design system

- [ ] Implement PerformanceMetricsChart
  * Create visualization for key metrics
  * Add hover tooltips with exact values
  * Add proper number formatting
  * Add loading state
  * Style according to current design system

### Statistics Section
- [x] Create ETFPensionStats component
  * Add next planned contribution display
  * Add total invested amount display
  * Add current value display
  * Add performance indicators
  * Add proper number formatting
  * Add loading state
  * Style according to current design system

### Error Handling
- [ ] Implement comprehensive error handling
  * Add error boundaries
  * Add error states for all components
  * Add proper error messages
  * Add retry functionality where appropriate
  * Add proper error logging

### Documentation
- [ ] Add proper documentation
  * Document new API endpoints
  * Document new components
  * Document state management changes
  * Add usage examples
  * Update README if necessary

### Final Tasks
- [ ] Code cleanup
  * Remove unused code
  * Optimize imports
  * Check for proper typing
  * Ensure consistent code style
  * Add proper comments where needed 