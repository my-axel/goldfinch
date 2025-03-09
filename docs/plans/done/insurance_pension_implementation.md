## Overview
**Feature**: Insurance Pension Implementation
**Duration**: 4-5 days
**Status**: ✅ Complete
**Priority**: High (Part of Milestone 2)

## Description
Complete reimplementation of the Insurance Pension module to manage insurance-based retirement products, following the successful patterns established in the Company Pension implementation. This feature will enable users to track policy values, monitor premium payments, and document policy terms and conditions. The existing UI will be replaced with a new implementation based on the Company Pension UI structure.

Important Implementation Notes:
- ✅ All monetary values are stored in EUR (consistent with other pension types)
- ✅ No automatic value calculations - all values come from user-entered statements
- ✅ Statements track historical development with user-provided projections
- ✅ Additional benefits track history (e.g., child benefits with specific durations)
- ✅ All pension types can be paused (contributions stop) but projections remain as entered

## Important Rules & Guidelines
- ✅ Rule 1: Use EnumSelect for all enum fields in forms
- ✅ Rule 2: Follow the form-reset-hook pattern for all forms
- ✅ Rule 3: Implement proper TypeScript discriminated unions for message types
- ✅ Rule 4: Use RORO pattern for all function implementations
- ✅ Rule 5: Follow the currency formatting rules for monetary values
- ✅ Rule 6: Follow existing Company Pension patterns for consistency

Reference docs:
- [Form Reset Hook Plan](docs/plans/active/form_reset_hook.md)
- [Currency System Plan](docs/plans/active/currency_system.md)

## Requirements

### Data Model
#### Required Fields
- ✅ name (string, required): Name of the insurance pension (e.g., "Riester-Rente")
- ✅ provider (string, required): Insurance company name
- ✅ type (enum, required): Type of insurance pension (e.g., Government-Supported, Company, Private)
- ✅ contract_number (string, optional): Policy or contract identification number
- ✅ start_date (date, required): Policy start date
- ✅ retirement_date (date, required): Expected retirement date
- ✅ guaranteed_interest (decimal, optional): Minimum guaranteed return rate
- ✅ expected_return (decimal, optional): Expected total return rate including non-guaranteed portions
- ✅ policy_term (object, optional): {
  duration_years?: number,        // Fixed term in years, if applicable
  end_date?: date,               // Specific end date, if applicable
  is_lifetime?: boolean          // Whether it's a lifetime policy
}

#### Contribution Details
- ✅ regular_contribution: {
  amount: decimal,              // Stored in EUR
  frequency: enum (Monthly, Quarterly, Yearly)
}
- ✅ additional_benefits: [{
  source: string,              // e.g., "Government", "Employer"
  amount: decimal,             // Stored in EUR
  frequency: enum (Monthly, Quarterly, Yearly, OneTime),
  description: string,         // e.g., "Child bonus", "Employer match"
  valid_from: date,           // Start date of the benefit
  valid_until: date,          // Optional end date (e.g., child benefit age limit)
  status: enum (Active, Paused, Ended)
}]

#### Statements
- ✅ statements: [{
  statement_date: date,           // Date of the statement
  current_value: decimal,         // Stored in EUR
  total_contributions: decimal,   // Total contributions up to this date, in EUR
  total_benefits: decimal,        // Total additional benefits received, in EUR
  projections: {
    with_contributions: {       // User-provided projections if continuing contributions
      value_at_retirement: decimal,
      monthly_payout: decimal,
      scenarios: [{             // User-defined return rate scenarios
        return_rate: decimal,   // No predefined rates
        value_at_retirement: decimal,
        monthly_payout: decimal
      }]
    },
    without_contributions: {    // User-provided projections if stopping contributions
      value_at_retirement: decimal,
      monthly_payout: decimal,
      scenarios: [{
        return_rate: decimal,
        value_at_retirement: decimal,
        monthly_payout: decimal
      }]
    }
  },
  costs: {                     // Yearly costs at time of statement
    amount: decimal,           // Stored in EUR
    percentage: decimal        // Optional, if costs are percentage-based
  }
}]

#### Future Features
1. **Policy Features**
   - [ ] Surrender value calculation
   - [ ] Death benefit amount
   - [ ] Disability coverage (if included)
   - [ ] Rider information

2. **Tax Treatment**
   - [ ] Tax-deferred growth
   - [ ] Tax-deductible contributions
   - [ ] Taxation of benefits
   - [ ] Special tax provisions

