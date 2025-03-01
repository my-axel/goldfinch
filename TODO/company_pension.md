# Company Pension Implementation Plan

## 1. Model & Database Layer (2 days)

### Database Tasks
#### Modify Existing
- [ ] Update PensionCompany model in `src/backend/app/models/pension_company.py`
  - [ ] Remove employer matching and vesting fields
  - [ ] Add contribution_amount and frequency fields
  - [ ] Add latest_statement_date field
  - [ ] Update indexes for new fields
- [ ] Update existing migrations
  - [ ] Remove employer matching and vesting columns
  - [ ] Add new fields to company_pensions table
  - [ ] Update existing indexes

#### Create New
- [ ] Create migration file for extra contributions
  - [ ] Create company_pension_extra_contributions table
  - [ ] Add foreign key constraints to company_pensions
  - [ ] Add check constraints for positive amounts
  - [ ] Add composite index (pension_id, year)
- [ ] Create migration file for projections
  - [ ] Create company_pension_projections table
  - [ ] Add foreign key constraints to company_pensions
  - [ ] Add check constraints for positive amounts
  - [ ] Add index for pension_id
- [ ] Add database triggers
  - [ ] Create updated_at trigger for all tables
  - [ ] Create validation trigger for positive contributions

### TypeScript Model Tasks
#### Modify Existing
- [ ] Update CompanyPension interface in `src/frontend/types/pension.ts`
  - [ ] Remove employer matching and vesting fields
  - [ ] Add contribution structure (amount, frequency)
  - [ ] Add statement information
  - [ ] Update existing fields to match new model
- [ ] Update CompanyPensionFormData in `src/frontend/types/pension-form.ts`
  - [ ] Remove employer matching form fields
  - [ ] Add contribution amount and frequency fields
  - [ ] Update validation rules

#### Create New
- [ ] Create new types in `src/frontend/types/pension.ts`
  - [ ] Create ExtraContribution type
    ```typescript
    interface ExtraContribution {
      id: number
      pension_id: number
      amount: number
      date: Date
      note?: string
    }
    ```
  - [ ] Create RetirementProjection type
    ```typescript
    interface RetirementProjection {
      id: number
      pension_id: number
      retirement_age: number
      monthly_payout: number
      total_capital: number
    }
    ```
  - [ ] Add utility types for form state

## 2. Backend Implementation (2 days)

### FastAPI Model Tasks
#### Modify Existing
- [ ] Update PensionCompanyBase in `src/backend/app/schemas/pension_company.py`
  - [ ] Remove employer matching fields
  - [ ] Add contribution fields (amount, frequency)
  - [ ] Add statement information
  - [ ] Update validation rules
- [ ] Update PensionCompanyResponse
  - [ ] Add extra_contributions field
  - [ ] Add retirement_projections field

#### Create New
- [ ] Create new models in `src/backend/app/schemas/pension_company.py`
  - [ ] Create ExtraContribution model with validations
  - [ ] Create RetirementProjection model with validations
  - [ ] Add field validations for positive amounts

### API Endpoint Tasks
#### Modify Existing
- [ ] Update existing endpoints in `src/backend/app/api/v1/endpoints/pension/company.py`
  - [ ] Update create endpoint for simplified model
  - [ ] Update update endpoint for simplified model
  - [ ] Update response models

#### Create New
- [ ] Create new endpoints for extra contributions
  - [ ] Add POST endpoint for adding extra contribution
  - [ ] Add GET endpoint for listing contributions
  - [ ] Add DELETE endpoint for removing contribution
- [ ] Create new endpoints for projections
  - [ ] Add POST endpoint for creating projection
  - [ ] Add GET endpoint for retrieving projections
  - [ ] Add UPDATE endpoint for modifying projection

## 3. Frontend Implementation (2-3 days)

### Component Tasks
#### Modify Existing
- [ ] Update CompanyPensionContent in `src/frontend/components/pension/PensionList.tsx`
  - [ ] Remove employer matching display
  - [ ] Add contribution display
  - [ ] Add projection display
  - [ ] Add "Yearly Investment" button
  - [ ] Update styling
