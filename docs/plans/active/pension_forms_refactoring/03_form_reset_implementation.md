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

### Utility Functions

For consistent data handling, use the following utility functions from the appropriate files:

```typescript
// From src/frontend/lib/utils/formUtils.ts
import { 
  ensureArray,    // Ensures a value is an array, returning empty array if null/undefined
  withDefault,    // Returns a default value if the provided value is null/undefined
  toDateObject,   // Re-exported from dateUtils.ts - Converts string dates to Date objects
  safeNumberValue // Re-exported from transforms.ts - Safely handles null/undefined number values
} from '@/frontend/lib/utils/formUtils';
```

These utility functions provide consistent handling of:
- Array values (ensuring they're never null/undefined)
- Default values (for null/undefined fields)
- Date conversions (from API string format to Date objects)
- Number values (handling null/undefined values safely)

### ETF Pension Transformer

File: `src/frontend/lib/transformers/etfPensionTransformers.ts`

```tsx
import { ETFPension } from "@/frontend/types/pension"
import { ETFPensionFormData } from "@/frontend/types/pension-form"
import { 
  ensureArray, 
  withDefault,
  toDateObject,
  safeNumberValue 
} from '@/frontend/lib/utils/formUtils'

/**
 * Transforms an ETFPension API object to ETFPensionFormData for form usage
 * Handles date conversions, null/undefined values, and nested objects
 * 
 * @param pension - The ETF pension data from the API
 * @returns The transformed form data ready for use in forms
 */
export const etfPensionToForm = (pension: ETFPension): ETFPensionFormData => {
  return {
    type: pension.type,
    name: withDefault(pension.name, ""),
    member_id: pension.member_id.toString(),
    etf_id: withDefault(pension.etf_id, ""),
    notes: withDefault(pension.notes, ""),
    is_existing_investment: pension.is_existing_investment || false,
    existing_units: safeNumberValue(pension.existing_units) ?? 0,
    reference_date: toDateObject(pension.reference_date) || new Date(),
    initialization_method: pension.realize_historical_contributions ? "historical" : "none",
    contribution_plan_steps: ensureArray(pension.contribution_plan_steps).map(step => ({
      amount: safeNumberValue(step.amount) ?? 0,
      frequency: step.frequency,
      start_date: toDateObject(step.start_date) || new Date(),
      end_date: step.end_date ? (toDateObject(step.end_date) || undefined) : undefined,
      note: withDefault(step.note, "")
    }))
  };
};
```

### Company Pension Transformer

File: `src/frontend/lib/transformers/companyPensionTransformers.ts`

```tsx
import { CompanyPension } from "@/frontend/types/pension";
import { CompanyPensionFormData } from "@/frontend/types/pension-form";
import { 
  ensureArray, 
  withDefault,
  toDateObject,
  safeNumberValue 
} from '@/frontend/lib/utils/formUtils';

/**
 * Transforms a CompanyPension API object to CompanyPensionFormData for form usage
 * Handles date conversions, null/undefined values, and nested objects
 * 
 * @param pension - The company pension data from the API
 * @returns The transformed form data ready for use in forms
 */
export const companyPensionToForm = (pension: CompanyPension): CompanyPensionFormData => {
  return {
    type: pension.type,
    name: withDefault(pension.name, ""),
    member_id: pension.member_id.toString(),
    employer: withDefault(pension.employer, ""),
    notes: withDefault(pension.notes, ""),
    start_date: toDateObject(pension.start_date) || new Date(),
    contribution_amount: safeNumberValue(pension.contribution_amount),
    contribution_frequency: pension.contribution_frequency,
    contribution_plan_steps: ensureArray(pension.contribution_plan_steps).map(step => ({
      amount: safeNumberValue(step.amount) ?? 0,
      frequency: step.frequency,
      start_date: toDateObject(step.start_date) || new Date(),
      end_date: step.end_date ? (toDateObject(step.end_date) || undefined) : undefined,
      note: withDefault(step.note, "")
    })),
    statements: ensureArray(pension.statements).map(statement => ({
      id: statement.id,
      statement_date: toDateObject(statement.statement_date) || new Date(),
      value: safeNumberValue(statement.value) ?? 0,
      note: withDefault(statement.note, ""),
      retirement_projections: ensureArray(statement.retirement_projections).map(projection => ({
        id: projection.id,
        retirement_age: safeNumberValue(projection.retirement_age) ?? 0,
        monthly_payout: safeNumberValue(projection.monthly_payout) ?? 0,
        total_capital: safeNumberValue(projection.total_capital) ?? 0
      }))
    }))
  };
};
```

### Insurance Pension Transformer

File: `src/frontend/lib/transformers/insurancePensionTransformers.ts`

```tsx
import { InsurancePension } from "@/frontend/types/pension"
import { InsurancePensionFormData } from "@/frontend/types/pension-form"
import { 
  ensureArray, 
  withDefault,
  toDateObject,
  safeNumberValue 
} from '@/frontend/lib/utils/formUtils'

/**
 * Transforms an InsurancePension API object to InsurancePensionFormData for form usage
 * Handles date conversions, null/undefined values, and nested objects
 * 
 * @param pension - The insurance pension data from the API
 * @returns The transformed form data ready for use in forms
 */
export const insurancePensionToForm = (pension: InsurancePension): InsurancePensionFormData => {
  return {
    type: pension.type,
    name: withDefault(pension.name, ""),
    member_id: pension.member_id.toString(),
    notes: withDefault(pension.notes, ""),
    provider: pension.provider,
    contract_number: withDefault(pension.contract_number, ""),
    start_date: toDateObject(pension.start_date) || new Date(),
    guaranteed_interest: safeNumberValue(pension.guaranteed_interest) ?? 0,
    expected_return: safeNumberValue(pension.expected_return) ?? 0,
    contribution_plan_steps: ensureArray(pension.contribution_plan_steps).map(step => ({
      amount: safeNumberValue(step.amount) ?? 0,
      frequency: step.frequency,
      start_date: toDateObject(step.start_date) || new Date(),
      end_date: step.end_date ? (toDateObject(step.end_date) || undefined) : undefined,
      note: withDefault(step.note, "")
    })),
    statements: ensureArray(pension.statements).map(statement => ({
      id: statement.id,
      pension_id: statement.pension_id,
      statement_date: toDateObject(statement.statement_date) || new Date(),
      value: safeNumberValue(statement.value) ?? 0,
      total_contributions: safeNumberValue(statement.total_contributions) ?? 0,
      total_benefits: safeNumberValue(statement.total_benefits) ?? 0,
      costs_amount: safeNumberValue(statement.costs_amount) ?? 0,
      costs_percentage: safeNumberValue(statement.costs_percentage) ?? 0,
      note: withDefault(statement.note, ""),
      projections: ensureArray(statement.projections).map(projection => ({
        id: projection.id,
        statement_id: statement.id,
        scenario_type: projection.scenario_type,
        return_rate: safeNumberValue(projection.return_rate) ?? 0,
        value_at_retirement: safeNumberValue(projection.value_at_retirement) ?? 0,
        monthly_payout: safeNumberValue(projection.monthly_payout) ?? 0
      }))
    }))
  }
}
```

### Form Reset Hook Usage

```tsx
import { useFormReset } from '@/frontend/lib/hooks/useFormReset';
import { etfPensionToForm } from '@/frontend/lib/transformers/etfPensionTransformers';

// Inside component
const { data: pension, isLoading, error } = usePensionData<ETFPension>(pensionId, PensionType.ETF_PLAN);
const form = useForm<ETFPensionFormData>({ defaultValues });

// Replace complex useEffect with this:
const { resetWithData } = useFormReset({
  data: pension,
  form,
  apiToForm: etfPensionToForm,
  defaultValues
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
  apiToForm: pensionTypeToForm,
  defaultValues
});
``` 