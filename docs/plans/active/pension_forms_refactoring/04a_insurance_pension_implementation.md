# 04a: Insurance Pension Implementation

> <details>
> <summary><strong>🤖 AI Assistant Guide</strong></summary>
>
> ## Purpose
> This document provides the implementation plan for standardizing Insurance Pension forms. These forms are closest to the target implementation and will serve as the reference for other pension types.
>
> ## Implementation Order
> 1. Layout Standardization
> 2. Formatting Standardization
> 3. Form Reset Implementation
> 4. **Per-Pension Type Implementation** (current phase)
>
> ## Dependencies
> - Requires completion of the first three plans
>
> ## Expected Outcome
> Insurance Pension forms will follow the standardized patterns and serve as reference implementations.
>
> ## Status Tracking
> - Use checkboxes to track progress
> - Mark subtasks as they are completed
>
> ## Status Indicators
> - [ ] Not started
> - [x] Completed
> - [~] Partially completed
> </details>

## 📋 Overview & Goals

This plan focuses on verifying and finalizing the Insurance Pension forms as the reference implementation for other pension types. Since these forms are already closest to the target implementation, the focus is on verification and documentation rather than major changes.

### Key Goals
1. Verify that Insurance Pension forms follow the standardized patterns
2. Document these forms as reference implementations
3. Make any necessary adjustments to align with the standards

## 📊 Implementation Tasks

### Add Form

- [x] **Verify Layout Implementation**
  - [x] Confirm use of flexible two-column grid
  - [x] Verify all sections have corresponding explanations
  - [x] Document as reference implementation

- [ ] **Implement Form Reset Hook**
  - [ ] Add `useFormReset` hook
  - [ ] Use insurance-specific transformer
  - [ ] Remove any manual initialization logic

- [x] **Verify Formatting Implementation**
  - [x] Replace direct use of `parseNumber`, `formatNumberInput`, `getDecimalSeparator` in BasicInformationCard.tsx
  - [x] Replace custom `handleNumberInput` function with standardized `NumberInput` component
  - [x] Replace direct JSX formatting in StatementsCard.tsx with client-side useState/useEffect pattern
  - [x] Replace complex state management for multiple formatted inputs with standardized components
  - [x] Use `FormattedCurrency`, `FormattedNumber`, and `FormattedDate` components for display values
  - [x] Replace direct ContributionFrequency formatting with `FormattedFrequency` component
  - [x] Verify consistent usage of `DateInput` and `DateEndPicker` components for all date fields
  - [x] Ensure proper date format handling based on user locale settings
  - [x] Ensure all formatted values use client-side rendering to prevent hydration mismatches
  - [x] Verify proper handling of initial empty states during hydration
  - [x] Document as reference implementation
  - [x] Implement formatting standardization for ContributionDetailsCard.tsx

### Edit Form

- [x] **Verify Layout Implementation**
  - [x] Confirm use of flexible two-column grid
  - [x] Verify all sections have corresponding explanations
  - [x] Document as reference implementation

- [ ] **Verify Form Reset Implementation**
  - [ ] Confirm use of `useFormReset` hook
  - [ ] Verify removal of manual reset logic
  - [ ] Document as reference implementation

- [x] **Verify Formatting Implementation**
  - [x] Confirm use of centralized formatting utilities in StatementsCard.tsx
  - [x] Verify proper hydration mismatch prevention in StatementsCard.tsx
  - [x] Replace direct ContributionFrequency formatting with `FormattedFrequency` component
  - [x] Verify consistent usage of `DateInput` and `DateEndPicker` components for all date fields
  - [x] Ensure proper date format handling based on user locale settings
  - [x] Implement formatting standardization for ContributionDetailsCard.tsx
  - [x] Document as reference implementation

### Error Handling and Loading States

- [x] **Verify Error Boundary Usage**
  - [x] Confirm ErrorBoundary is properly implemented in both Add and Edit forms
  - [x] Ensure consistent error messaging and recovery options
  - [x] Document as reference implementation

- [x] **Verify Loading State Implementation**
  - [x] Confirm LoadingState component is used consistently in Edit form
  - [x] Verify loading indicators for async operations
  - [x] Document as reference implementation

## 🔍 Implementation Details

### StatementsCard Implementation

The StatementsCard has been successfully updated to use standardized formatting components:

1. **Removed Custom Formatting Logic**:
   - Removed direct usage of `parseNumber`, `formatNumberInput`, `getDecimalSeparator`
   - Removed custom state management for formatted inputs
   - Removed custom input handlers and validation functions

2. **Replaced with Standardized Components**:
   - Used `CurrencyInput` for all currency fields (value, total_contributions, total_benefits, costs_amount, value_at_retirement, monthly_payout)
   - Used `PercentInput` for percentage fields (costs_percentage, return_rate)
   - Used `FormattedDate` for displaying dates

