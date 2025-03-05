# Company Pension Implementation Plan

## 1. Model & Database Layer (2 days)

### Database Tasks
#### Modify Existing
- [x] Update PensionCompany model in `src/backend/app/models/pension_company.py`
  - [x] Remove employer matching and vesting fields
  - [x] Add contribution_amount and frequency fields
  - [x] Add latest_statement_date field
  - [x] Update indexes for new fields
- [x] Update existing migrations
  - [x] Remove employer matching and vesting columns
  - [x] Add new fields to company_pensions table
  - [x] Update existing indexes

#### Create New
- [x] Create migration file for extra contributions
  - [x] Create company_pension_extra_contributions table
  - [x] Add foreign key constraints to company_pensions
  - [x] Add check constraints for positive amounts
  - [x] Add composite index (pension_id, year)
- [x] Create migration file for projections
  - [x] Create company_pension_projections table
  - [x] Add foreign key constraints to company_pensions
  - [x] Add check constraints for positive amounts
  - [x] Add index for pension_id
- [x] Add database triggers
  - [x] Create updated_at trigger for all tables
  - [x] Create validation trigger for positive contributions

### TypeScript Model Tasks
#### Modify Existing
- [x] Update CompanyPension interface in `src/frontend/types/pension.ts`
  - [x] Remove employer matching and vesting fields
  - [x] Add contribution structure (amount, frequency)
  - [x] Add statement information
  - [x] Update existing fields to match new model
- [x] Update CompanyPensionFormData in `src/frontend/types/pension-form.ts`
  - [x] Remove employer matching form fields
  - [x] Add contribution amount and frequency fields
  - [x] Update validation rules

#### Create New
- [x] Create new types in `src/frontend/types/pension.ts`
  - [x] Create ExtraContribution type
    ```typescript
    interface ExtraContribution {
      id: number
      pension_id: number
      amount: number
      date: Date
      note?: string
    }
    ```
  - [x] Create RetirementProjection type
    ```typescript
    interface RetirementProjection {
      id: number
      pension_id: number
      retirement_age: number
      monthly_payout: number
      total_capital: number
    }
    ```
  - [x] Add utility types for form state

## 2. Backend Implementation (2 days)

### FastAPI Model Tasks
#### Modify Existing
- [x] Update PensionCompanyBase in `src/backend/app/schemas/pension_company.py`
  - [x] Remove employer matching fields
  - [x] Add contribution fields (amount, frequency)
  - [x] Add statement information
  - [x] Update validation rules
- [x] Update PensionCompanyResponse
  - [x] Add extra_contributions field
  - [x] Add retirement_projections field

#### Create New
- [x] Create new models in `src/backend/app/schemas/pension_company.py`
  - [x] Create ExtraContribution model with validations
  - [x] Create RetirementProjection model with validations
  - [x] Add field validations for positive amounts

### API Endpoint Tasks
#### Modify Existing
- [x] Update existing endpoints in `src/backend/app/api/v1/endpoints/pension/company.py`
  - [x] Update create endpoint for simplified model
  - [x] Update update endpoint for simplified model
  - [x] Update response models

#### Create New
- [x] Create new endpoints for extra contributions
  - [x] Add POST endpoint for adding extra contribution
  - [x] Add GET endpoint for listing contributions
  - [x] Add DELETE endpoint for removing contribution
- [x] Create new endpoints for projections
  - [x] Add POST endpoint for creating projection
  - [x] Add GET endpoint for retrieving projections
  - [x] Add UPDATE endpoint for modifying projection

## 3. Frontend Implementation (2-3 days)

### Component Tasks
#### Modify Existing
- [x] Update CompanyPensionContent in `src/frontend/components/pension/PensionList.tsx`
  - [x] Remove employer matching display
  - [x] Add contribution display
  - [x] Add projection display
  - [x] Add "Yearly Investment" button
  - [x] Update styling
- [x] Update PensionContext in `src/frontend/context/PensionContext.tsx`
  - [x] Add methods for extra contributions
  - [x] Add methods for projections
  - [x] Add method for yearly investment
  - [x] Update existing methods for simplified model

