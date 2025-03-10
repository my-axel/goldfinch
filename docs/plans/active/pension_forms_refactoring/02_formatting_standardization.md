# 02: Pension Forms Formatting Standardization

> <details>
> <summary><strong>🤖 AI Assistant Guide</strong></summary>
>
> ## Purpose
> This document is part 2 of 4 in the pension forms standardization series. It focuses specifically on standardizing number, currency, and date formatting across all pension forms.
>
> ## Implementation Order
> 1. Layout Standardization
> 2. **Formatting Standardization** (this document)
> 3. Form Reset Implementation
> 4. Per-Pension Type Implementation
>
> ## Dependencies
> - No external dependencies, but works best after layout standardization
>
> ## Expected Outcome
> All pension forms will use consistent formatting patterns and utilities from `transforms.ts` for numbers, currencies, and dates.
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
> - Create only the components specified in this document
> - Use the exact file paths provided
> - Follow the implementation details exactly as shown
> - Do not modify any existing components unless explicitly instructed
> - Use the utilities from `src/frontend/lib/transforms.ts` for all formatting
> - All input components should extend shadcn/ui Input component
> - All formatting components should automatically use user settings from SettingsContext
> - Use existing DateInput and DateEndPicker components for date handling
> - For date display, use the useDateFormat hook which uses dateUtils.ts
> </details>

## 📋 Overview & Goals

This plan addresses the inconsistent formatting patterns across pension forms by standardizing the use of centralized formatting utilities. Many forms currently implement custom formatting logic instead of using the robust utilities available in `transforms.ts`.

### Key Goals
1. Eliminate custom formatting logic across all forms
2. Standardize number and currency formatting using `transforms.ts` utilities
3. Ensure consistent date handling with existing DateInput and DateEndPicker components
4. Ensure proper hydration mismatch prevention
5. Optimize performance with appropriate caching and batch updates

### Reference Documents
- [Formatting Best Practices](docs/tech/best-practices/formatting.md)

## 📊 Implementation Tasks

### 1. Audit Current Formatting Implementations

- [x] **Identify Custom Formatting Logic**
  - [x] Scan ETF Pension forms for custom formatting
  - [x] Scan Company Pension forms for custom formatting
  - [x] Scan Insurance Pension forms for custom formatting
  - [x] Document patterns that need to be replaced in the respective pension type plans (04a, 04b, 04c)

- [x] **Identify Hydration Issues**
  - [x] Look for direct JSX formatting (potential hydration mismatches)
  - [x] Document components with inconsistent client/server rendering in the respective pension type plans (04a, 04b, 04c)

### 2. Create Reusable Formatting Components

- [x] **Create Value Display Components**
  - [x] Create `FormattedCurrency` component in `src/frontend/components/shared/formatting/FormattedCurrency.tsx`
  - [x] Create `FormattedNumber` component in `src/frontend/components/shared/formatting/FormattedNumber.tsx`
  - [x] Create `FormattedPercent` component in `src/frontend/components/shared/formatting/FormattedPercent.tsx`
  - [x] Create `FormattedDate` component in `src/frontend/components/shared/formatting/FormattedDate.tsx`
  - [x] Create `FormattedEnum` component in `src/frontend/components/shared/formatting/FormattedEnum.tsx`
  - [x] Create `FormattedFrequency` component in `src/frontend/components/shared/formatting/FormattedFrequency.tsx`

- [x] **Create Input Handling Components**
  - [x] Create `NumberInput` component in `src/frontend/components/shared/inputs/NumberInput.tsx`
  - [x] Create `CurrencyInput` component in `src/frontend/components/shared/inputs/CurrencyInput.tsx`
  - [x] Create `PercentInput` component in `src/frontend/components/shared/inputs/PercentInput.tsx`

- [x] **Verify Existing Date Components**
  - [x] Confirm `DateInput` and `DateEndPicker` components use the correct utilities
  - [x] Verified they use the `useDateFormat` hook which uses `dateUtils.ts`
  - [x] No modifications needed as they already follow best practices

### 3. Implement Standard Formatting Patterns