3. **Investment Options** (if applicable)
   - [ ] Investment strategy
   - [ ] Fund allocation
   - [ ] Risk profile

4. **Flexibility Features**
   - [ ] Contribution holidays
   - [ ] Partial withdrawals
   - [ ] Policy loans
   - [ ] Premium adjustment options

#### Validation Rules
- [x] All monetary values must be positive
- [x] Retirement date must be after start date
- [x] Statement dates must not be in the future
- [x] Return rates in scenarios must be reasonable (-10% to +10%)
- [x] Guaranteed interest rate must be less than or equal to expected return (if both provided)
- [x] Policy term must be valid (end date after start date, valid duration)

#### Unique Constraints & Indexes
- [x] Unique composite index on (member_id, provider, name) to prevent duplicate policies
- [x] Index on statement_date for efficient statement queries
- [x] Index on provider for quick provider-based lookups
- [x] Unique constraint on external_policy_id if provided by insurance company

#### Performance Considerations
- [x] Implement database-level constraints for data integrity
- [x] Use appropriate index types (B-tree for exact matches, GiST for range queries)
- [x] Consider partitioning for historical statements if they grow large
- [x] Implement proper cascading deletes for clean data management

### UI/UX (To Be Implemented)
Based on Company Pension UI structure but simplified to forms-only approach:

#### List View Card Component
**InsurancePensionCard**
- [x] Purpose: Display insurance pension summary in the pension list view, following the shared pension card pattern
- [x] Location:
  ```
  src/
    frontend/
      components/
        pension/
          insurance/
            InsurancePensionCard.tsx
            InsurancePensionCardSkeleton.tsx
  ```

Implementation:
```typescript
interface InsurancePensionCardProps {
  pension: InsurancePension;
  onEdit: (pension: InsurancePension) => void;
  onDelete: (id: number) => void;
}

function InsurancePensionContent({ pension }: { pension: InsurancePension }) {
  const { settings } = useSettings();
  const [formattedValues, setFormattedValues] = useState({
    currentValue: "0",
    contribution: "0"
  });

  // Client-side formatting to avoid hydration mismatches
  useEffect(() => {
    setFormattedValues({
      currentValue: formatCurrency(pension.current_value, {
        locale: settings.number_locale,
        currency: settings.currency,
        decimals: 0
      }).formatted,
      contribution: formatCurrency(pension.regular_contribution?.amount || 0, {
        locale: settings.number_locale,
        currency: settings.currency,
        decimals: 0
      }).formatted
    });
  }, [pension, settings]);

  const currentStep = getCurrentContributionStep(pension);
  const latestStatement = pension.statements?.[0];

  return (
    <>
      <div>
        <dt className="text-muted-foreground">Provider</dt>
        <dd>{pension.provider}</dd>
      </div>
      {currentStep && (
        <div>
          <dt className="text-muted-foreground">Current Contribution</dt>
          <dd>
            {formattedValues.contribution} {formatFrequency(currentStep.frequency)}
          </dd>
        </div>
      )}
      <div>
        <dt className="text-muted-foreground">Current Value</dt>
        <dd>{formattedValues.currentValue}</dd>
      </div>
      {latestStatement && (
        <div>
          <dt className="text-muted-foreground">Latest Statement</dt>
          <dd>
            {formatDisplayDate(latestStatement.statement_date)}
            {latestStatement.costs && (
              <span className="text-xs text-muted-foreground ml-2">
                ({formatCurrency(latestStatement.costs.amount, {
                  locale: settings.number_locale,
                  currency: settings.currency
                }).formatted} yearly costs)
              </span>
            )}
          </dd>
        </div>
      )}
    </>
  );
}
```

Features:
1. **Consistent Layout with Other Pension Cards**
   - [x] Uses the shared card structure from PensionList
   - [x] Same icon and action button placement
   - [x] Consistent typography and spacing

2. **Client-side Formatting**
   - [x] Handles all number and currency formatting client-side
   - [x] Uses the user's locale and currency settings
   - [x] Prevents hydration mismatches

3. **Key Information Display**
   - [x] Provider name and pension type
   - [x] Current contribution amount and frequency
   - [x] Current total value
   - [x] Latest statement date and yearly costs
   - [x] Status indicator (Active/Paused)

4. **Shared Functionality**
   - [x] Edit and delete actions
   - [x] Status management
   - [x] Loading states with skeleton
   - [x] Error handling

