# 04: Per-Pension Type Implementation

> <details>
> <summary><strong>🤖 AI Assistant Guide</strong></summary>
>
> ## Purpose
> This document is part 4 of 4 in the pension forms standardization series. It provides an overview of the implementation approach for each pension type and links to the individual implementation plans.
>
> ## Implementation Order
> 1. Layout Standardization
> 2. Formatting Standardization
> 3. Form Reset Implementation
> 4. **Per-Pension Type Implementation** (this document)
>
> ## Dependencies
> - Requires completion of the first three plans
> - Start with Insurance Pension forms as they are closest to the target implementation
>
> ## Expected Outcome
> All pension forms will follow the standardized patterns for layout, formatting, and form reset.
>
> ## Status Tracking
> - Use checkboxes to track progress
> - Mark subtasks as they are completed
>
> ## Status Indicators
> - [ ] Not started
> - [x] Completed
> - [~] Partially completed
>
> ## AI Implementation Notes
> - Follow the implementation plans exactly as specified
> - Do not modify any code outside the scope of the plans
> - Create only the components and files mentioned in the plans
> - Use the provided code examples as templates
> - Reference the Insurance Pension forms for any unclear details
> </details>

## 📋 Overview & Goals

This plan provides an overview of the implementation approach for each pension type. To maintain focus and clarity, the implementation details for each pension type have been split into separate documents.

### Key Goals
1. Apply standardized layout, formatting, and form reset to all pension forms
2. Ensure consistent behavior across all pension types
3. Implement one form at a time to minimize disruption

### Reference Documents
- [Layout Standardization](docs/plans/active/pension_forms_refactoring/01_layout_standardization.md)
- [Formatting Standardization](docs/plans/active/pension_forms_refactoring/02_formatting_standardization.md)
- [Form Reset Implementation](docs/plans/active/pension_forms_refactoring/03_form_reset_implementation.md)

## 📊 Implementation Order

1. **Insurance Pension Forms** (Reference Implementation)
   - Verify and finalize as reference implementation
   - Document patterns for other forms to follow
   - [Implementation Plan](04a_insurance_pension_implementation.md)

2. **ETF Pension Forms** (Highest Priority)
   - Apply standardization to Add Form
   - Apply standardization to Edit Form
   - [Implementation Plan](04b_etf_pension_implementation.md)

3. **Company Pension Forms** (Medium Priority)
   - Apply standardization to Add Form
   - Apply standardization to Edit Form
   - [Implementation Plan](04c_company_pension_implementation.md)

## 🔍 Implementation Strategy

### Step-by-Step Approach

For each form, follow this implementation sequence:

1. **Layout First**: Implement the flexible two-column grid layout
   - This provides the structural foundation for the form
   - Create explanation components for each section

2. **Formatting Second**: Apply formatting standardization
   - Replace custom formatting with centralized utilities
   - Implement client-side formatting pattern
   - Use formatting components for inputs and displays

3. **Form Reset Last**: Implement the form reset hook
   - This depends on the transformers created in the previous plan
   - Replace manual reset logic with the hook

### Implementation Tips

- **One Form at a Time**: Complete one form before moving to the next
- **Start with Add Forms**: They are typically simpler than Edit forms
- **Reference the Insurance Forms**: Use them as a guide for implementation 