- [x] **Replace Direct JSX Formatting**
  - [x] Implement client-side useState/useEffect pattern for all displayed values
  - [x] Ensure proper hydration mismatch prevention

- [x] **Standardize Number Input Handling**
  - [x] Implement consistent pattern using `formatNumberInput` and `parseNumber`
  - [x] Add proper validation with `isValidNumberFormat`
  - [x] Handle locale-specific decimal separators

- [x] **Standardize Date Handling**
  - [x] Use existing `DateInput` and `DateEndPicker` components for all date fields
  - [x] Use `FormattedDate` component for displaying dates
  - [x] Ensure consistent usage across all forms

- [x] **Optimize Performance**
  - [x] Implement formatter caching where appropriate
  - [x] Use batch updates for tables and lists
  - [x] Apply memoization for expensive formatting operations

## 🔍 Implementation Details

### Key Design Principles

1. **Automatic User Settings**: All formatting components automatically use the user's settings from `SettingsContext` (locale, currency, etc.)
2. **Shadcn/UI Foundation**: All input components extend the shadcn/ui Input component for consistent styling and behavior
3. **Hydration Safety**: Components use client-side formatting to prevent hydration mismatches
4. **Type Safety**: All components have proper TypeScript interfaces
5. **Reuse Existing Components**: Use existing DateInput and DateEndPicker components for date handling
6. **Consistent Date Utilities**: Use useDateFormat hook for date formatting which uses dateUtils.ts

### Date Component Integration

The existing `DateInput` and `DateEndPicker` components are already using the recommended approach:
1. They use the `useDateFormat` hook which in turn uses `dateUtils.ts`
2. They respect user locale settings through the hook
3. They handle form integration with react-hook-form

These components should be used consistently across all forms for date input fields.

### FormattedCurrency Component

File: `src/frontend/components/shared/formatting/FormattedCurrency.tsx`

```tsx
import { useState, useEffect } from 'react';
import { useSettings } from '@/frontend/context/SettingsContext';
import { formatCurrency } from '@/frontend/lib/transforms';

interface FormattedCurrencyProps {
  value: number | null | undefined;
  decimals?: number;
  className?: string;
}

export function FormattedCurrency({ 
  value, 
  decimals, 
  className = '' 
}: FormattedCurrencyProps) {
  const [formatted, setFormatted] = useState('');
  const { settings } = useSettings();

  useEffect(() => {
    if (value === null || value === undefined) {
      setFormatted('');
      return;
    }

    const result = formatCurrency(value, {
      locale: settings.number_locale,
      currency: settings.currency,
      decimals
    });

    setFormatted(result.formatted);
  }, [value, settings, decimals]);

  return <span className={className}>{formatted}</span>;
}
```

### NumberInput Component

File: `src/frontend/components/shared/inputs/NumberInput.tsx`

```tsx
import { useState, useEffect } from 'react';
import { useSettings } from '@/frontend/context/SettingsContext';
import { Input } from '@/frontend/components/ui/input';
import { 
  formatNumberInput, 
  parseNumber, 
  getDecimalSeparator 
} from '@/frontend/lib/transforms';

interface NumberInputProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
}

export function NumberInput({ 
  value, 
  onChange, 
  onBlur,
  placeholder,
  className = '',
  min,
  max
}: NumberInputProps) {
  const { settings } = useSettings();
  const [localValue, setLocalValue] = useState('');
  const decimalSeparator = getDecimalSeparator(settings.number_locale);

  // Initialize input state when value changes
  useEffect(() => {
    setLocalValue(formatNumberInput(value, settings.number_locale));
  }, [value, settings.number_locale]);

  // Validate input format based on locale
  const isValidNumberFormat = (input: string): boolean => {
    if (!input) return true;
    const regex = new RegExp(`^-?\\d*\\${decimalSeparator}?\\d*$`);
    return regex.test(input);
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (isValidNumberFormat(newValue)) {
      setLocalValue(newValue);
      const parsedValue = parseNumber(newValue, settings.number_locale);
      
      // Apply min/max constraints if provided
      if (parsedValue !== null) {
        if (min !== undefined && parsedValue < min) return;
        if (max !== undefined && parsedValue > max) return;
      }
      
      onChange(parsedValue);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    const parsedValue = parseNumber(localValue, settings.number_locale);
    if (parsedValue !== null) {
      setLocalValue(formatNumberInput(parsedValue, settings.number_locale));
      onChange(parsedValue);
    } else {
      setLocalValue('');
      onChange(null);
    }
    if (onBlur) onBlur();
  };

  return (
    <Input
      type="text"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      inputMode="decimal"
    />
  );
}
```