#### Create New
- [x] Create new form components (following ETF pension pattern)
  - [x] Create CompanyPensionBasicForm
    - [x] Add name input
    - [x] Add employer input
    - [x] Add start date picker
    - [x] Add notes field
  - [x] Create CompanyPensionContributionForm
    - [x] Add contribution amount input
    - [x] Add frequency selector
  - [x] Create CompanyPensionProjectionForm
    - [x] Add retirement age input (based on company information)
    - [x] Add monthly payout input (from company statement)
    - [x] Add total capital input (from company statement)
    - [x] Add simple projection display
  - [x] Create YearlyInvestmentModal
    - [x] Add amount input
    - [x] Add month/year picker
    - [x] Add confirmation button
  - [x] Create ContributionHistoryCard
    - [x] Create table with columns:
      - [x] Year
      - [x] Month
      - [x] Amount
      - [x] Date
      - [x] Note (if any)
    - [x] Group entries by year and month
    - [x] Add sorting by date
  - [x] Create ProjectionsCard
    - [x] Display retirement projections
    - [x] Sort by retirement age
    - [x] Format currency values
  - [x] Create ExplanationCard
    - [x] Add help text for new pension:
      ```text
      Creating a Company Pension
      ------------------------
      Enter the basic information about your company pension plan.
      The contribution amount and frequency help you track your
      regular investments. Add the latest projection values from
      your company's pension statement to keep track of your
      expected retirement benefits.
      ```
    - [x] Add help text for editing:
      ```text
      Managing Your Company Pension
      --------------------------
      Review and update your pension details based on the latest
      statement from your company. You can add yearly investments
      when you make additional contributions. The contribution
      history shows all your past investments by month.
      
      The projection values should reflect the latest estimates
      provided by your company's pension plan statement.
      ```
  - [x] Add validation
  - [x] Add error handling
  - [x] Style components using shadcn/ui

### Page Tasks
#### Create New Pages
- [x] Create AddCompanyPensionPage
  - [x] Implement layout
  - [x] Add form section
    - [x] Basic information card
    - [x] Contribution settings card
    - [x] Retirement projection card
  - [x] Add explanation section in right column
    - [x] Help text card
    - [x] Examples card
    - [x] Projection chart card
  - [x] Add form submission
    - [x] Validation handling
    - [x] Success redirect to pension list
    - [x] Error handling with toast

- [x] Create EditCompanyPensionPage
  - [x] Implement layout
  - [x] Add form section
    - [x] Basic information card
    - [x] Contribution settings card
    - [x] Retirement projection card
    - [x] Contribution history card
  - [x] Add explanation section in right column
    - [x] Help text card
    - [x] Statistics card
    - [x] Projection chart card
  - [x] Add "Yearly Investment" button
  - [x] Add form submission
    - [x] Validation handling
    - [x] Success redirect to pension list
    - [x] Error handling with toast

#### Modify Existing
- [x] Update PensionTypeSelectionModal
  - [x] Update company pension description
  - [x] Add navigation to new company pension page

### Navigation & State Management
- [x] Implement route handling
  - [x] Add route for new company pension
  - [x] Add route for edit company pension
  - [x] Add route guards and validation
- [x] Implement state management
  - [x] Add yearly investment state
  - [x] Add form persistence
  - [x] Add loading states
  - [x] Add error states

## 4. Documentation & Final Steps (1 day)

### Documentation Tasks
- [x] Update API documentation
  - [x] Document new endpoints
  - [x] Update existing endpoint docs
  - [x] Document new models
- [x] Update frontend documentation
  - [x] Document new components
  - [x] Update existing docs
  - [x] Document new types
- [x] Update PROGRESS.md
  - [x] Add completed features
  - [x] Update completion percentage

### Final Review Tasks
- [x] Manual testing
  - [x] Test form interactions
  - [x] Test API endpoints
  - [x] Test error handling
  - [x] Verify data consistency
- [x] Code review
  - [x] Check code style
  - [x] Review error handling
  - [x] Verify type safety

Total Estimated Time: 7 days

Note: This implementation follows the ETF pension pattern for form organization and state management but with a simplified contribution model. Instead of tracking ETF units or employer matching, we focus on basic contributions, extra contributions, and retirement projections. 