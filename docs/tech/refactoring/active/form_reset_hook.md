# Form Reset Hook Implementation TODO

## Overview

This document outlines the implementation plan for a reusable `useFormReset` hook to standardize form data handling across the application. The hook will address common challenges in form reset logic, including:

- Type mismatches between API and form data
- Complex nested data structures
- Date format conversions
- Default value handling
- Enum validation and transformation

## 1. Core Hook Implementation

### 1.1 Create Base Hook Structure

Create a new file at `src/frontend/lib/hooks/useFormReset.ts` with the following structure:

```typescript
import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useSettings } from '@/lib/hooks/useSettings';

export interface FormResetOptions<ApiType, FormType> {
  // Data to reset form with
  data: ApiType | null | undefined;
  
  // Form instance from react-hook-form
  form: UseFormReturn<FormType>;
  
  // Transform API data to form data
  apiToForm: (data: ApiType) => FormType;
  
  // Default values when data is null/undefined
  defaultValues?: Partial<FormType>;
  
  // Additional dependencies that should trigger reset
  dependencies?: any[];
  
  // Optional callback after reset
  onReset?: (formData: FormType) => void;
}

export function useFormReset<ApiType, FormType>({
  data,
  form,
  apiToForm,
  defaultValues,
  dependencies = [],
  onReset
}: FormResetOptions<ApiType, FormType>) {
  const { settings } = useSettings();
  
  useEffect(() => {
    if (data) {
      // Transform API data to form data
      const formData = apiToForm(data);
      
      // Reset form with transformed data
      form.reset(formData);
      
      // Call optional callback
      if (onReset) {
        onReset(formData);
      }
    } else if (defaultValues) {
      // Reset with default values if data is null/undefined
      form.reset(defaultValues);
    }
  }, [data, form, ...dependencies]);
  
  return {
    // Return utility functions that might be useful for forms
    resetWithData: (newData: ApiType) => {
      const formData = apiToForm(newData);
      form.reset(formData);
      if (onReset) {
        onReset(formData);
      }
    }
  };
}
```

### 1.2 Create Common Transformation Utilities

Create a new file at `src/frontend/lib/utils/formTransformers.ts` with common transformation functions:

```typescript
import { format, parse } from 'date-fns';
import { getDecimalSeparator } from '@/lib/utils/formatters';

// Date transformers
export const dateToString = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  return format(date, 'yyyy-MM-dd');
};

export const stringToDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  return parse(dateStr, 'yyyy-MM-dd', new Date());
};

// Number transformers
export const apiNumberToFormString = (
  value: number | null | undefined, 
  locale: string
): string => {
  if (value === null || value === undefined) return '';
  const decimalSeparator = getDecimalSeparator(locale);
  return value.toString().replace('.', decimalSeparator);
};

export const formStringToApiNumber = (
  value: string | null | undefined, 
  locale: string
): number | null => {
  if (!value) return null;
  const decimalSeparator = getDecimalSeparator(locale);
  return parseFloat(value.replace(decimalSeparator, '.'));
};

// Array transformers
export const ensureArray = <T>(value: T[] | null | undefined): T[] => {
  return value || [];
};

// Default value handlers
export const withDefault = <T>(value: T | null | undefined, defaultValue: T): T => {
  return (value === null || value === undefined) ? defaultValue : value;
};
```

### 1.3 Create Form-Specific Transformer Types

Create a new file at `src/frontend/types/formTransformers.ts` with type definitions:

```typescript
import { 
  CompanyPension, 
  InsurancePension, 
  ETFPension,
  CompanyPensionFormData,
  InsurancePensionFormData,
  ETFPensionFormData,
  ContributionFrequency,
  PensionType
} from '@/types/pension';
import { Member, MemberFormData } from '@/types/household';
import { Settings, SettingsFormData } from '@/types/settings';

// Define transformer types for each form
export type CompanyPensionTransformer = (data: CompanyPension) => CompanyPensionFormData;
export type InsurancePensionTransformer = (data: InsurancePension) => InsurancePensionFormData;
export type ETFPensionTransformer = (data: ETFPension) => ETFPensionFormData;
export type MemberTransformer = (data: Member) => MemberFormData;
export type SettingsTransformer = (data: Settings) => SettingsFormData;
```

## 2. Form-Specific Transformer Implementations

### 2.1 Company Pension Transformers

Create a new file at `src/frontend/lib/transformers/companyPensionTransformers.ts`:

```typescript
import { CompanyPension, CompanyPensionFormData } from '@/types/pension';
import { 
  dateToString, 
  stringToDate, 
  apiNumberToFormString,
  formStringToApiNumber,
  ensureArray,
  withDefault
} from '@/lib/utils/formTransformers';

export const companyPensionToForm = (
  pension: CompanyPension,
  locale: string
): CompanyPensionFormData => {
  return {
    name: withDefault(pension.name, ''),
    provider: withDefault(pension.provider, ''),
    policy_number: withDefault(pension.policy_number, ''),
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

// Additional transformers for other company pension form types
```

### 2.2 Insurance Pension Transformers

Create a new file at `src/frontend/lib/transformers/insurancePensionTransformers.ts` with similar structure.

### 2.3 ETF Pension Transformers

Create a new file at `src/frontend/lib/transformers/etfPensionTransformers.ts` with similar structure.

### 2.4 Household Member Transformers

Create a new file at `src/frontend/lib/transformers/memberTransformers.ts` with similar structure.

### 2.5 Settings Transformers

Create a new file at `src/frontend/lib/transformers/settingsTransformers.ts` with similar structure.

## 3. Form Integration Tasks

### 3.1 Company Pension Forms

#### 3.1.1 Edit Company Pension Form