### FormattedDate Component

File: `src/frontend/components/shared/formatting/FormattedDate.tsx`

```tsx
import { useState, useEffect } from 'react';
import { useDateFormat } from '@/frontend/hooks/useDateFormat';

interface FormattedDateProps {
  value: Date | string | null | undefined;
  className?: string;
}

export function FormattedDate({ 
  value, 
  className = '' 
}: FormattedDateProps) {
  const [formatted, setFormatted] = useState('');
  const { formatDate } = useDateFormat();

  useEffect(() => {
    if (!value) {
      setFormatted('');
      return;
    }
    
    setFormatted(formatDate(value));
  }, [value, formatDate]);

  return <span className={className}>{formatted}</span>;
}
```

### Usage Examples

#### Display Components

```tsx
// Simple usage - automatically uses user's currency and locale settings
<FormattedCurrency value={1234.56} />

// With custom decimals
<FormattedCurrency value={1234.56} decimals={0} />

// With styling
<FormattedCurrency value={1234.56} className="text-lg font-bold text-green-600" />

// Number with percentage
<FormattedPercent value={0.0567} /> // Displays as 5.67%

// Simple number
<FormattedNumber value={1234.56} /> // Displays as 1,234.56 or 1.234,56 based on locale

// Date formatting
<FormattedDate value={new Date()} /> // Uses default format from settings
<FormattedDate value="2023-05-15" /> // Formats string date
```

#### Input Components

```tsx
// In a form component with react-hook-form
function MyFormComponent() {
  const form = useForm();
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4">
          {/* Number input */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <NumberInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    min={0}
                    placeholder="Enter amount"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {/* Date input */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <DateInput field={field} />
                </FormControl>
              </FormItem>
            )}
          />
          
          {/* Date range input */}
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <DateEndPicker
                    field={field}
                    startDate={form.watch('startDate')}
                    durations={[
                      { years: 1, label: '+1 Year' },
                      { years: 5, label: '+5 Years' }
                    ]}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}
```

### Batch Formatting Example

File: Example for table components

```tsx
function FormattedTable({ data }) {
  const { settings } = useSettings();
  const { formatDate } = useDateFormat();
  const [formattedData, setFormattedData] = useState([]);

  useEffect(() => {
    // Format all values in a single update
    setFormattedData(data.map(item => ({
      ...item,
      amount: formatCurrency(item.amount, {
        locale: settings.number_locale,
        currency: settings.currency
      }).formatted,
      date: formatDate(item.date)
    })));
  }, [data, settings, formatDate]);

  return (
    <Table>
      {formattedData.map(item => (
        <TableRow key={item.id}>
          <TableCell>{item.date}</TableCell>
          <TableCell>{item.amount}</TableCell>
        </TableRow>
      ))}
    </Table>
  );
}
```

### Implementation Pattern for Replacing Direct JSX Formatting

When finding direct JSX formatting like this:

```tsx
// Before: Direct JSX formatting (causes hydration mismatches)
<div>{value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</div>
```

Replace with:

```tsx
// After: Using FormattedCurrency component
<FormattedCurrency value={value} />
```

Or for more complex cases:

```tsx
// After: Using client-side formatting pattern
const [formatted, setFormatted] = useState('');
const { settings } = useSettings();

useEffect(() => {
  if (value !== undefined && value !== null) {
    const result = formatCurrency(value, {
      locale: settings.number_locale,
      currency: settings.currency
    });
    setFormatted(result.formatted);
  } else {
    setFormatted('');
  }
}, [value, settings]);

return <div>{formatted}</div>;
``` 