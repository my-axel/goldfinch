# 04b: ETF Pension Implementation

> <details>
> <summary><strong>🤖 AI Assistant Guide</strong></summary>
>
> ## Purpose
> This document provides the implementation plan for standardizing ETF Pension forms according to the established patterns.
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
> ETF Pension forms will follow the standardized patterns for layout, formatting, and form reset.
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

This plan focuses on implementing the standardized patterns for ETF Pension forms. These forms require significant changes to align with the established standards, particularly in layout and formatting.

### Key Goals
1. Implement flexible two-column grid layout
2. Replace custom formatting with centralized utilities
3. Implement form reset hook
4. Ensure consistent behavior with other pension types

## 📊 Implementation Tasks

### Add Form

- [ ] **Apply Layout Standardization**
  - [ ] Implement flexible two-column grid
  - [ ] Create dedicated explanation components
  - [ ] Use `FormLayout` and `FormSection` components

- [ ] **Apply Formatting Standardization**
  - [ ] Replace custom formatting with centralized utilities
  - [ ] Implement client-side formatting pattern
  - [ ] Use formatting components for inputs and displays

- [ ] **Implement Form Reset Hook**
  - [ ] Add `useFormReset` hook
  - [ ] Use ETF-specific transformer
  - [ ] Remove manual initialization logic

### Edit Form

- [ ] **Apply Layout Standardization**
  - [ ] Implement flexible two-column grid
  - [ ] Create dedicated explanation components
  - [ ] Use `FormLayout` and `FormSection` components

- [ ] **Apply Formatting Standardization**
  - [ ] Replace custom formatting with centralized utilities
  - [ ] Implement client-side formatting pattern
  - [ ] Use formatting components for inputs and displays

- [ ] **Implement Form Reset Hook**
  - [ ] Replace manual reset logic with `useFormReset` hook
  - [ ] Use ETF-specific transformer

### Error Handling and Data Loading

- [ ] **Implement Error Boundary**
  - [ ] Wrap both Add and Edit forms with ErrorBoundary component
  - [ ] Add consistent error messaging and recovery options
  - [ ] Ensure error states are properly handled in UI

- [ ] **Standardize Loading State Implementation**
  - [ ] Replace custom loading state with standard LoadingState component
  - [ ] Implement skeleton loaders for form sections during data loading
  - [ ] Ensure consistent loading indicators for async operations

- [ ] **Refactor Data Loading Pattern**
  - [ ] Replace direct context usage with usePensionData hook
  - [ ] Implement useFormReset for form initialization
  - [ ] Remove manual loading state management
  - [ ] Simplify useEffect dependencies

## 🔍 Implementation Details

### Layout Implementation

```tsx
import { FormLayout, FormSection } from '@/frontend/components/shared';
import { BasicInformationFields } from './BasicInformationFields';
import { ContributionFields } from './ContributionFields';
import { BasicInformationExplanation } from './explanations/BasicInformationExplanation';
import { ContributionExplanation } from './explanations/ContributionExplanation';

export function ETFPensionForm({ form }) {
  return (
    <FormLayout>
      <FormSection
        title="Basic Information"
        description="Enter the basic details of your ETF pension plan"
        explanation={<BasicInformationExplanation />}
      >
        <BasicInformationFields form={form} />
      </FormSection>
      
      <FormSection
        title="Contribution Plan"
        description="Set up your contribution schedule"
        explanation={<ContributionExplanation />}
      >
        <ContributionFields form={form} />
      </FormSection>
    </FormLayout>
  );
}
```

### Form Reset Implementation

```tsx
import { useFormReset } from '@/frontend/lib/hooks/useFormReset';
import { etfPensionToForm } from '@/frontend/lib/transformers/etfPensionTransformers';
import { useSettings } from '@/frontend/context/SettingsContext';

// Inside component
const { data: pension, isLoading, error } = usePensionData<ETFPension>(pensionId, PensionType.ETF_PLAN);
const { settings } = useSettings();
const form = useForm<ETFPensionFormData>({ defaultValues });

// Replace complex useEffect with this:
const { resetWithData } = useFormReset({
  data: pension,
  form,
  apiToForm: (data) => etfPensionToForm(data, settings.number_locale),
  defaultValues,
  dependencies: [settings.number_locale]
});
```

### Error Handling and Data Loading Implementation

The ETF Pension forms currently use a custom loading state approach but need to be updated to use the standard ErrorBoundary and LoadingState components:

#### Edit Page Refactoring

