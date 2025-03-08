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
  - [ ] Use Company-specific transformer
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
  - [ ] Use Company-specific transformer

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