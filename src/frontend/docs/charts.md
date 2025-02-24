# Chart Components Documentation

## Overview

The chart components provide a comprehensive set of visualizations for financial data, built on top of Recharts. These components ensure consistent styling, proper error handling, and responsive design while respecting user preferences for number formatting and localization.

## Features

- Responsive chart layouts
- Consistent theme across all charts
- Error boundaries with retry functionality
- Loading states and skeletons
- Locale-aware number formatting
- Interactive tooltips
- Accessibility support
- Type-safe interfaces

## Core Components

### ChartWrapper
```typescript
interface ChartWrapperProps {
  title?: string
  isLoading?: boolean
  height?: number
  className?: string
  withCard?: boolean
  children: ReactNode
}
```

A wrapper component that provides consistent layout and loading states for all charts.

**Example**
```tsx
<ChartWrapper
  title="Chart Title"
  isLoading={isLoading}
  height={300}
>
  {/* Chart content */}
</ChartWrapper>
```

### ChartErrorBoundary
```typescript
interface ChartErrorBoundaryProps {
  children: ReactNode
  title?: string
  height?: number
  className?: string
  withCard?: boolean
}
```

Error boundary specifically designed for chart components. Catches rendering errors and provides retry functionality.

**Example**
```tsx
<ChartErrorBoundary>
  <ContributionHistoryChart data={data} />
</ChartErrorBoundary>
```

### ChartTooltip
```typescript
interface ChartTooltipProps {
  active?: boolean
  payload?: Payload<number, string>[]
  title?: string
  children?: ReactNode
}
```

Consistent tooltip component used across all charts.

## Chart Components

### ContributionHistoryChart
```typescript
interface ContributionHistoryChartProps {
  data: ContributionHistoryResponse[]
  contributionPlan?: ContributionStep[]
  retirementDate?: Date
  isLoading?: boolean
  height?: number
  className?: string
}
```

Displays historical contributions and future projections with a split between actual and planned contributions.

**Features**
- Historical contributions shown as solid line
- Future projections shown as dashed line
- Automatic transition point detection
- Manual contribution indicators
- Interactive tooltips with contribution details
- Proper error handling and loading states

**Example**
```tsx
<ContributionHistoryChart
  data={contributionHistory}
  contributionPlan={pensionPlan.contribution_plan_steps}
  retirementDate={member.retirement_date_planned}
  height={300}
/>
```

### ValueDevelopmentChart
```typescript
interface ValueDevelopmentChartProps {
  data: ValueHistoryResponse[]
  isLoading?: boolean
  height?: number
  className?: string
}
```

Shows the development of the pension's value over time.

**Features**
- Value progression line
- Price point indicators
- Interactive tooltips with value details
- Support for different time ranges
- Proper error handling and loading states

### PerformanceMetricsChart
```typescript
interface PerformanceMetricsChartProps {
  totalInvestedAmount: number
  currentValue: number
  totalReturn: number
  annualReturn?: number
  isLoading?: boolean
  height?: number
  className?: string
}
```

Visualizes key performance metrics of the pension plan.

**Features**
- Total invested amount display
- Current value comparison
- Return metrics visualization
- Interactive tooltips with metric details
- Proper error handling and loading states

## Theme Customization

Charts use a shared theme defined in `chart-theme.ts`:

```typescript
export const chartTheme = {
  grid: {
    strokeDasharray: "3 3",
    stroke: "hsl(var(--muted))"
  },
  xAxis: {
    stroke: "hsl(var(--muted))",
    fontSize: 12
  },
  yAxis: {
    stroke: "hsl(var(--muted))",
    fontSize: 12
  },
  line: {
    strokeWidth: 2
  }
}

export const chartColors = {
  primary: "hsl(var(--primary))",
  muted: "hsl(var(--muted))"
}
```

## Error Handling

All chart components include comprehensive error handling:
- Error boundaries catch rendering errors
- Data processing errors are caught and displayed
- Loading states prevent invalid renders
- Retry functionality for recoverable errors
- Error logging for debugging

## Best Practices

1. **Performance**
   - Use `useMemo` for data processing
   - Implement proper loading states
   - Avoid unnecessary re-renders
   - Keep chart sizes reasonable

2. **Accessibility**
   - Provide meaningful titles
   - Use semantic colors
   - Include proper ARIA labels
   - Support keyboard navigation

3. **Error Handling**
   - Always wrap charts in error boundaries
   - Validate data before processing
   - Provide clear error messages
   - Include retry functionality

4. **Styling**
   - Use the shared chart theme
   - Follow design system colors
   - Ensure responsive behavior
   - Maintain consistent spacing

5. **Type Safety**
   - Use provided interfaces
   - Validate data shapes
   - Handle optional props gracefully
   - Document prop requirements 