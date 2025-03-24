# 📋 Statement Management Custom Hooks Implementation Plan

> <details>
> <summary><strong>🤖 AI Assistant Guide</strong></summary>
>
> ## Purpose
> This document provides a step-by-step implementation plan for creating reusable custom hooks and utilities for statement management across different pension types. It aims to standardize the approach while maintaining flexibility for different data structures.
>
> ## Document Structure
> 
> ### 1. Implementation Overview
> - High-level description of the approach
> - Core principles to follow
> - Expected outcomes
>
> ### 2. Implementation Steps
> - Organized in sequential order
> - Each step has clear checkboxes
> - Dependencies between steps are clearly marked
>
> ### 3. Testing Strategy
> - How to verify the implementation works
> - Key test cases to consider
>
> ## Working with this Document
>
> ### Implementation Process
> 1. Follow steps in sequential order
> 2. Check off completed items
> 3. Refer to existing code examples when needed
> 4. Maintain type safety throughout
>
> ### Key Principles
> - Extract common logic, not UI structure
> - Maintain type safety with generics
> - Keep hooks focused on single responsibilities
> - Ensure backward compatibility
>
> ## Status Indicators
> - ✅ Complete: Step fully implemented and tested
> - 🔄 In Progress: Currently being worked on
> - ⏱️ Pending: Not yet started
>
> ## Rules & Best Practices
> 1. Follow TypeScript best practices
> 2. Maintain consistent naming conventions
> 3. Document hook parameters and return values
> 4. Ensure hooks are composable
> 5. Avoid breaking changes to existing components
> </details>

## 📋 Implementation Overview

Create reusable custom hooks for statement management across pension types, leveraging React Query for data management and caching.

### Core Principles
- Use React Query for data fetching and caching
- Extract common statement logic into reusable hooks
- Maintain type safety with TypeScript generics
- Keep hooks focused and composable
- Ensure backward compatibility

### Expected Outcomes
- Standardized statement management across pension types
- Efficient data caching and synchronization
- Improved loading and error states
- Reduced code duplication

## 📝 Implementation Steps

### Phase 1: Create Base Statement Hooks

- [ ] 1.1 Create `useStatementQuery` hook
  ```typescript
  // Path: src/frontend/lib/hooks/useStatementQuery.ts
  ```
  - [ ] Implement base query hook using React Query
  - [ ] Add TypeScript generics for pension types
  - [ ] Handle loading and error states
  - [ ] Add stale time configuration

- [ ] 1.2 Create `useStatementMutations` hook
  ```typescript
  // Path: src/frontend/lib/hooks/useStatementMutations.ts
  ```
  - [ ] Implement create/update/delete mutations
  - [ ] Add cache invalidation logic
  - [ ] Handle optimistic updates
  - [ ] Add TypeScript generics for pension types

### Phase 2: Create UI Management Hooks

- [ ] 2.1 Create `useExpandableStatements` hook
  ```typescript
  // Path: src/frontend/lib/hooks/useExpandableStatements.ts
  ```
  - [ ] Implement expand/collapse state management
  - [ ] Add batch operations (expand all, collapse all)
  - [ ] Persist expansion state

- [ ] 2.2 Create `useStatementForm` hook
  ```typescript
  // Path: src/frontend/lib/hooks/useStatementForm.ts
  ```
  - [ ] Integrate with React Hook Form
  - [ ] Handle form state and validation
  - [ ] Add default values handling
  - [ ] Add form reset functionality

### Phase 3: Refactor Existing Components

- [ ] 3.1 Refactor State Pension StatementsCard
  ```typescript
  // Path: src/frontend/components/pension/state/StatementsCard.tsx
  ```
  - [ ] Replace direct React Query calls with custom hooks
  - [ ] Implement new form management
  - [ ] Maintain existing functionality
  - [ ] Test all CRUD operations

- [ ] 3.2 Refactor Insurance StatementsCard
  ```typescript
  // Path: src/frontend/components/pension/insurance/StatementsCard.tsx
  ```
  - [ ] Replace existing state management
  - [ ] Implement new hooks
  - [ ] Verify functionality

- [ ] 3.3 Refactor Company PensionStatementsCard
  ```typescript
  // Path: src/frontend/components/pension/company/PensionStatementsCard.tsx
  ```
  - [ ] Replace existing state management
  - [ ] Implement new hooks
  - [ ] Verify functionality

### Phase 4: Testing and Documentation

- [ ] 4.1 Create hook tests
  - [ ] Test query hooks
  - [ ] Test mutation hooks
  - [ ] Test UI management hooks
  - [ ] Test form integration

- [ ] 4.2 Update documentation
  ```typescript
  // Path: docs/frontend/hooks/statement_hooks.md
  ```
  - [ ] Document hook APIs
  - [ ] Add usage examples
  - [ ] Include migration guide

## 🧪 Testing Strategy

### Unit Tests
- [ ] Test query hooks with mock data
- [ ] Test mutation hooks with mock API
- [ ] Test UI management hooks
- [ ] Test form integration

### Integration Tests
- [ ] Test State Pension implementation
- [ ] Test Insurance Pension implementation
- [ ] Test Company Pension implementation
- [ ] Test edge cases

## 📚 Hook Signatures

```typescript
// useStatementQuery
function useStatementQuery<T>({ 
  pensionId, 
  pensionType 
}: { 
  pensionId: number
  pensionType: PensionType 
}) => {
  data?: T[]
  isLoading: boolean
  error?: Error
}

// useStatementMutations
function useStatementMutations<T>({ 
  pensionId, 
  pensionType 
}: { 
  pensionId: number
  pensionType: PensionType 
}) => {
  createStatement: (data: Omit<T, 'id'>) => Promise<T>
  updateStatement: (id: number, data: Partial<T>) => Promise<T>
  deleteStatement: (id: number) => Promise<void>
  isLoading: boolean
  error?: Error
}

// useExpandableStatements
function useExpandableStatements() => {
  expandedStatements: Record<number, boolean>
  toggleStatement: (index: number) => void
  expandAll: () => void
  collapseAll: () => void
}

// useStatementForm
function useStatementForm<T>({
  defaultValues,
  onSubmit
}: {
  defaultValues?: T
  onSubmit: (data: T) => Promise<void>
}) => {
  form: UseFormReturn<T>
  isSubmitting: boolean
  error?: Error
  reset: () => void
}
```

## 🔄 Migration Strategy

1. Create and test new hooks without modifying existing components
2. Migrate State Pension implementation first (already using React Query)
3. Migrate Insurance and Company Pension implementations
4. Verify all functionality works as expected
5. Remove old state management code 