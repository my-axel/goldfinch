# Chart Components Documentation (Current)

## Overview

Chart UI is implemented in `src/frontend/components/charts` and built on Recharts.

## Available components

- `ChartWrapper`
- `ChartErrorBoundary`
- `ChartTooltip`
- `ChartLegend`
- `ContributionHistoryChart`
- `CombinedProjectionChart`
- `chart-theme.ts` (shared theme constants)

## Typical usage

```tsx
<ChartErrorBoundary>
  <ChartWrapper title="Contribution History" isLoading={isLoading}>
    <ContributionHistoryChart data={data} />
  </ChartWrapper>
</ChartErrorBoundary>
```

## Capabilities

- Responsive chart containers
- Shared theme and tooltip patterns
- Error boundaries for chart rendering failures
- Loading state wrappers

## Notes

- Historical docs may mention chart components that are not present in the current codebase.
- Treat this file as the source of truth for currently available chart components.
