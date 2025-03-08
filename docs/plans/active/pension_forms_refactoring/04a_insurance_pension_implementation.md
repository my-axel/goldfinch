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

- [ ] **Verify Layout Implementation**
  - [ ] Confirm use of flexible two-column grid
  - [ ] Verify all sections have corresponding explanations
  - [ ] Document as reference implementation

- [ ] **Implement Form Reset Hook**
  - [ ] Add `useFormReset` hook
  - [ ] Use insurance-specific transformer
  - [ ] Remove any manual initialization logic

- [ ] **Verify Formatting Implementation**
  - [ ] Confirm use of centralized formatting utilities
  - [ ] Verify proper hydration mismatch prevention
  - [ ] Document as reference implementation

### Edit Form

- [ ] **Verify Layout Implementation**
  - [ ] Confirm use of flexible two-column grid
  - [ ] Verify all sections have corresponding explanations
  - [ ] Document as reference implementation

- [ ] **Verify Form Reset Implementation**
  - [ ] Confirm use of `useFormReset` hook
  - [ ] Verify removal of manual reset logic
  - [ ] Document as reference implementation

- [ ] **Verify Formatting Implementation**
  - [ ] Confirm use of centralized formatting utilities
  - [ ] Verify proper hydration mismatch prevention
  - [ ] Document as reference implementation

## 🔍 Implementation Details

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

### Documentation Template

For each form section, document:

1. Layout structure
2. Explanation component
3. Formatting approach
4. Form reset implementation

This documentation will serve as a reference for implementing other pension types. 