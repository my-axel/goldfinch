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

### Phase 1: Infrastructure Setup (1-2 days)

- Install React Query dependencies
- Create QueryProvider component
- Add to application layout
- Set up React Query DevTools (development only)

### Phase 2: New Pension Types (1-2 weeks)

- Implement State Pension using React Query
- Implement Savings Pension using React Query
- Create shared patterns and utilities

### Phase 3: Dashboard Implementation (2-3 weeks)

- Implement dashboard data services
- Create specialized query hooks
- Build dashboard components using React Query

### Phase 4: Compass Module (2-3 weeks)

- Implement calculation services
- Create query and mutation hooks
- Build Compass components

### Phase 5: Gradual Migration (Ongoing)

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

1. **State Pension Module** ✅
   - Implement with React Query from the start
   - Use as a template for future features

2. **Savings Pension Module** ✅
   - Follow the same pattern as State Pension
   - Reuse common patterns and hooks

### Migrated Features

1. **ETF Pension Module** ✅
   - Successfully migrated to React Query
   - Implemented proper pension type validation
   - Added service layer and query/mutation hooks
   - Improved error handling for loading states

2. **Household Module** ✅
   - Migrated to React Query
   - Implemented efficient caching

3. **Settings Module** ✅
   - Migrated to React Query
   - Added proper validation

4. **ETF Module** ✅
   - Migrated to React Query
   - Implemented service layer and hooks

5. **Company Pension Module** ✅
   - Successfully migrated to React Query
   - Implemented service layer with proper hooks
   - Improved UI with status actions in BasicInformation card header
   - Aligned layout with State Pension implementation

### Pending Migration

1. **Insurance Pension Module** 🟡
   - Prepare service layer
   - Implement query/mutation hooks
   - Migrate components to use new hooks

### Modules Not Requiring Migration

These modules are currently UI-only templates and will be built with React Query from the start when fully implemented:

1. **Dashboard Module** ⚠️
   - Currently UI-only template
   - Will use React Query when implementing actual data fetching
   - No migration needed (will be built with React Query from scratch)

2. **Compass Module** ⚠️
   - Currently UI-only template
   - Will use React Query for complex calculations when implemented
   - No migration needed (will be built with React Query from scratch)

3. **Payout Strategy Module** ⚠️
   - Currently UI-only template
   - Will use React Query when implementing actual functionality
   - No migration needed (will be built with React Query from scratch)

### Implementation Guidelines for Template Modules

When implementing the full functionality for these template modules:

1. **Create API Services First**
   - Build a proper service layer for each module
   - Follow established patterns from migrated modules

2. **Implement React Query Hooks**
   - Design with proper caching strategies
   - Ensure proper error handling

3. **Integrate with UI Templates**
   - Enhance existing UI templates with real data
   - Implement loading and error states

## 📱 Specific Module Plans

### State Pension Implementation

**Status**: ✅ Ready to implement

1. **API Services**
   - Create CRUD operations for state pensions
   - Implement proper error handling

2. **Query Hooks**
   - Implement hooks for fetching state pensions
   - Create mutation hooks for CRUD operations

3. **UI Components**
   - Build list and detail views
   - Implement forms with proper validation

### Savings Pension Implementation

**Status**: ⚠️ Needs State Pension implementation first

1. **API Services**
   - Create CRUD operations for savings pensions
   - Reuse patterns from State Pension

2. **Query Hooks**
   - Implement hooks for fetching savings pensions
   - Create mutation hooks for CRUD operations

3. **UI Components**
   - Build list and detail views
   - Implement forms with proper validation

### Dashboard Implementation

**Status**: 📝 Planning phase

1. **Data Services**
   - Create aggregation endpoints
   - Implement efficient data loading strategies

2. **Query Hooks**
   - Use parallel queries for different data sources
   - Implement proper caching for expensive calculations

3. **UI Components**
   - Build dashboard widgets
   - Implement proper loading states

### Compass Module Implementation

**Status**: 📝 Planning phase

1. **Calculation Services**
   - Implement projection calculations
   - Create scenario planning endpoints

2. **Query Hooks**
   - Cache expensive calculations
   - Implement optimistic updates for scenario planning

3. **UI Components**
   - Build interactive planning tools
   - Implement visualization components

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

## 🚀 Next Steps

1. **Infrastructure Setup**
   - Install dependencies
   - Create QueryProvider
   - Add to application layout

2. **State Pension Implementation**
   - Create API services
   - Implement query hooks
   - Build UI components

3. **Documentation**
   - Create usage examples
   - Document common patterns
   - Update existing documentation

## 📚 Resources

- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [Formatting Best Practices](docs/tech/best-practices/formatting.md)
- [Technical Guidelines](docs/tech/guidelines/README.md) 