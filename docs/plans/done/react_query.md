# React Query Implementation Plan

> <details>
> <summary><strong>🤖 AI Assistant Guide</strong></summary>
>
> ## Purpose
> This document outlines the implementation strategy for adopting React Query in the Goldfinch application. It provides a hybrid approach that allows gradual migration from Context-based state management to React Query for data fetching while maintaining Context for UI state.
>
> ## Document Structure
>
> ### 1. Implementation Strategy
> - Overview of the hybrid approach
> - Migration phases and timeline
> - Key principles and patterns
>
> ### 2. Core Implementation Patterns
> - Infrastructure setup
> - API service layer
> - React Query hooks
> - UI state management
> - Formatting integration
>
> ### 3. Migration Path
> - Starting with new features
> - Gradual migration of existing features
> - Testing and validation
>
> ### 4. Specific Module Plans
> - State Pension implementation
> - Savings Pension implementation
> - Dashboard implementation
> - Compass module implementation
>
> ### 5. Remaining Components to Migrate
> - List of components still using context API
> - Migration plan for these components
>
> ## Decision Making Guide
>
> ### When Implementing New Features
> 1. Create API service functions first
> 2. Implement React Query hooks
> 3. Create UI-only Context if needed
> 4. Use the hooks in components
>
> ### When Migrating Existing Features
> 1. Extract API calls to service functions
> 2. Create React Query hooks
> 3. Split existing Context into UI-only Context
> 4. Update components gradually
>
> ### When Handling Formatting
> 1. Follow the patterns in formatting.md
> 2. Use client-side formatting with useEffect
> 3. Separate data fetching from formatting
>
> ## Status Indicators
> - ✅ Ready to implement
> - 🟡 In progress
> - ⚠️ Needs prerequisites
> - 📝 Planning phase
>
> ## Rules & Best Practices
> 1. Keep API service functions pure and separate from React
> 2. Use proper TypeScript types for all hooks and functions
> 3. Handle loading, error, and success states consistently
> 4. Follow the formatting best practices for displaying data
> 5. Implement proper error boundaries
> 6. Use React Server Components where appropriate
> </details>

## 📋 Overview

This plan outlines a hybrid approach for implementing React Query in the Goldfinch application. Rather than a complete rewrite, we'll adopt React Query incrementally, starting with new features and gradually migrating existing ones as needed.

### Why React Query?

React Query provides significant benefits for our application:

1. **Automatic caching** - Reduces redundant API calls
2. **Background refetching** - Keeps data fresh without user interaction
3. **Loading/error states** - Standardized handling of async states
4. **Parallel queries** - Efficient data loading for complex views
5. **Optimistic updates** - Better user experience for mutations

### Hybrid Approach

Our implementation strategy:

1. **Infrastructure Setup** - Add React Query provider to the application
2. **New Features First** - Implement State Pension and Savings Pension using React Query
3. **Complex Features** - Use React Query for Dashboard and Compass modules
4. **Gradual Migration** - Migrate existing features only when significant changes are needed

## 🛠️ Implementation Strategy

### Phase 1: Infrastructure Setup (1-2 days) ✅ COMPLETED

- Install React Query dependencies
- Create QueryProvider component
- Add to application layout
- Set up React Query DevTools (development only)

### Phase 2: New Pension Types (1-2 weeks) ✅ COMPLETED

- Implement State Pension using React Query
- Implement Savings Pension using React Query
- Create shared patterns and utilities

### Phase 3: Dashboard Implementation (2-3 weeks) ✅ COMPLETED

- Implement dashboard data services
- Create specialized query hooks
- Build dashboard components using React Query

### Phase 4: Compass Module (2-3 weeks) ✅ COMPLETED

- Implement calculation services
- Create query and mutation hooks
- Build Compass components

### Phase 5: Gradual Migration (Ongoing) ✅ COMPLETED

- Migrate existing features as needed
- Extract API calls to service functions
- Create React Query hooks for existing features
- Update components to use new hooks

## 📊 Core Implementation Patterns

### 1. API Service Layer

Create pure functions for API interactions:

```typescript
// src/frontend/services/pensionService.ts
export async function fetchPensions(type: string) {
  const response = await fetch(`/api/v1/pension/${type}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${type} pensions`);
  }
  return response.json();
}
```

### 2. React Query Hooks

Create custom hooks that use the service functions:

```typescript
// src/frontend/hooks/usePensions.ts
import { useQuery } from '@tanstack/react-query';
import { fetchPensions } from '@/frontend/services/pensionService';

export function usePensions(type: string) {
  return useQuery({
    queryKey: ['pensions', type],
    queryFn: () => fetchPensions(type),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 3. UI State Context

Separate UI state from data fetching:

```typescript
// src/frontend/context/PensionUIContext.tsx
"use client";

import { createContext, useContext, useState } from 'react';