- [ ] Update PensionContext in `src/frontend/context/PensionContext.tsx`
  - [ ] Add methods for extra contributions
  - [ ] Add methods for projections
  - [ ] Add method for yearly investment
  - [ ] Update existing methods for simplified model

#### Create New
- [ ] Create new form components (following ETF pension pattern)
  - [ ] Create CompanyPensionBasicForm
    - [ ] Add name input
    - [ ] Add employer input
    - [ ] Add start date picker
    - [ ] Add notes field
  - [ ] Create CompanyPensionContributionForm
    - [ ] Add contribution amount input
    - [ ] Add frequency selector
  - [ ] Create CompanyPensionProjectionForm
    - [ ] Add retirement age input (based on company information)
    - [ ] Add monthly payout input (from company statement)
    - [ ] Add total capital input (from company statement)
    - [ ] Add simple projection display
  - [ ] Create YearlyInvestmentModal
    - [ ] Add amount input
    - [ ] Add month/year picker
    - [ ] Add confirmation button
  - [ ] Create ContributionHistoryCard
    - [ ] Create table with columns:
      - [ ] Year
      - [ ] Month
      - [ ] Amount
      - [ ] Date
      - [ ] Note (if any)
    - [ ] Group entries by year and month
    - [ ] Add sorting by date
  - [ ] Create ExplanationCard
    - [ ] Add help text for new pension:
      ```text
      Creating a Company Pension
      ------------------------
      Enter the basic information about your company pension plan.
      The contribution amount and frequency help you track your
      regular investments. Add the latest projection values from
      your company's pension statement to keep track of your
      expected retirement benefits.
      ```
    - [ ] Add help text for editing:
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
  - [ ] Add validation
  - [ ] Add error handling
  - [ ] Style components using shadcn/ui

### Page Tasks
#### Create New Pages
- [ ] Create AddCompanyPensionPage
  - [ ] Implement 8/4 column layout
  - [ ] Add form section in left column
    - [ ] Basic information card
    - [ ] Contribution settings card
    - [ ] Retirement projection card
  - [ ] Add explanation section in right column
    - [ ] Help text card
    - [ ] Examples card
    - [ ] Projection chart card
  - [ ] Add form submission
    - [ ] Validation handling
    - [ ] Success redirect to pension list
    - [ ] Error handling with toast

- [ ] Create EditCompanyPensionPage
  - [ ] Implement 8/4 column layout
  - [ ] Add form section in left column
    - [ ] Basic information card
    - [ ] Contribution settings card
    - [ ] Retirement projection card
    - [ ] Contribution history card (read-only)
  - [ ] Add explanation section in right column
    - [ ] Help text card
    - [ ] Statistics card
    - [ ] Projection chart card
  - [ ] Add "Yearly Investment" button
  - [ ] Add form submission
    - [ ] Validation handling
    - [ ] Success redirect to pension list
    - [ ] Error handling with toast

#### Modify Existing
- [ ] Update PensionTypeSelectionModal
  - [ ] Update company pension description
  - [ ] Add navigation to new company pension page

### Navigation & State Management
- [ ] Implement route handling
  - [ ] Add route for new company pension
  - [ ] Add route for edit company pension
  - [ ] Add route guards and validation
- [ ] Implement state management
  - [ ] Add yearly investment state
  - [ ] Add form persistence
  - [ ] Add loading states
  - [ ] Add error states

## 4. Documentation & Final Steps (1 day)

### Documentation Tasks
- [ ] Update API documentation
  - [ ] Document new endpoints
  - [ ] Update existing endpoint docs
  - [ ] Document new models
- [ ] Update frontend documentation
  - [ ] Document new components
  - [ ] Update existing docs
  - [ ] Document new types
- [ ] Update PROGRESS.md
  - [ ] Add completed features
  - [ ] Update completion percentage

### Final Review Tasks
- [ ] Manual testing
  - [ ] Test form interactions
  - [ ] Test API endpoints
  - [ ] Test error handling
  - [ ] Verify data consistency
- [ ] Code review
  - [ ] Check code style
  - [ ] Review error handling
  - [ ] Verify type safety

Total Estimated Time: 7 days

Note: This implementation follows the ETF pension pattern for form organization and state management but with a simplified contribution model. Instead of tracking ETF units or employer matching, we focus on basic contributions, extra contributions, and retirement projections. 