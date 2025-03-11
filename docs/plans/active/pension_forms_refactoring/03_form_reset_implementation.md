# 03: Form Reset Hook Implementation

> <details>
> <summary><strong>🤖 AI Assistant Guide</strong></summary>
>
> ## Purpose
> This document is part 3 of 4 in the pension forms standardization series. It focuses specifically on implementing the useFormReset hook to standardize form reset logic across all pension forms.
>
> ## Implementation Order
> 1. Layout Standardization
> 2. Formatting Standardization
> 3. **Form Reset Implementation** (this document)
> 4. Per-Pension Type Implementation
>
> ## Dependencies
> - Requires the form reset hook from [Form Reset Hook Implementation](docs/tech/refactoring/active/form_reset_hook.md)
>
> ## Expected Outcome
> All pension forms will use the useFormReset hook for consistent data transformation between API and form formats.
>
> ## Status Tracking
> - Use checkboxes to track progress
> - Mark subtasks as they are completed
>
> ## Status Indicators
> - [ ] Not started
> - [x] Completed
> - [~] Partially completed
>
> ## AI Implementation Notes
> - Create only the transformer files specified in this document
> - Use the exact file paths provided
> - Follow the implementation details exactly as shown
> - Do not modify the useFormReset hook implementation
> - Ensure all transformers handle null/undefined values properly
> </details>

## 📋 Overview & Goals

This plan addresses the inconsistent form reset logic across pension forms by implementing the `useFormReset` hook. Currently, forms use manual reset logic in useEffect hooks, which leads to code duplication and potential bugs.

### Key Goals
1. Implement the `useFormReset` hook across all pension forms
2. Create type-safe transformers for each pension type
3. Eliminate manual reset logic in useEffect hooks
4. Ensure consistent handling of complex nested data structures

### Reference Documents
- [Form Reset Hook Implementation](docs/tech/refactoring/active/form_reset_hook.md)

## 📊 Implementation Tasks

### 1. Create Type-Safe Transformers

- [ ] **ETF Pension Transformers**
  - [ ] Create `src/frontend/lib/transformers/etfPensionTransformers.ts`
  - [ ] Implement `etfPensionToForm` transformer
  - [ ] Handle nested contribution steps
  - [ ] Handle date transformations
  - [ ] Add proper type definitions

- [x] **Company Pension Transformers**
  - [x] Create `src/frontend/lib/transformers/companyPensionTransformers.ts`
  - [x] Implement `companyPensionToForm` transformer
  - [x] Handle nested contribution steps and statements
  - [x] Handle date transformations
  - [x] Add proper type definitions

- [x] **Insurance Pension Transformers**
  - [x] Create `src/frontend/lib/transformers/insurancePensionTransformers.ts`
  - [x] Implement `insurancePensionToForm` transformer
  - [x] Handle nested contribution steps and statements
  - [x] Handle date transformations
  - [x] Add proper type definitions

### 2. Implement Form Reset Hook

- [x] **Verify Hook Implementation**
  - [x] Ensure `useFormReset` hook is implemented according to the plan
  - [x] Test with basic examples
  - [x] Verify handling of complex nested structures

- [x] **Create Usage Examples**
  - [x] Document usage pattern for each pension type
  - [x] Create example implementations
  - [x] Add comprehensive TypeScript types

### 3. Update Reference Form

- [x] **Update Insurance Pension Edit Form**
  - [x] Implement `useFormReset` hook
  - [x] Remove manual reset logic
  - [x] Test with various data scenarios
  - [x] Document as reference implementation

## 🔍 Implementation Details

### ETF Pension Transformer

File: `src/frontend/lib/transformers/etfPensionTransformers.ts`

```tsx
import { ETFPension, ETFPensionFormData } from '@/frontend/types/pension';
import { 
  dateToString, 
  stringToDate, 
  apiNumberToFormString,
  formStringToApiNumber,
  ensureArray,
  withDefault
} from '@/frontend/lib/utils/formTransformers';

export const etfPensionToForm = (
  pension: ETFPension,
  locale: string
): ETFPensionFormData => {
  return {
    type: pension.type,
    name: withDefault(pension.name, ''),
    member_id: pension.member_id.toString(),
    etf_id: withDefault(pension.etf_id, ''),
    notes: pension.notes || '',
    is_existing_investment: pension.is_existing_investment || false,
    existing_units: pension.existing_units || 0,
    reference_date: pension.reference_date ? new Date(pension.reference_date) : new Date(),
    initialization_method: pension.realize_historical_contributions ? "historical" : "none",
    contribution_plan_steps: ensureArray(pension.contribution_plan_steps).map(step => ({
      amount: step.amount,
      frequency: step.frequency,
      start_date: stringToDate(step.start_date),
      end_date: step.end_date ? stringToDate(step.end_date) : undefined,
    }))
  };
};
```