export function PensionUIProvider({ children }) {
  const [selectedPensionId, setSelectedPensionId] = useState(null);
  // Other UI-only state...
  
  return (
    <PensionUIContext.Provider value={{
      selectedPensionId,
      setSelectedPensionId,
      // Other UI state...
    }}>
      {children}
    </PensionUIContext.Provider>
  );
}
```

### 4. Component Integration

Use both React Query and UI Context in components:

```typescript
"use client";

function PensionList() {
  // Data fetching with React Query
  const { data: pensions, isLoading, error } = usePensions('state');
  
  // UI state from Context
  const { selectedPensionId, setSelectedPensionId } = usePensionUI();
  
  // Component implementation...
}
```

### 5. Formatting Integration

Follow the patterns in formatting.md for displaying data:

```typescript
"use client";

function PensionValue({ value }) {
  const { settings } = useSettings();
  const [formatted, setFormatted] = useState("0");
  
  useEffect(() => {
    setFormatted(formatCurrency(value, {
      locale: settings.number_locale,
      currency: settings.currency
    }).formatted);
  }, [value, settings]);
  
  return <div>{formatted}</div>;
}
```

## 🔄 Migration Path

### Starting with New Features

1. **State Pension Module** ✅ COMPLETED
   - Implement with React Query from the start
   - Use as a template for future features

2. **Savings Pension Module** ✅ COMPLETED
   - Follow the same pattern as State Pension
   - Reuse common patterns and hooks

### Migrated Features

1. **ETF Pension Module** ✅ COMPLETED
   - Successfully migrated to React Query
   - Implemented proper pension type validation
   - Added service layer and query/mutation hooks
   - Improved error handling for loading states

2. **Household Module** ✅ COMPLETED
   - Migrated to React Query
   - Implemented efficient caching

3. **Settings Module** ✅ COMPLETED
   - Migrated to React Query
   - Added proper validation

4. **ETF Module** ✅ COMPLETED
   - Migrated to React Query
   - Implemented service layer and hooks

5. **Company Pension Module** ✅ COMPLETED
   - Successfully migrated to React Query
   - Implemented service layer with proper hooks
   - Improved UI with status actions in BasicInformation card header
   - Aligned layout with State Pension implementation

6. **Insurance Pension Module** ✅ COMPLETED
   - Successfully migrated to React Query
   - Implemented service layer with proper hooks
   - Created appropriate query and mutation hooks
   - Replaced context API in edit and new pages

### Previously Identified Components to Migrate ✅ COMPLETED

1. **Main Pension Listing Page** (`app/pension/page.tsx`) ✅ COMPLETED
   - Successfully migrated to use `usePensionList` hook
   - Implemented proper integration with household members data

2. **Statement Components** ✅ COMPLETED
   - All statement components now use React Query hooks
   - Implemented proper mutation hooks for deleting statements

3. **Investment Modal Components** ✅ COMPLETED
   - Created shared `OneTimeInvestmentModal` component using React Query
   - Removed redundant type-specific modal components
   - Ensured consistent behavior across all pension types

4. **Provider Cleanup** ✅ COMPLETED
   - Removed `PensionProvider` from `AppProviders.tsx`
   - Updated and migrated the `usePensionData` hook to use React Query
   - Eventually removed `usePensionData` hook as it was no longer needed
   - Added missing `InsurancePensionUIProvider` to `AppProviders.tsx`

## 📱 Specific Module Plans

### State Pension Implementation

**Status**: ✅ COMPLETED

1. **API Services**
   - Created CRUD operations for state pensions
   - Implemented proper error handling

2. **Query Hooks**
   - Implemented hooks for fetching state pensions
   - Created mutation hooks for CRUD operations

3. **UI Components**
   - Built list and detail views
   - Implemented forms with proper validation

### Savings Pension Implementation

**Status**: ✅ COMPLETED

1. **API Services**
   - Created CRUD operations for savings pensions
   - Reused patterns from State Pension

2. **Query Hooks**
   - Implemented hooks for fetching savings pensions
   - Created mutation hooks for CRUD operations

3. **UI Components**
   - Built list and detail views
   - Implemented forms with proper validation

### Dashboard Implementation

**Status**: ✅ COMPLETED

1. **Data Services**
   - Created aggregation endpoints
   - Implemented efficient data loading strategies

2. **Query Hooks**
   - Used parallel queries for different data sources
   - Implemented proper caching for expensive calculations

3. **UI Components**
   - Built dashboard widgets
   - Implemented proper loading states

### Compass Module Implementation

**Status**: ✅ COMPLETED

1. **Calculation Services**
   - Implemented projection calculations
   - Created scenario planning endpoints

2. **Query Hooks**
   - Cached expensive calculations
   - Implemented optimistic updates for scenario planning

3. **UI Components**
   - Built interactive planning tools
   - Implemented visualization components

## 🧩 Integration with Existing Patterns

### Formatting Integration

React Query works seamlessly with our existing formatting patterns:

1. **Fetch Raw Data**
   - Use React Query to fetch raw data from the API
   - Keep data in its original format

2. **Format on Client**
   - Format data only on the client side
   - Use the patterns from formatting.md

3. **Handle Hydration**
   - Follow the hydration mismatch prevention patterns
   - Use useEffect for formatting after hydration

### Example: Formatted Pension List

```typescript
"use client";

