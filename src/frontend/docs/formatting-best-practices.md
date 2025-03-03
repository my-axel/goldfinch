# Formatting Best Practices

This guide outlines best practices for formatting numbers, currencies, percentages, and dates in our Next.js application, with a focus on avoiding hydration mismatches.

## Table of Contents

1. Understanding Hydration Mismatches
2. Formatting Utilities
3. Client-Side Only Formatting Pattern
4. Examples
5. Common Pitfalls
6. Date Handling in Forms
7. DateUtils Utility

## Understanding Hydration Mismatches

In Next.js applications, components can be rendered on both the server and client. Hydration mismatches occur when the server-rendered HTML doesn't match what the client would render. This commonly happens with:

- Date formatting (different timezones)
- Number formatting (different locales)
- Currency formatting (different symbols and formats)

These mismatches cause React to discard the server-rendered HTML and re-render everything on the client, which can lead to:

- Flickering UI
- Poor performance
- Console errors

## Formatting Utilities

Our application provides several formatting utilities in `src/frontend/lib/transforms.ts`:

### `formatNumber(value, options)`

Formats a number according to the user's locale preferences.

```typescript
import { formatNumber } from "@/frontend/lib/transforms"

// Example
formatNumber(1234.56, { 
  locale: 'de-DE',
  decimals: 2 
}).formatted // Returns "1.234,56"
```

### `formatCurrency(value, options)`

Formats a currency value with the appropriate symbol.

```typescript
import { formatCurrency } from "@/frontend/lib/transforms"

// Example
formatCurrency(1234.56, { 
  locale: 'de-DE',
  currency: 'EUR' 
}).formatted // Returns "1.234,56 €"
```

### `formatPercent(value, options)`

Formats a decimal value as a percentage.

```typescript
import { formatPercent } from "@/frontend/lib/transforms"

// Example
formatPercent(0.1234, { 
  locale: 'de-DE',
  decimals: 1 
}).formatted // Returns "12,3%"
```

### `formatDate(date, options)`

Formats a date according to the user's locale preferences.

```typescript
import { formatDate } from "@/frontend/lib/transforms"

// Example
formatDate('2024-05-15', { 
  locale: 'de-DE' 
}).formatted // Returns "15.05.2024"
```

## Client-Side Only Formatting Pattern

To avoid hydration mismatches, follow this pattern for formatting in client components:

1. Use `useState` to initialize with simple values
2. Use `useEffect` to update with formatted values after hydration
3. Use the formatted values from state in your JSX

### Pattern Template

```tsx
"use client"

import { useState, useEffect } from "react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatCurrency } from "@/frontend/lib/transforms"

function MyComponent({ value }) {
  const { settings } = useSettings()
  const [formattedValue, setFormattedValue] = useState("0")

  useEffect(() => {
    // Format values client-side only after hydration
    setFormattedValue(formatCurrency(value, {
      locale: settings.number_locale,
      currency: settings.currency
    }).formatted)
  }, [value, settings])

  return <div>{formattedValue}</div>
}
```

## Examples

### Example 1: Formatting Multiple Values

```tsx
"use client"

import { useState, useEffect } from "react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatCurrency, formatPercent } from "@/frontend/lib/transforms"

function InvestmentSummary({ principal, returns, rate }) {
  const { settings } = useSettings()
  const [formatted, setFormatted] = useState({
    principal: "0",
    returns: "0",
    rate: "0%"
  })

  useEffect(() => {
    setFormatted({
      principal: formatCurrency(principal, {
        locale: settings.number_locale,
        currency: settings.currency
      }).formatted,
      returns: formatCurrency(returns, {
        locale: settings.number_locale,
        currency: settings.currency
      }).formatted,
      rate: formatPercent(rate, {
        locale: settings.number_locale,
        decimals: 1
      }).formatted
    })
  }, [principal, returns, rate, settings])

  return (
    <div>
      <p>Principal: {formatted.principal}</p>
      <p>Returns: {formatted.returns}</p>
      <p>Rate: {formatted.rate}</p>
    </div>
  )
}
```

### Example 2: Conditional Formatting

```tsx
"use client"

import { useState, useEffect } from "react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatCurrency } from "@/frontend/lib/transforms"
import { cn } from "@/frontend/lib/utils"

function ProfitLossIndicator({ value }) {
  const { settings } = useSettings()
  const [formatted, setFormatted] = useState({
    value: "0",
    isPositive: false
  })

  useEffect(() => {
    setFormatted({
      value: formatCurrency(value, {
        locale: settings.number_locale,
        currency: settings.currency
      }).formatted,
      isPositive: value >= 0
    })
  }, [value, settings])

  return (
    <span className={cn(
      formatted.isPositive ? "text-green-600" : "text-red-600"
    )}>
      {formatted.value}
    </span>
  )
}
```

## Common Pitfalls

### ❌ Avoid Direct Formatting in JSX

```tsx
// BAD - Will cause hydration mismatches
return (
  <div>
    {formatCurrency(value, { 
      locale: settings.number_locale, 
      currency: settings.currency 
    }).formatted}
  </div>
)
```

### ✅ Use State and Effects Instead

```tsx
// GOOD - Client-side only formatting
const [formattedValue, setFormattedValue] = useState("0")

useEffect(() => {
  setFormattedValue(formatCurrency(value, {
    locale: settings.number_locale,
    currency: settings.currency
  }).formatted)
}, [value, settings])

return <div>{formattedValue}</div>
```

### ❌ Avoid Formatting in Server Components

Server components should not use locale-specific formatting. If you need formatted values, either:

1. Use a client component for the formatting part
2. Pass raw values to client components and let them handle formatting

### ❌ Avoid Direct Use of `toLocaleString()`

```tsx
// BAD - Inconsistent and can cause hydration mismatches
return <div>{value.toLocaleString()} €</div>
```

### ✅ Use Our Formatting Utilities

```tsx
// GOOD - Consistent formatting with our utilities
const [formattedValue, setFormattedValue] = useState("0")

useEffect(() => {
  setFormattedValue(formatCurrency(value, {
    locale: settings.number_locale,
    currency: settings.currency
  }).formatted)
}, [value, settings])

return <div>{formattedValue}</div>
```

By following these best practices, we can ensure consistent formatting throughout the application while avoiding hydration mismatches.

## Date Handling in Forms

### Understanding Date Type Inconsistencies

When working with dates in forms, especially in a form submission flow that involves multiple steps (form → context → API), dates can arrive in different formats. This can lead to runtime errors when trying to call methods like `toISOString()`.

Common scenarios where this occurs:
- Form components handling dates as `Date` objects
- Data transformation converting dates to strings
- API responses returning date strings
- Nested objects with multiple date fields

### Best Practices for Form Date Handling

#### 1. Form Component Level

Always ensure dates are stored as Date objects in form state:

```typescript
// In form components
onChange={(e) => {
  const date = new Date(e.target.value)
  date.setUTCHours(0, 0, 0, 0)  // Ensure UTC midnight
  field.onChange(date)
}}
```

#### 2. Context/Service Level

Handle both possible types when processing dates:

```typescript
// Utility function for robust date handling
const ensureDateString = (date: Date | string | undefined | null): string | null => {
  if (!date) return null
  if (date instanceof Date) {
    return date.toISOString().split('T')[0]
  }
  return new Date(date).toISOString().split('T')[0]
}

// Usage in data transformation
const processFormData = (formData: FormData) => {
  return {
    start_date: ensureDateString(formData.start_date),
    steps: formData.steps.map(step => ({
      ...step,
      start_date: ensureDateString(step.start_date),
      end_date: ensureDateString(step.end_date)
    }))
  }
}
```

### Common Date Handling Patterns

#### ❌ Avoid Direct Date Method Calls Without Type Checking

```typescript
// BAD - Assumes date is always a Date object
const dateString = formData.start_date.toISOString()
```

#### ✅ Use Type Guards and Safe Date Processing

```typescript
// GOOD - Handles both Date objects and strings safely
const processDate = (dateField: Date | string) => {
  if (dateField instanceof Date) {
    return dateField.toISOString().split('T')[0]
  }
  return new Date(dateField).toISOString().split('T')[0]
}
```

### Key Guidelines for Date Handling

1. Always validate date types before calling `toISOString()`
2. Use type guards or instanceof checks for Date objects
3. Implement utility functions for consistent date processing
4. Set UTC midnight for all dates to avoid timezone issues
5. Handle nullable date fields appropriately
6. Consider implementing a centralized date processing utility

By following these patterns, you can ensure robust date handling across your application, preventing type-related errors and providing consistent date formatting for API submissions.

### Implementation Plan

For a comprehensive implementation plan to address date handling issues across the application, refer to the detailed guide in `src/frontend/docs/TODO/date_formatting_best_practice.md`. This document outlines a step-by-step approach to standardize date handling, including:

- Creating robust date utility functions
- Implementing reusable date input components
- Standardizing form submission handlers
- Enhancing schema validation for dates
- Testing strategies and rollout plan

## DateUtils Utility

To standardize date handling across the application, we've created a dedicated utility module (`src/frontend/lib/dateUtils.ts`) with the following key functions:

### `toDateObject(value: any): Date | null`

Safely converts any date-like value to a JavaScript Date object:

```typescript
import { toDateObject } from "@/frontend/lib/dateUtils"

// Examples
toDateObject("2024-05-15") // Returns Date object
toDateObject(new Date()) // Returns the same Date object
toDateObject("invalid") // Returns null
toDateObject(null) // Returns null
```

### `toISODateString(value: any): string`

Safely converts a date to ISO format string (YYYY-MM-DD):

```typescript
import { toISODateString } from "@/frontend/lib/dateUtils"

// Examples
toISODateString("2024-05-15") // Returns "2024-05-15"
toISODateString(new Date(2024, 4, 15)) // Returns "2024-05-15"
toISODateString("invalid") // Returns ""
```

### `processDateForAPI(value: Date | string | null | undefined): string | null`

Safely processes a date for API submission:

```typescript
import { processDateForAPI } from "@/frontend/lib/dateUtils"

// Examples
processDateForAPI(new Date(2024, 4, 15)) // Returns "2024-05-15"
processDateForAPI("2024-05-15") // Returns "2024-05-15"
processDateForAPI(null) // Returns null
```

### `processDateFromAPI(value: string | null | undefined): Date | null`

Safely processes a date from API response:

```typescript
import { processDateFromAPI } from "@/frontend/lib/dateUtils"

// Examples
processDateFromAPI("2024-05-15") // Returns Date object
processDateFromAPI(null) // Returns null
```

### Reusable Date Components

For consistent date handling in forms, use the reusable components:

```typescript
// DateInput component for form fields
<FormField
  control={form.control}
  name="start_date"
  render={({ field }) => (
    <DateInput field={field} label="Start Date" />
  )}
/>

// DateDisplay component for displaying dates
<DateDisplay date={pension.start_date} fallback="Not set" />
```

By using these utilities and components consistently, we can prevent common date-related errors and ensure a consistent user experience across the application. 