# 04c: Company Pension Implementation

> <details>
> <summary><strong>🤖 AI Assistant Guide</strong></summary>
>
> ## Purpose
> This document provides the implementation plan for standardizing Company Pension forms according to the established patterns.
>
> ## Implementation Order
> 1. Layout Standardization
> 2. Formatting Standardization
> 3. Form Reset Implementation
> 4. **Per-Pension Type Implementation** (current phase)
>
> ## Dependencies
> - Requires completion of the first three plans
> - Reference the Insurance Pension forms as examples
>
> ## Expected Outcome
> Company Pension forms will follow the standardized patterns for layout, formatting, and form reset.
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

This plan focuses on implementing the standardized patterns for Company Pension forms. These forms require moderate changes to align with the established standards, particularly in layout and form reset logic.

### Key Goals
1. Implement flexible two-column grid layout
2. Replace custom formatting with centralized utilities
3. Implement form reset hook
4. Ensure consistent behavior with other pension types

## 📊 Implementation Tasks

### Add Form

- [x] **Apply Layout Standardization**
  - [x] Implement flexible two-column grid
  - [x] Create dedicated explanation components
  - [x] Use `FormLayout` and `FormSection` components

- [ ] **Apply Formatting Standardization**
  - [ ] Replace direct JSX formatting with `formatCurrency` in ContributionHistoryCard.tsx
  - [ ] Replace direct date formatting with `toLocaleDateString` in ContributionHistoryCard.tsx
  - [ ] Replace complex state management for formatted inputs in PensionStatementsCard.tsx
  - [ ] Replace direct use of `parseNumber`, `getDecimalSeparator`, and `getCurrencySymbol` with components
  - [ ] Implement client-side useState/useEffect pattern for all displayed values
  - [ ] Use `FormattedCurrency`, `FormattedNumber`, and `FormattedDate` components for display values
  - [ ] Replace direct ContributionFrequency formatting with `FormattedFrequency` component
  - [ ] Verify consistent usage of `DateInput` and `DateEndPicker` components for all date fields
  - [ ] Ensure proper date format handling based on user locale settings
  - [ ] Ensure all formatted values use client-side rendering to prevent hydration mismatches
  - [ ] Verify proper handling of initial empty states during hydration

- [ ] **Implement Form Reset Hook**
  - [ ] Add `useFormReset` hook
  - [ ] Use Company-specific transformer
  - [ ] Remove manual initialization logic

### Edit Form

- [x] **Apply Layout Standardization**
  - [x] Implement flexible two-column grid
  - [x] Create dedicated explanation components
  - [x] Use `FormLayout` and `FormSection` components

- [ ] **Apply Formatting Standardization**
  - [ ] Replace direct JSX formatting with `formatCurrency` in ContributionHistoryCard.tsx
  - [ ] Replace direct date formatting with `toLocaleDateString` in ContributionHistoryCard.tsx
  - [ ] Replace complex state management for formatted inputs in PensionStatementsCard.tsx
  - [ ] Replace direct use of `parseNumber`, `getDecimalSeparator`, and `getCurrencySymbol` with components
  - [ ] Implement client-side useState/useEffect pattern for all displayed values
  - [ ] Use `FormattedCurrency`, `FormattedNumber`, and `FormattedDate` components for display values
  - [ ] Replace direct ContributionFrequency formatting with `FormattedFrequency` component
  - [ ] Verify consistent usage of `DateInput` and `DateEndPicker` components for all date fields
  - [ ] Ensure proper date format handling based on user locale settings
  - [ ] Ensure all formatted values use client-side rendering to prevent hydration mismatches
  - [ ] Verify proper handling of initial empty states during hydration

- [ ] **Implement Form Reset Hook**
  - [ ] Replace manual reset logic with `useFormReset` hook
  - [ ] Use Company-specific transformer

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

### Layout Implementation

```tsx
import { FormLayout, FormSection } from '@/frontend/components/shared';
import { BasicInformationFields } from './BasicInformationFields';
import { ContributionPlanFields } from './ContributionPlanFields';
import { StatementsFields } from './StatementsFields';
import { BasicInformationExplanation } from './explanations/BasicInformationExplanation';
import { ContributionPlanExplanation } from './explanations/ContributionPlanExplanation';
import { StatementsExplanation } from './explanations/StatementsExplanation';

export function CompanyPensionForm({ form }) {
  return (
    <FormLayout>
      <FormSection
        title="Basic Information"
        description="Enter the basic details of your company pension plan"
        explanation={<BasicInformationExplanation />}
      >
        <BasicInformationFields form={form} />
      </FormSection>
      
      <FormSection
        title="Contribution Plan"
        description="Set up your contribution schedule"
        explanation={<ContributionPlanExplanation />}
      >
        <ContributionPlanFields form={form} />
      </FormSection>
      
      <FormSection
        title="Statements"
        description="Record pension statements and projections"
        explanation={<StatementsExplanation />}
      >
        <StatementsFields form={form} />
      </FormSection>
    </FormLayout>
  );
}
```

### Form Reset Implementation

```tsx
import { useFormReset } from '@/frontend/lib/hooks/useFormReset';
import { companyPensionToForm } from '@/frontend/lib/transformers/companyPensionTransformers';
import { useSettings } from '@/frontend/context/SettingsContext';

// Inside component
const { data: pension, isLoading, error } = usePensionData<CompanyPension>(pensionId, PensionType.COMPANY);
const { settings } = useSettings();
const form = useForm<CompanyPensionFormData>({ defaultValues });

// Replace complex useEffect with this:
const { resetWithData } = useFormReset({
  data: pension,
  form,
  apiToForm: (data) => companyPensionToForm(data, settings.number_locale),
  defaultValues,
  dependencies: [settings.number_locale]
});
```

### Error Handling and Loading State Implementation

The Company Pension forms already use ErrorBoundary and LoadingState components, but they should be verified for consistency with the standardized pattern:

```tsx
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

## 📋 Form Layout Audit Results

The Company Pension forms need moderate changes to align with the standardized layout pattern.

### Current Structure

- **Form Sections**: 
  - Basic Information (name, employer, status)
  - Plan Details (start date, end date, contribution frequency)
  - Contribution Plan (multiple contribution steps)
  - Statements (historical statements with projections)
  - Edit form: Contribution History (in Edit form only)

- **Layout Pattern**:
  - Uses a mixed layout approach
  - Some sections use a partial grid layout
  - Limited explanation components
  - Inconsistent spacing and alignment

### Recommended Changes

- Implement consistent `FormLayout` and `FormSection` components
- Create dedicated explanation components for each section
- Standardize spacing and responsive behavior
- Ensure consistent form field grouping

### Section Structure

The Company Pension forms should be restructured into the following sections:

1. **Basic Information**
   - Name
   - Employer
   - Member selection
   - Status (active, inactive, etc.)
   - Notes

2. **Plan Details**
   - Start date
   - End date (optional)
   - Contribution frequency

3. **Contribution Plan**
   - Contribution steps with:
     - Amount
     - Start date
     - End date (optional)

4. **Statements**
   - Historical statements with:
     - Date
     - Value
     - Projections (duration and projected value) 

5. **Contribution History** (Edit form only)
   - Historacal Contributions