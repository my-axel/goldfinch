# Formatting Best Practices

This guide outlines best practices for formatting numbers, currencies, percentages, and dates in our Next.js application, with a focus on avoiding hydration mismatches.

## Table of Contents

1. Understanding Hydration Mismatches
2. Formatting Utilities
3. Client-Side Only Formatting Pattern
4. Examples
5. Common Pitfalls

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