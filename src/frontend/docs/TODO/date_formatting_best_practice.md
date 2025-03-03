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

Create a dedicated utility module for handling dates consistently:

**File: `src/frontend/lib/dateUtils.ts`**

```typescript
/**
 * Safely converts any date-like value to a JavaScript Date object
 * Returns null if the input cannot be converted to a valid date
 */
export function toDateObject(value: any): Date | null {
  if (!value) return null;
  
  // Already a Date object
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }
  
  // String or other type
  try {
    const date = new Date(value);
    return !isNaN(date.getTime()) ? date : null;
  } catch {
    return null;
  }
}

/**
 * Safely converts a date to ISO format string (YYYY-MM-DD)
 * Returns empty string if the input is invalid
 */
export function toISODateString(value: any): string {
  const date = toDateObject(value);
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

/**
 * Safely formats a date for display according to locale
 * Returns empty string if the input is invalid
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
 * Returns a proper Date object with time set to midnight UTC
 */
export function parseFormDate(value: string): Date {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

/**
 * Safely processes a date for API submission
 * Handles both Date objects and strings, returning an ISO date string (YYYY-MM-DD)
 * Returns null for null/undefined values
 */
export function processDateForAPI(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return toISODateString(value);
}

/**
 * Safely processes a date from API response
 * Converts string dates to Date objects for form state
 * Returns null for null/undefined values
 */
export function processDateFromAPI(value: string | null | undefined): Date | null {
  if (!value) return null;
  return toDateObject(value);
}
```

## Phase 2: Update Form Components

Update all form components that handle dates to use the new utilities:

### DateInput Component

Create a reusable DateInput component:

**File: `src/frontend/components/ui/DateInput.tsx`**

```typescript
import { Input } from "@/frontend/components/ui/input";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/frontend/components/ui/form";
import { toISODateString, parseFormDate } from "@/frontend/lib/dateUtils";
import { ControllerRenderProps } from "react-hook-form";

interface DateInputProps {
  field: ControllerRenderProps<any, any>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function DateInput({ field, label, placeholder, disabled }: DateInputProps) {
  return (
    <FormItem>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <Input
          type="date"
          placeholder={placeholder}
          disabled={disabled}
          value={toISODateString(field.value)}
          onChange={(e) => {
            field.onChange(parseFormDate(e.target.value));
          }}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
```

### Update Form Components

For each form component that handles dates, update to use the DateInput component:

```typescript
// Example: Update pension form date fields
<FormField
  control={form.control}
  name="start_date"
  render={({ field }) => (
    <DateInput field={field} label="Start Date" />
  )}
/>
```

## Phase 3: Update Form Submission Handlers

Update all form submission handlers to safely process dates:

```typescript
// Example: Update pension form submission
const handleSubmit = async (data: PensionFormData) => {
  try {
    // Create a sanitized copy of the data with properly formatted dates
    const sanitizedData = {
      ...data,
      start_date: processDateForAPI(data.start_date),
      contribution_plan_steps: data.contribution_plan_steps.map(step => ({
        ...step,
        start_date: processDateForAPI(step.start_date),
        end_date: processDateForAPI(step.end_date)
      })),
      statements: data.statements?.map(statement => ({
        ...statement,
        statement_date: processDateForAPI(statement.statement_date),
        retirement_projections: statement.retirement_projections?.map(projection => ({
          ...projection,
          // Process any dates in nested objects
        }))
      })) || []
    };
    
    // Submit the sanitized data
    const result = await updatePension(sanitizedData);
    
    // Handle success
    toast.success("Pension updated successfully");
    router.push(`/pension/${result.id}`);
  } catch (error) {
    console.error("Error submitting form:", error);
    toast.error("Failed to update pension");
  }
};
```

## Phase 4: Update Form Reset Logic

Update form reset logic to properly convert API data to Date objects:

```typescript
// Example: Update pension form reset
useEffect(() => {
  if (!pension || isLoading) {
    return;
  }

  // Convert all dates to proper Date objects
  const formData = {
    ...pension,
    start_date: processDateFromAPI(pension.start_date),
    contribution_plan_steps: pension.contribution_plan_steps.map(step => ({
      ...step,
      start_date: processDateFromAPI(step.start_date),
      end_date: processDateFromAPI(step.end_date)
    })),
    statements: pension.statements?.map(statement => ({
      ...statement,
      statement_date: processDateFromAPI(statement.statement_date),
      retirement_projections: statement.retirement_projections?.map(projection => ({
        ...projection,
        // Process any dates in nested objects
      }))
    })) || []
  };

  form.reset(formData, { keepDefaultValues: false });
}, [pension, isLoading, form]);
```