3. **Simplified the Code**:
   - Removed the complex `renderInput` function
   - Removed multiple state variables for tracking input values
   - Removed manual input validation and formatting
   - Simplified the form field rendering

4. **Improved User Experience**:
   - Standardized input behavior across all forms
   - Ensured proper hydration mismatch prevention
   - Maintained consistent formatting based on user locale settings

### ContributionDetailsCard Implementation

The ContributionDetailsCard has been successfully updated to use standardized formatting components:

1. **Removed Custom Formatting Logic**:
   - Removed direct usage of `parseNumber`, `formatNumberInput`, `getDecimalSeparator`
   - Removed custom state management for contribution inputs
   - Removed custom input validation function (`isValidNumberFormat`)
   - Eliminated the need for manual input state initialization

2. **Replaced with Standardized Components**:
   - Used `CurrencyInput` for amount fields
   - Continued using existing `DateInput` and `DateEndPicker` components which already follow best practices
   - Continued using `EnumSelect` for frequency selection which already follows best practices

3. **Simplified the Code**:
   - Removed complex state management for tracking input values
   - Eliminated manual input validation and formatting
   - Removed the need for useEffect to initialize input states
   - Simplified the form field rendering

4. **Improved User Experience**:
   - Standardized input behavior across all forms
   - Ensured proper hydration mismatch prevention
   - Maintained consistent formatting based on user locale settings

### Form Reset Implementation

```tsx
import { useFormReset } from '@/frontend/lib/hooks/useFormReset';
import { insurancePensionToForm } from '@/frontend/lib/transformers/insurancePensionTransformers';
import { useSettings } from '@/frontend/context/SettingsContext';

// Inside component
const { data: pension, isLoading, error } = usePensionData<InsurancePension>(pensionId, PensionType.INSURANCE);
const { settings } = useSettings();
const form = useForm<InsurancePensionFormData>({ defaultValues });

// Use the form reset hook
const { resetWithData } = useFormReset({
  data: pension,
  form,
  apiToForm: (data) => insurancePensionToForm(data, settings.number_locale),
  defaultValues,
  dependencies: [settings.number_locale]
});
```

### Error Handling and Loading State Implementation

The Insurance Pension forms already use ErrorBoundary and LoadingState components, but they should be verified for consistency with the standardized pattern:

```tsx
// Add Form
<ErrorBoundary>
  <div className="container max-w-2xl mx-auto py-10">
    {/* Form content */}
  </div>
</ErrorBoundary>

// Edit Form
<ErrorBoundary>
  <div className="container py-10">
    {/* Header */}
    
    {/* Loading and error states */}
    {isLoading ? (
      <LoadingState message="Loading pension details..." />
    ) : error ? (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    ) : (
      <Form {...form}>
        {/* Form content */}
      </Form>
    )}
  </div>
</ErrorBoundary>
```

### Documentation Template

For each form section, document:

1. Layout structure
2. Explanation component
3. Formatting approach
4. Form reset implementation

This documentation will serve as a reference for implementing other pension types.

## 📋 Form Layout Audit Results

The Insurance Pension forms are closest to the target implementation and should serve as the reference for other pension types.

### Current Structure

- **Form Sections**: 
  - Basic Information (name, provider, contract number)
  - Plan Details (start date, guaranteed interest, expected return)
  - Contribution Plan (multiple contribution steps with amounts and dates)
  - Statements (historical statements with projections)

- **Layout Pattern**:
  - Uses a single-column layout for mobile
  - Uses a partial grid layout for desktop, but not consistently
  - Some sections have explanations, but not in a standardized format

### Recommended Changes

- Implement consistent `FormLayout` and `FormSection` components
- Create dedicated explanation components for each section
- Ensure proper spacing between sections
- Standardize the responsive behavior

### Reference Implementation Notes

When implementing the standardized layout, use the following section structure:

```tsx
<FormLayout>
  <FormSection
    title="Basic Information"
    description="Enter the basic details of your insurance pension plan"
    explanation={<BasicInformationExplanation />}
  >
    {/* Basic information fields */}
  </FormSection>
  
  <FormSection
    title="Plan Details"
    description="Set up your insurance plan parameters"
    explanation={<PlanDetailsExplanation />}
  >
    {/* Plan details fields */}
  </FormSection>
  
  <FormSection
    title="Contribution Plan"
    description="Define your contribution schedule"
    explanation={<ContributionPlanExplanation />}
  >
    {/* Contribution plan fields */}
  </FormSection>
  
  <FormSection
    title="Statements"
    description="Record historical statements and projections"
    explanation={<StatementsExplanation />}
  >
    {/* Statements fields */}
  </FormSection>
</FormLayout>
``` 