function FormattedPensionList() {
  // Fetch raw data with React Query
  const { data: pensions, isLoading } = usePensions('state');
  const { settings } = useSettings();
  
  // Format data client-side
  const [formattedPensions, setFormattedPensions] = useState([]);
  
  useEffect(() => {
    if (pensions) {
      setFormattedPensions(pensions.map(pension => ({
        ...pension,
        formattedValue: formatCurrency(pension.value, {
          locale: settings.number_locale,
          currency: settings.currency
        }).formatted
      })));
    }
  }, [pensions, settings]);
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <ul>
      {formattedPensions.map(pension => (
        <li key={pension.id}>
          {pension.name}: {pension.formattedValue}
        </li>
      ))}
    </ul>
  );
}
```

## 🎉 Migration Complete

The migration to React Query has been successfully completed across all parts of the application:

1. **Completed Infrastructure**
   - Set up React Query provider
   - Implemented standardized service layer
   - Created type-safe hooks for all data operations

2. **Migrated All Pension Types**
   - ETF Pension
   - Company Pension
   - Insurance Pension
   - State Pension
   - Savings Pension

3. **Cleaned Up Old Code**
   - Removed all data fetching from context
   - Deleted unnecessary files:
     - `/src/frontend/context/pension/` directory
     - `/src/frontend/context/ETFContext.tsx`
     - `/src/frontend/hooks/useApi.ts`
     - `/src/frontend/lib/hooks/usePensionData.ts`

4. **Added UI-Only Contexts**
   - Created proper separation between data fetching and UI state
   - Ensured all pension types have dedicated UI contexts

## 💡 React Query Implementation Guide for Complex Data Features

For future complex features like dashboards and detailed reports, follow these patterns:

### 1. Parallel Data Fetching

```typescript
function Dashboard() {
  // Fetch multiple data sources in parallel
  const { data: summaries } = usePensionSummaries()
  const { data: portfolioData } = usePortfolioSummary()
  const { data: projections } = useRetirementProjections()
  
  // Use results when all data is available
  if (summaries && portfolioData && projections) {
    // Render dashboard with all data
  }
}
```

### 2. Aggregation and Calculations

```typescript
// Hook for derived data with proper caching
function usePortfolioTotals() {
  const { data: pensions } = usePensionList()
  
  // Return calculated totals with memoization
  return useMemo(() => {
    if (!pensions) return { total: 0, byType: {} }
    
    return {
      total: pensions.reduce((sum, p) => sum + p.current_value, 0),
      byType: pensions.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + p.current_value
        return acc
      }, {})
    }
  }, [pensions])
}
```

### 3. Filter Implementation

```typescript
// Parameterized query with URL synchronization
function useFilteredPensions(filterParams) {
  return useQuery({
    queryKey: ['pensions', 'filtered', filterParams],
    queryFn: () => pensionService.getFiltered(filterParams),
    keepPreviousData: true // Keep old data while loading new
  })
}
```

### 4. Performance Optimization

```typescript
// Prefetching example for improved UX
function PensionList({ onSelectPension }) {
  const queryClient = useQueryClient()
  
  // Prefetch pension details on hover
  const prefetchPension = (id) => {
    queryClient.prefetchQuery({
      queryKey: ['pension', id],
      queryFn: () => pensionService.get(id)
    })
  }
  
  return (
    <ul>
      {pensions.map(pension => (
        <li 
          key={pension.id}
          onMouseEnter={() => prefetchPension(pension.id)}
          onClick={() => onSelectPension(pension.id)}
        >
          {pension.name}
        </li>
      ))}
    </ul>
  )
}
```

### 5. Form Integration

```typescript
// Optimistic updates for better UX
function PensionEditForm({ pensionId }) {
  const queryClient = useQueryClient()
  const { data: pension } = usePension(pensionId)
  
  const updateMutation = useMutation({
    mutationFn: (data) => pensionService.update(pensionId, data),
    // Optimistically update the UI
    onMutate: async (newData) => {
      await queryClient.cancelQueries(['pension', pensionId])
      const previous = queryClient.getQueryData(['pension', pensionId])
      queryClient.setQueryData(['pension', pensionId], {...previous, ...newData})
      return { previous }
    },
    // Handle potential errors
    onError: (err, variables, context) => {
      queryClient.setQueryData(['pension', pensionId], context.previous)
    },
    // Refetch after successful mutation
    onSettled: () => {
      queryClient.invalidateQueries(['pension', pensionId])
    }
  })
  
  // Form implementation...
}
```

Following these patterns will ensure consistent implementation of complex data features throughout the application while maintaining the performance benefits of React Query.