```tsx
"use client"

import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { ErrorBoundary } from "@/frontend/components/shared/ErrorBoundary"
import { LoadingState } from "@/frontend/components/shared/LoadingState"
import { Alert, AlertDescription, AlertTitle } from "@/frontend/components/ui/alert"
import { usePensionData } from "@/frontend/lib/hooks/usePensionData"
import { useFormReset } from "@/frontend/lib/hooks/useFormReset"
import { etfPensionToForm } from "@/frontend/lib/transformers/etfPensionTransformers"
import { useHousehold } from "@/frontend/context/HouseholdContext"
import { use } from "react"

export default function EditETFPensionPage({ params }: EditETFPensionPageProps) {
  const router = useRouter()
  const { updateEtfPension } = usePension()
  const { members, fetchMembers } = useHousehold()
  const resolvedParams = use(params)
  const pensionId = parseInt(resolvedParams.id)
  
  // Replace manual loading state with usePensionData hook
  const { 
    data: pension, 
    isLoading, 
    error 
  } = usePensionData<ETFPension>(pensionId, PensionType.ETF_PLAN)
  
  // Fetch statistics separately
  const { 
    pensionStatistics,
    isLoadingStatistics,
    fetchPensionStatistics
  } = usePension()
  const statistics = pensionStatistics[pensionId]

  // Get the member's retirement date
  const member = pension ? members.find(m => m.id === pension.member_id) : null
  const retirementDate = member ? new Date(member.retirement_date_planned) : undefined

  const form = useForm<ETFPensionFormData>({
    defaultValues: {
      type: PensionType.ETF_PLAN,
      name: "",
      member_id: "",
      notes: "",
      etf_id: "",
      is_existing_investment: false,
      existing_units: 0,
      reference_date: new Date(),
      realize_historical_contributions: false,
      initialization_method: "none",
      contribution_plan_steps: []
    }
  })

  // Use the form reset hook instead of manual reset
  useFormReset({
    data: pension,
    form,
    apiToForm: etfPensionToForm,
    defaultValues: form.formState.defaultValues
  })

  // Fetch members on mount
  useEffect(() => {
    fetchMembers()
  }, [])

  // Fetch statistics when pension is loaded
  useEffect(() => {
    if (pension) {
      fetchPensionStatistics(pensionId, PensionType.ETF_PLAN)
    }
  }, [pension, pensionId])

  // Form submission handler
  const handleSubmit = async (data: ETFPensionFormData) => {
    try {
      // Implementation remains the same
    } catch (error) {
      console.error('Failed to update pension:', error)
      toast.error("Error", { 
        description: error instanceof Error ? error.message : "Failed to update pension"
      })
    }
  }

  return (
    <ErrorBoundary>
      <div className="container py-10">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit ETF Pension Plan</h1>
            <p className="text-muted-foreground mt-2">
              Update your ETF-based pension plan details and contribution schedule.
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="etf-pension-form"
              disabled={isLoading || isLoadingStatistics[pensionId]}
            >
              Save Changes
            </Button>
          </div>
        </div>

        {/* Standardized loading and error states */}
        {isLoading ? (
          <LoadingState message="Loading pension details..." />
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : !pension ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Pension not found</AlertDescription>
          </Alert>
        ) : pension.type !== PensionType.ETF_PLAN ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Invalid pension type</AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form id="etf-pension-form" onSubmit={form.handleSubmit(handleSubmit)}>
              {/* Form content using FormLayout and FormSection components */}
            </form>
          </Form>
        )}
      </div>
    </ErrorBoundary>
  )
}
```

## 📋 Form Layout Audit Results

The ETF Pension forms require significant changes to align with the standardized layout pattern.

### Current Structure

- **Form Sections**: 
  - Basic Information (name, ETF selection)
  - Investment Details (existing investment, reference date)
  - Contribution Plan (multiple contribution steps with amounts and dates)
  - Edit form: Historical Performance (in Edit form only)
  - Edit form: Value Projection (in Edit form only)

- **Layout Pattern**:
  - Uses a basic single-column layout
  - No consistent grid structure
  - Limited or no explanation components
  - Inconsistent spacing between sections

### Recommended Changes

- Implement the `FormLayout` component with 12-column grid
- Create `FormSection` components for each logical section
- Develop dedicated explanation components for each section
- Ensure consistent spacing and responsive behavior

### Section Structure

The ETF Pension forms should be restructured into the following sections:

1. **Basic Information**
   - ETF selection
   - Name
   - Notes

2. **Investment Details**
   - Existing investment toggle
   - Existing units (if applicable)
   - Reference date
   - Initialization method

3. **Contribution Plan**
   - Contribution steps with:
     - Amount
     - Frequency
     - Start date
     - End date (optional)

4. **Performance** (Edit form only)
   - Historical Performance graph
   - Current value as Explanation
   - Total invested as Explanation
   - Return metrics as Explanation

5. **Projection** (Edit form only)
   - Projection graph
   - Projection Stats as Explanation