1. Update `src/frontend/app/pension/company/[id]/edit/page.tsx`:
   - Import the `useFormReset` hook and company pension transformer
   - Replace the current reset logic with the hook
   - Remove manual transformation code

```typescript
// Example implementation
import { useFormReset } from '@/lib/hooks/useFormReset';
import { companyPensionToForm } from '@/lib/transformers/companyPensionTransformers';

// Inside component
const { data: pension, isLoading, error } = usePensionData<CompanyPension>(pensionId, PensionType.COMPANY);
const form = useForm<CompanyPensionFormData>({ defaultValues: defaultCompanyPensionValues });

// Replace complex useEffect with this:
const { resetWithData } = useFormReset({
  data: pension,
  form,
  apiToForm: (data) => companyPensionToForm(data, settings.number_locale),
  defaultValues: defaultCompanyPensionValues,
  dependencies: [settings.number_locale]
});

// Remove all the manual reset logic in useEffect
```

2. Update `src/frontend/components/pension/company/forms/EditCompanyPensionForm.tsx`:
   - Remove any remaining manual reset logic
   - Update input state initialization if needed

#### 3.1.2 Add Company Pension Form

1. Update `src/frontend/app/pension/company/new/page.tsx`:
   - Import the `useFormReset` hook
   - Replace any manual initialization with the hook
   - Use default values with the hook

### 3.2 Insurance Pension Forms

#### 3.2.1 Edit Insurance Pension Form

1. Update `src/frontend/app/pension/insurance/[id]/edit/page.tsx` with similar changes.
2. Update `src/frontend/components/pension/insurance/forms/EditInsurancePensionForm.tsx` with similar changes.

#### 3.2.2 Add Insurance Pension Form

1. Update `src/frontend/app/pension/insurance/new/page.tsx` with similar changes.

### 3.3 ETF Pension Forms

#### 3.3.1 Edit ETF Pension Form

1. Update `src/frontend/app/pension/etf/[id]/edit/page.tsx` with similar changes.
2. Update `src/frontend/components/pension/etf/forms/EditETFPensionForm.tsx` with similar changes.

#### 3.3.2 Add ETF Pension Form

1. Update `src/frontend/app/pension/etf/new/page.tsx` with similar changes.

### 3.4 Household Member Forms

1. Update member form components with similar changes.

### 3.5 Settings Forms

1. Update settings form components with similar changes.

## 4. Testing

### 4.1 Unit Tests for Core Hook

1. Create `src/frontend/lib/hooks/__tests__/useFormReset.test.ts`:
   - Test basic reset functionality
   - Test with null/undefined data
   - Test with dependencies
   - Test with custom transformers

### 4.2 Unit Tests for Transformers

1. Create test files for each transformer:
   - Test date transformations
   - Test number transformations
   - Test nested data transformations
   - Test edge cases (null, undefined)

### 4.3 Integration Tests

1. Update existing form tests to use the new hook
2. Test form reset behavior with various data scenarios

## 5. Documentation

### 5.1 Hook Documentation

1. Add JSDoc comments to the hook and transformer functions
2. Create usage examples for different form types

### 5.2 Update Form Architecture Documentation

1. Update `docs/tech/best-practices/form_architecture.md` to include information about the form reset hook
2. Add examples of using the hook in the form architecture pattern

## 6. Implementation Order

For a phased implementation approach, follow this order:

1. Core hook and utilities implementation
2. Company Pension forms (highest complexity)
3. Insurance Pension forms
4. ETF Pension forms
5. Household Member forms
6. Settings forms

## 7. Form-Specific Implementation Details

### 7.1 Company Pension Form Reset

The Edit Company Pension Form has these specific requirements:

- Handle nested contribution steps with dates and amounts
- Handle nested statements with dates, values, and projections
- Initialize input state for contribution amounts and statement values
- Format numbers according to locale settings
- Handle enum values for contribution frequency

Implementation tasks:
1. Create transformer that handles all nested structures
2. Update form to use the hook
3. Modify input state initialization to work with the hook
4. Test with various pension data scenarios

### 7.2 Insurance Pension Form Reset

The Insurance Pension Form has these specific requirements:
- Handle dates for contract start/end
- Handle contribution frequency enum
- Format premium amounts according to locale

Implementation tasks similar to Company Pension.

### 7.3 ETF Pension Form Reset

The ETF Pension Form has these specific requirements:
- Handle contribution steps with dates and amounts
- Format investment amounts according to locale

Implementation tasks similar to Company Pension.

### 7.4 Member Form Reset

The Member Form has these specific requirements:
- Handle birth date and retirement date
- Format income according to locale

Implementation tasks similar but simpler than pension forms.

### 7.5 Settings Form Reset

The Settings Form has these specific requirements:
- Handle locale and currency settings
- Handle theme preferences

Implementation tasks are simpler than other forms.

## 8. Benefits and Expected Outcomes

Implementing this hook will provide:

1. **Reduced Code Duplication**: Eliminate repetitive transformation logic
2. **Improved Type Safety**: Better typing for transformations
3. **Consistent Behavior**: Standardized approach to form resets
4. **Easier Maintenance**: Centralized logic for common transformations
5. **Better Error Handling**: Consistent handling of edge cases
6. **Improved Developer Experience**: Simpler, more declarative form code

## 9. Potential Challenges and Mitigations

1. **Complex Nested Structures**: Use recursive transformers for deeply nested data
2. **Form-Specific Edge Cases**: Allow custom transformers for special cases
3. **Performance Concerns**: Optimize transformers for large data structures
4. **Migration Complexity**: Implement gradually, starting with most complex forms

## 10. Conclusion

The form reset hook implementation will significantly improve the maintainability and reliability of forms throughout the application. By centralizing transformation logic and standardizing the approach to form resets, we can reduce bugs, improve developer experience, and ensure consistent behavior across all forms. 