5. **Accessibility**
   - [x] ARIA labels for all interactive elements
   - [x] Proper heading structure
   - [x] Color contrast compliance
   - [x] Keyboard navigation support

6. **Responsive Design**
   - [x] Adapts to different screen sizes
   - [x] Maintains readability on mobile
   - [x] Consistent with other pension cards

7. **Type Safety**
   - [x] Strong TypeScript types
   - [x] Proper null handling
   - [x] Type guards for pension-specific fields

#### Form Structure
1. **Basic Information Card**
   - [x] Name and provider fields
   - [x] Type selection (EnumSelect)
   - [x] Start and retirement dates
   - [x] Contract number (optional)
   - [x] Interest rates section (collapsible, optional):
     - [x] Guaranteed interest
     - [x] Expected return
   - [x] Policy term section (collapsible, optional):
     - [x] Duration or end date
     - [x] Lifetime policy toggle

2. **Contribution Details Card**
   - [x] Regular contribution amount with currency formatting
   - [x] Frequency selection (EnumSelect)
   - [x] Additional benefits list (expandable):
     - [x] Source (e.g., "Government", "Employer")
     - [x] Amount with currency formatting
     - [x] Frequency selection
     - [x] Description

3. **Statements Card**
   - [x] Add statement button (top of card)
   - [x] Latest statement section:
     - [x] Statement date
     - [x] Current value with currency formatting
     - [x] Total contributions to date
     - [x] Total benefits received
     - [x] Note field for additional information
     - [x] Projections section:
       - [x] Multiple projections per statement
       - [x] Each projection includes:
         - [x] Retirement age
         - [x] Monthly payout
         - [x] Total capital at retirement
         - [x] With/without contributions toggle
         - [x] Return rate scenarios
     - [x] Costs section:
       - [x] Yearly costs amount
       - [x] Optional percentage-based costs

   - [x] Previous statements section (collapsible):
     - [x] List of all previous statements
     - [x] Each statement expandable/collapsible
     - [x] Same fields as latest statement
     - [x] Ability to edit/delete statements
     - [x] Chronological order (newest first)

Key Form Features:
- [x] useFieldArray for managing multiple statements
- [x] Client-side currency/number formatting
- [x] Proper form reset handling
- [x] Optimistic updates for better UX
- [x] Statement deletion confirmation
- [x] Smart defaults from settings

#### Form Components
- [x] Create/Edit forms following form architecture pattern:
  - [x] Parent page component with data fetching logic
  - [x] Child form component for field rendering
  - [x] ErrorBoundary wrapper
  - [x] LoadingState component
  - [x] Proper form reset handling

#### UX Improvements Over Company Pension
1. **Simplified Navigation**
   - [x] Remove detail view initially
   - [x] Focus on create/edit forms
   - [x] Clear section separation

2. **Better Data Entry**
   - [x] Scenario-based projection inputs
   - [x] Clearer separation between contributions and benefits
   - [x] Improved date selection for statements

3. **Enhanced Validation**
   - [x] Immediate feedback on monetary values
   - [x] Date range validations
   - [x] Cross-field validations (e.g., projections must align with contribution plans)
   - [x] Clear error messages with suggested fixes

4. **Smart Defaults**
   - [x] Pre-filled retirement age based on settings
   - [x] Default contribution frequency
   - [x] Suggested projection scenarios
   - [x] Auto-calculated fields where possible

5. **Visual Improvements**
   - [x] Progress indicators for form completion
   - [x] Visual representation of projection scenarios
   - [x] Clear hierarchy of information
   - [x] Better spacing and grouping of related fields

#### Error Handling & Feedback
- [x] Immediate field-level validation feedback
- [x] Clear error messages for business rule violations
- [x] Toast notifications for async operations
- [x] Proper handling of concurrent edits
- [x] Optimistic updates for better UX
- [x] Clear loading indicators for all async operations

#### Accessibility Requirements
- [x] ARIA labels for all form fields
- [x] Keyboard navigation support
- [x] Screen reader friendly error messages
- [x] Proper heading hierarchy
- [x] Color contrast compliance
- [x] Focus management for modals and forms

## Implementation Steps

### Backend Implementation
- [x] Step 1: Database Schema and Models
  - [x] Create SQLAlchemy models
  - [x] Set up Alembic migrations
  - [x] Implement model relationships
  
- [x] Step 2: API Endpoints
  - [x] CRUD operations for insurance policies
  - [x] Statement history endpoints
  - [x] Additional benefits tracking endpoints

