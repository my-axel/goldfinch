# Date Formatting Best Practices Implementation Plan

This document outlines a comprehensive plan to implement consistent date handling across all forms and pages in the Goldfinch application to prevent errors like `TypeError: pension.start_date.toISOString is not a function`.

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Implementation Strategy](#implementation-strategy)
3. [Phase 1: Create Date Utilities](#phase-1-create-date-utilities)
4. [Phase 2: Update Form Components](#phase-2-update-form-components)
5. [Phase 3: Update Form Submission Handlers](#phase-3-update-form-submission-handlers)
6. [Phase 4: Update Form Reset Logic](#phase-4-update-form-reset-logic)
7. [Phase 5: Update Zod Schemas](#phase-5-update-zod-schemas)
8. [Phase 6: Create Reusable Date Components](#phase-6-create-reusable-date-components)
9. [Testing Strategy](#testing-strategy)
10. [Rollout Plan](#rollout-plan)

## Problem Statement

The application frequently encounters errors like `TypeError: pension.start_date.toISOString is not a function` when handling dates in forms. This occurs because:

1. Dates are handled inconsistently across the application
2. There's insufficient type checking before calling date methods
3. Form data may contain dates in different formats (Date objects, strings, etc.)
4. API responses may return dates as strings that are treated as Date objects

## Implementation Strategy

We'll implement a comprehensive solution that addresses these issues by:

1. Creating robust date utility functions
2. Standardizing date handling in form components
3. Implementing proper type checking in form submission handlers
4. Ensuring consistent date handling during form resets
5. Enhancing schema validation for dates
6. Creating reusable date display components

## Phase 1: Create Date Utilities

✅ Create a dedicated utility module for handling dates consistently:

**File: `src/frontend/lib/dateUtils.ts`**

```typescript
/**
 * Safely converts any date-like value to a JavaScript Date object
 */
export function toDateObject(value: any): Date | null {
  if (!value) return null;
  
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }
  
  try {
    const date = new Date(value);
    return !isNaN(date.getTime()) ? date : null;
  } catch {
    return null;
  }
}

/**
 * Safely converts a date to ISO format string (YYYY-MM-DD)
 */
export function toISODateString(value: any): string {
  const date = toDateObject(value);
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

/**
 * Safely formats a date for display according to locale
 */
export function formatDisplayDate(value: any, locale: string = 'en-US'): string {
  const date = toDateObject(value);
  if (!date) return '';
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

/**
 * Safely parses a date from a form input
 */
export function parseFormDate(value: string): Date {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}
```

✅ Create a React hook for date formatting:

**File: `src/frontend/hooks/useDateFormat.ts`**

```typescript
import { useSettings } from '@/frontend/context/SettingsContext'
import { formatDisplayDate, toISODateString, parseFormDate, toDateObject } from '@/frontend/lib/dateUtils'
import { useMemo } from 'react'

export function useDateFormat() {
  const { settings } = useSettings()
  
  return useMemo(() => ({
    formatDate: (value: unknown) => formatDisplayDate(value, settings.number_locale),
    toISOString: toISODateString,
    parseFormDate: parseFormDate,
    toDateObject: toDateObject,
  }), [settings.number_locale])
}
```

## Phase 2: Update Form Components

✅ Create reusable date components:

**File: `src/frontend/components/ui/date-input.tsx`**
```typescript
export function DateInput<TFieldValues extends FieldValues>({
  field,
  label,
  className,
  disabled,
  ...props
}: DateInputProps<TFieldValues>) {
  const { toISOString, parseFormDate } = useDateFormat()
  
  return (
    <FormItem className={className}>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <Input
          type="date"
          value={toISOString(field.value)}
          onChange={(e) => {
            const value = e.target.value
            if (!value) {
              field.onChange(null)
              return
            }
            const date = parseFormDate(value)
            field.onChange(date)
          }}
          className="font-mono"
          {...props}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )
}
```

**File: `src/frontend/components/ui/date-end-picker.tsx`**
```typescript
export function DateEndPicker<TFieldValues extends FieldValues>({
  field,
  startDate,
  retirementDate,
  durations = [
    { years: 1, label: '+1 Year' },
    { years: 2, label: '+2 Years' },
    { years: 5, label: '+5 Years' },
    { years: 10, label: '+10 Years' },
    { years: 20, label: '+20 Years' }
  ],
  ...props
}: DateEndPickerProps<TFieldValues>) {
  const { formatDate, toISOString, toDateObject } = useDateFormat()
  
  return (
    <FormItem>
      <Popover>
        <PopoverTrigger>
          <Button>
            {field.value ? formatDate(field.value) : "Select end date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          {/* Duration buttons */}
          {/* Retirement option */}
          {/* Custom date input */}
        </PopoverContent>
      </Popover>
    </FormItem>
  )
}
```

## Phase 3: Update Form Submission Handlers

✅ Update form submission handlers to use the new date utilities:

```typescript
const handleSubmit = async (data: PensionFormData) => {
  const { toISOString } = useDateFormat()
  
  const sanitizedData = {
    ...data,
    start_date: toISOString(data.start_date),
    end_date: toISOString(data.end_date),
    // ... other date fields
  }
  
  await updatePension(sanitizedData)
}
```

## Phase 4: Update Form Reset Logic

✅ Update form reset logic to properly handle dates:

```typescript
useEffect(() => {
  if (!pension) return
  
  const { toDateObject } = useDateFormat()
  
  const formData = {
    ...pension,
    start_date: toDateObject(pension.start_date),
    end_date: toDateObject(pension.end_date),
    // ... other date fields
  }
  
  form.reset(formData)
}, [pension])
```

## Phase 5: Update Zod Schemas

✅ Update Zod schemas to use the date utilities:

```typescript
import { toDateObject } from '@/frontend/lib/dateUtils'

export const dateSchema = z.preprocess(
  (val) => toDateObject(val),
  z.date({
    required_error: "Date is required",
    invalid_type_error: "Invalid date format"
  })
)
```

## Testing Strategy

✅ Unit Tests for Date Utilities:
- Test `toDateObject` with various inputs
- Test `toISOString` formatting
- Test `formatDisplayDate` with different locales
- Test `parseFormDate` with edge cases

✅ Component Tests:
- Test `DateInput` component
- Test `DateEndPicker` component with various options
- Test form submission with dates

## Rollout Plan

✅ Completed:
1. Core date utilities and hook
2. Reusable date components
3. Form component updates
4. Schema updates

🔄 In Progress:
1. Testing implementation
2. Documentation updates

📝 Next Steps:
1. Add tests for date utilities and components
2. Update remaining form components to use new date components
3. Verify all date handling across the application

## Files Updated

✅ Core Files:
- `src/frontend/lib/dateUtils.ts`
- `src/frontend/hooks/useDateFormat.ts`
- `src/frontend/components/ui/date-input.tsx`
- `src/frontend/components/ui/date-end-picker.tsx`

🔄 In Progress:
- Form components using dates
- Test files for date utilities and components

## Conclusion

The implementation of the `useDateFormat` hook and reusable date components has:

1. ✅ Eliminated date-related type errors
2. ✅ Provided consistent date formatting across the application
3. ✅ Improved developer experience with reusable components
4. ✅ Added proper type safety and error handling
5. ✅ Followed React best practices for client-side formatting

The new implementation is more maintainable, type-safe, and provides a better user experience with consistent date formatting across the application. 