## Phase 5: Update Zod Schemas

Enhance Zod schemas to properly handle dates:

**File: `src/frontend/lib/validations/dateSchema.ts`**

```typescript
import { z } from "zod";
import { toDateObject } from "@/frontend/lib/dateUtils";

export const dateSchema = z.preprocess(
  (val) => toDateObject(val),
  z.date({
    required_error: "Date is required",
    invalid_type_error: "Invalid date format"
  })
);

export const optionalDateSchema = z.preprocess(
  (val) => val ? toDateObject(val) : undefined,
  z.date().optional()
);
```

Update existing schemas:

```typescript
// Example: Update pension schema
import { dateSchema, optionalDateSchema } from "@/frontend/lib/validations/dateSchema";

export const pensionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  start_date: dateSchema,
  // Other fields...
  contribution_plan_steps: z.array(
    z.object({
      amount: z.number().positive(),
      frequency: z.string(),
      start_date: dateSchema,
      end_date: optionalDateSchema,
      // Other fields...
    })
  )
});
```

## Phase 6: Create Reusable Date Components

Create reusable date display components that follow the client-side only pattern:

**File: `src/frontend/components/ui/DateDisplay.tsx`**

```typescript
"use client"

import { useState, useEffect } from "react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatDisplayDate } from "@/frontend/lib/dateUtils"

interface DateDisplayProps {
  date: Date | string | null | undefined;
  fallback?: string;
}

export function DateDisplay({ date, fallback = "-" }: DateDisplayProps) {
  const { settings } = useSettings()
  const [formattedDate, setFormattedDate] = useState(fallback)

  useEffect(() => {
    if (!date) {
      setFormattedDate(fallback);
      return;
    }
    
    // Format date client-side only after hydration
    const formatted = formatDisplayDate(date, settings.date_locale);
    setFormattedDate(formatted || fallback);
  }, [date, settings, fallback])

  return <span>{formattedDate}</span>
}
```

## Testing Strategy

1. **Unit Tests**:
   - Create unit tests for all date utility functions
   - Test with various input types (Date objects, strings, null, undefined)
   - Test edge cases (invalid dates, different formats)

2. **Component Tests**:
   - Test DateInput component with various input scenarios
   - Test DateDisplay component with different date formats
   - Test form submissions with date fields

3. **Integration Tests**:
   - Test complete form submission flows
   - Test form reset with API data
   - Test error handling for invalid dates

## Rollout Plan

### Step 1: Core Utilities (Week 1)
- Implement dateUtils.ts
- Create DateInput and DateDisplay components
- Write unit tests for utilities and components

### Step 2: Form Components (Week 2-3)
- Update pension form components
- Update household form components
- Update other form components

### Step 3: Form Handlers (Week 3-4)
- Update form submission handlers
- Update form reset logic
- Update Zod schemas

### Step 4: Testing and Validation (Week 4-5)
- Comprehensive testing across all forms
- Fix any issues discovered during testing
- Document any edge cases or special considerations

### Step 5: Documentation and Training (Week 5)
- Update documentation with new best practices
- Conduct knowledge sharing session with the team
- Create examples for common date handling scenarios

## Files to Update

### Form Components
- `src/frontend/components/pension/company/forms/*.tsx`
- `src/frontend/components/pension/etf/forms/*.tsx`
- `src/frontend/components/pension/insurance/forms/*.tsx`
- `src/frontend/components/household/*.tsx`
- `src/frontend/components/pension/company/ContributionPlanCard.tsx`
- `src/frontend/components/pension/company/PensionStatementsCard.tsx`
- `src/frontend/components/pension/company/YearlyInvestmentModal.tsx`

### Page Components
- `app/pension/company/new/page.tsx`
- `app/pension/company/[id]/edit/page.tsx`
- `app/pension/etf/new/page.tsx`
- `app/pension/etf/[id]/edit/page.tsx`
- `app/pension/insurance/new/page.tsx`
- `app/pension/insurance/[id]/edit/page.tsx`
- `app/household/new/page.tsx`
- `app/household/[id]/edit/page.tsx`

### Validation Schemas
- `src/frontend/lib/validations/*.ts`

### Utility Functions
- Create `src/frontend/lib/dateUtils.ts`
- Update `src/frontend/lib/transforms.ts` if needed

## Conclusion

By implementing this comprehensive plan, we will:

1. Eliminate `TypeError: pension.start_date.toISOString is not a function` errors
2. Ensure consistent date handling across the application
3. Improve type safety and error handling
4. Provide a better developer experience with reusable components
5. Follow best practices for date handling in Next.js applications

This implementation will make the codebase more robust, maintainable, and less prone to date-related errors. 