- [x] Step 3: Business Logic
  - [x] Statement management service
  - [x] Benefits tracking service

### Frontend Implementation
- ✅ Step 4: UI Components and Pages
  - ✅ Type Definitions
    - ✅ InsurancePension interface
    - ✅ InsurancePensionStatement interface
    - ✅ InsurancePensionProjection interface
    - ✅ Form data types with proper handling of optional fields
  - ✅ Components
    - ✅ PensionList Update with updated implementation
    - ✅ Form components
  - ✅ Pages
    - ✅ Edit page
    - ✅ Create page

### Type System Improvements
- ✅ Proper handling of optional fields
- ✅ Clear separation between form state and API types
- ✅ Type-safe enums and discriminated unions
- ✅ Proper date handling in form state
- ✅ Proper handling of ID fields for new vs existing records
- ✅ Consistent number handling for monetary values

### Current Focus
✅ Frontend Implementation
- ✅ Type definitions aligned with backend model
- ✅ Form state management
- ✅ Component implementation
- ✅ Page routing and navigation
- ✅ Error handling and validation
- ✅ Loading states and optimistic updates

## Dependencies
- ✅ Currency System Backend (✅ Complete)
- ✅ Form Reset Hook (✅ Complete)
- ✅ Settings Module (✅ Complete)
- ✅ Company Pension UI (✅ Complete) - Reference for new implementation

## Technical Notes
- ✅ Use FastAPI's dependency injection for currency conversion
- ✅ Implement proper error handling for API operations
- ✅ Consider implementing caching for frequently accessed policy data
- ✅ Use proper TypeScript types for all API responses
- ✅ Follow existing patterns from Company Pension implementation
- ✅ Reuse shared components where possible
- ✅ Maintain consistent styling with Company Pension UI
- ✅ Follow form architecture pattern strictly:
  - ✅ Separate data fetching logic into hooks
  - ✅ Keep form components pure and focused on rendering
  - ✅ Implement proper error boundaries
  - ✅ Use consistent loading states
  - ✅ Handle form resets correctly
- ✅ Handle currency conversions for dashboard aggregation
- ✅ Support different types of additional benefits
- ✅ Keep data model generic enough for different pension types
- ✅ Use enums for standardized values where possible
- ✅ Implement proper date handling for statements

## Implementation Improvements

### Database Design and Normalization
1. **Proper Database Structure**
- ✅ Clear table structure with proper relationships
- ✅ Appropriate column types and constraints
- ✅ Proper indexing for performance
- ✅ Cascade delete rules
- ✅ Proper handling of optional fields

### API Layer Improvements
- ✅ Simplified relationship loading
- ✅ Atomic operations
- ✅ Clear separation of concerns
- ✅ Proper error handling
- ✅ Type safety throughout

### Frontend Type Safety
- ✅ Strong typing for all interfaces
- ✅ Clear type definitions for optional fields
- ✅ Consistent date and number handling
- ✅ No ambiguous types or type conversions

### Key Improvements Over Company Pension Implementation
1. **Database Layer**
- ✅ Proper normalization of tables
- ✅ Clear and explicit relationships
- ✅ Avoid circular references
- ✅ Use appropriate cascade operations
- ✅ Implement proper indexing

2. **API Layer**
- ✅ Atomic operations for each entity type
- ✅ Clear separation of concerns
- ✅ Explicit loading strategies
- ✅ Proper error handling and rollback
- ✅ No recursive loading issues

3. **Frontend Layer**
- ✅ Strong type definitions
- ✅ Clear data flow
- ✅ Separated concerns for forms and data
- ✅ Proper handling of optional fields
- ✅ Consistent date and number handling

4. **General Improvements**
- ✅ Better error handling
- ✅ Clear separation of concerns
- ✅ Atomic operations
- ✅ Type safety throughout the stack
- ✅ Simplified data structures
- ✅ Better performance through proper loading strategies
- ✅ Easier maintenance and debugging

## Testing Scope
### Critical Test Cases
- ✅ CRUD operations for insurance policies
- ✅ Statement management
- ✅ Additional benefits tracking
- ✅ Form validation rules
- ✅ Error handling scenarios
- ✅ UI component rendering
- ✅ Form submission flows
- ✅ Navigation patterns

### Edge Cases
- ✅ Invalid monetary values
- ✅ Date validation edge cases
- ✅ Policy number uniqueness
- ✅ Document storage limits
- ✅ Form state persistence
- ✅ Loading state transitions 