### Company Pension Transformer

File: `src/frontend/lib/transformers/companyPensionTransformers.ts`

```tsx
import { CompanyPension, CompanyPensionFormData } from '@/frontend/types/pension';
import { 
  dateToString, 
  stringToDate, 
  apiNumberToFormString,
  formStringToApiNumber,
  ensureArray,
  withDefault
} from '@/frontend/lib/utils/formTransformers';

export const companyPensionToForm = (
  pension: CompanyPension,
  locale: string
): CompanyPensionFormData => {
  return {
    type: pension.type,
    name: withDefault(pension.name, ''),
    member_id: pension.member_id.toString(),
    employer: withDefault(pension.employer, ''),
    notes: pension.notes || '',
    start_date: stringToDate(pension.start_date),
    end_date: stringToDate(pension.end_date),
    contribution_frequency: withDefault(pension.contribution_frequency, null),
    status: withDefault(pension.status, 'active'),
    contribution_plan_steps: ensureArray(pension.contribution_plan_steps).map(step => ({
      ...step,
      start_date: stringToDate(step.start_date),
      amount: step.amount
    })),
    statements: ensureArray(pension.statements).map(statement => ({
      ...statement,
      date: stringToDate(statement.date),
      value: statement.value,
      projections: ensureArray(statement.projections).map(projection => ({
        ...projection,
        duration_years: projection.duration_years,
        projected_value: projection.projected_value
      }))
    }))
  };
};
```

### Insurance Pension Transformer

File: `src/frontend/lib/transformers/insurancePensionTransformers.ts`

```tsx
import { InsurancePension, InsurancePensionFormData } from '@/frontend/types/pension';
import { 
  dateToString, 
  stringToDate, 
  apiNumberToFormString,
  formStringToApiNumber,
  ensureArray,
  withDefault
} from '@/frontend/lib/utils/formTransformers';

export const insurancePensionToForm = (
  pension: InsurancePension,
  locale: string
): InsurancePensionFormData => {
  return {
    type: pension.type,
    name: withDefault(pension.name, ''),
    member_id: pension.member_id.toString(),
    notes: pension.notes || '',
    provider: withDefault(pension.provider, ''),
    contract_number: withDefault(pension.contract_number, ''),
    start_date: stringToDate(pension.start_date),
    guaranteed_interest: pension.guaranteed_interest,
    expected_return: pension.expected_return,
    contribution_plan_steps: ensureArray(pension.contribution_plan_steps).map(step => ({
      ...step,
      start_date: stringToDate(step.start_date),
      end_date: step.end_date ? stringToDate(step.end_date) : undefined,
      amount: step.amount
    })),
    statements: ensureArray(pension.statements).map(statement => ({
      ...statement,
      date: stringToDate(statement.date),
      value: statement.value,
      projections: ensureArray(statement.projections).map(projection => ({
        ...projection,
        duration_years: projection.duration_years,
        projected_value: projection.projected_value
      }))
    }))
  };
};
```

### Form Reset Hook Usage

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

// Remove all the manual reset logic in useEffect
```

### Implementation Pattern for Replacing Manual Reset Logic

When finding manual reset logic like this:

```tsx
// Before: Manual reset logic in useEffect
useEffect(() => {
  if (pension) {
    form.reset({
      name: pension.name || '',
      member_id: pension.member_id.toString(),
      // ... more fields
      contribution_plan_steps: pension.contribution_plan_steps?.map(step => ({
        // ... transform step
      })) || []
    });
  }
}, [pension, form]);
```

Replace with:

```tsx
// After: Using useFormReset hook
const { resetWithData } = useFormReset({
  data: pension,
  form,
  apiToForm: (data) => pensionTypeToForm(data, settings.number_locale),
  defaultValues,
  dependencies: [settings.number_locale]
});
``` 