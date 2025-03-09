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

This plan outlines the creation of reusable custom hooks and utilities for statement management across different pension types. The goal is to standardize the approach while maintaining flexibility for different data structures.

### Core Principles
- Extract common logic into reusable hooks
- Maintain type safety with TypeScript generics
- Keep hooks focused on single responsibilities
- Ensure backward compatibility with existing components

### Expected Outcomes
- Reduced code duplication
- Consistent behavior across pension types
- Easier implementation for future pension types
- Improved maintainability

## 📝 Implementation Steps

### Phase 1: Create Base Utilities

- [ ] 1.1 Create utility functions for statement operations
  ```typescript
  // Path: src/frontend/lib/hooks/useStatementUtils.ts
  ```
  - [ ] Implement `addStatement` utility
  - [ ] Implement `removeStatement` utility
  - [ ] Add TypeScript generics for type safety
  - [ ] Add JSDoc comments for function documentation

- [ ] 1.2 Create utility functions for projection operations
  ```typescript
  // Path: src/frontend/lib/hooks/useProjectionUtils.ts
  ```
  - [ ] Implement `addProjection` utility
  - [ ] Implement `removeProjection` utility
  - [ ] Add TypeScript generics for type safety
  - [ ] Add JSDoc comments for function documentation

### Phase 2: Create Custom Hooks

- [ ] 2.1 Create `useExpandableStatements` hook
  ```typescript
  // Path: src/frontend/lib/hooks/useExpandableStatements.ts
  ```
  - [ ] Implement state management for expanded/collapsed states
  - [ ] Add toggle functionality
  - [ ] Add batch operations (expand all, collapse all)
  - [ ] Add TypeScript generics for type safety

- [ ] 2.2 Create `useStatementManager` hook
  ```typescript
  // Path: src/frontend/lib/hooks/useStatementManager.ts
  ```
  - [ ] Implement statement addition/removal
  - [ ] Handle form state updates
  - [ ] Add TypeScript generics for type safety
  - [ ] Add optional API integration

- [ ] 2.3 Create `useProjectionManager` hook
  ```typescript
  // Path: src/frontend/lib/hooks/useProjectionManager.ts
  ```
  - [ ] Implement projection addition/removal
  - [ ] Handle form state updates for projections
  - [ ] Manage projection input state
  - [ ] Add TypeScript generics for type safety

### Phase 3: Refactor Existing Components

- [ ] 3.1 Refactor Insurance StatementsCard
  ```typescript
  // Path: src/frontend/components/pension/insurance/StatementsCard.tsx
  ```
  - [ ] Import and use the new custom hooks
  - [ ] Remove duplicated logic
  - [ ] Maintain existing functionality
  - [ ] Ensure no regression in behavior

- [ ] 3.2 Refactor Company PensionStatementsCard
  ```typescript
  // Path: src/frontend/components/pension/company/PensionStatementsCard.tsx
  ```
  - [ ] Import and use the new custom hooks
  - [ ] Remove duplicated logic
  - [ ] Maintain existing functionality
  - [ ] Ensure no regression in behavior

### Phase 4: Documentation and Testing

- [ ] 4.1 Create usage examples
  ```typescript
  // Path: docs/frontend/components/statement_hooks_usage.md
  ```
  - [ ] Document basic usage patterns
  - [ ] Provide examples for different pension types
  - [ ] Include TypeScript type definitions

- [ ] 4.2 Test implementation
  - [ ] Verify Insurance StatementsCard functionality
  - [ ] Verify Company PensionStatementsCard functionality
  - [ ] Test edge cases (empty statements, max statements)

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] Test adding statements in both components
- [ ] Test removing statements in both components
- [ ] Test adding projections in both components
- [ ] Test removing projections in both components
- [ ] Test expanding/collapsing statements
- [ ] Verify form validation still works
- [ ] Verify form submission with API still works

### Edge Cases to Test
- [ ] Empty statement list
- [ ] Maximum number of statements
- [ ] Empty projection list
- [ ] Maximum number of projections
- [ ] Form reset behavior

## 📚 Implementation Details

### Hook Signatures

```typescript
// useExpandableStatements
function useExpandableStatements(): {
  expandedStatements: Record<number, boolean>;
  toggleStatement: (index: number) => void;
  isExpanded: (index: number) => boolean;
  expandAll: () => void;
  collapseAll: () => void;
}

// useStatementManager
function useStatementManager<T>({
  form,
  statementPath,
  createDefaultStatement,
  pensionId,
}: {
  form: UseFormReturn<any>;
  statementPath: string;
  createDefaultStatement: () => T;
  pensionId?: number;
}): {
  addStatement: () => void;
  removeStatement: (index: number) => void;
  confirmDeleteStatement: (index: number) => void;
}

// useProjectionManager
function useProjectionManager<T>({
  form,
  statementPath,
  projectionPath,
  createDefaultProjection,
}: {
  form: UseFormReturn<any>;
  statementPath: string;
  projectionPath: string;
  createDefaultProjection: () => T;
}): {
  projectionInputs: Record<string, string>;
  addProjection: (statementIndex: number) => void;
  removeProjection: (statementIndex: number, projectionIndex: number) => void;
}
```

## 🔄 Migration Strategy

1. Implement hooks without changing existing components
2. Test hooks in isolation
3. Refactor one component at a time
4. Verify functionality after each refactor
5. Document usage patterns for future pension types 