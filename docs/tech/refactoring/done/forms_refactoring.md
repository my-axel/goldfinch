# Forms Refactoring TODO

This document lists all forms in the codebase that need to be refactored to follow the new architecture pattern with proper hooks, loading states, and error boundaries.

## Architecture Pattern

The new architecture pattern consists of:

1. **Parent Page Component**:
   - Uses a custom data fetching hook (e.g., `usePensionData`) for data fetching
   - Initializes the form with `useForm` and proper default values
   - Handles form submission and API calls
   - Wraps everything in an `ErrorBoundary`
   - Uses `LoadingState` for loading states
   - Passes data to a child form component

2. **Child Form Component**:
   - Receives the form instance via props
   - Focuses solely on rendering form fields and validation
   - Does not fetch or manage global state directly

3. **Data Fetching Hook**:
   - Handles data fetching, loading states, and errors
   - Returns data, loading state, error state, and a mutate function

## Forms to Refactor

### Pension Forms

#### Insurance Pension Forms
- [ ] `app/pension/insurance/new/page.tsx`
   - Missing `ErrorBoundary` and `LoadingState`
   - Should use a custom data hook for member data

- [ ] `app/pension/insurance/[id]/edit/page.tsx`
   - Missing `ErrorBoundary` and `LoadingState`
   - Should use `usePensionData` hook

#### ETF Pension Forms
- [ ] `app/pension/etf/new/page.tsx`
   - Missing `ErrorBoundary` and `LoadingState`
   - Should use a custom data hook for member data

- [ ] `app/pension/etf/[id]/edit/page.tsx`
   - Missing `ErrorBoundary`
   - Uses custom loading state logic instead of the standard `LoadingState` component

#### Company Pension Forms
- [ ] `app/pension/company/new/page.tsx`
   - Missing `ErrorBoundary` and `LoadingState`
   - Should use a custom data hook for member data

### Household Forms
- [ ] `app/household/new/page.tsx` (if exists)
   - Should follow the new architecture pattern

- [ ] `app/household/[id]/edit/page.tsx` (if exists)
   - Should follow the new architecture pattern

### Settings Forms
- [ ] `app/settings/page.tsx`
   - Should use `ErrorBoundary` and `LoadingState`
   - Should use a custom data hook for settings data

## Implementation Guide

For each TODO item, refactor the form to follow this pattern:

```tsx
"use client"

import { useForm } from "react-hook-form"
import { useRouter, useParams } from "next/navigation"
import { FormComponent } from "@/frontend/components/path/to/FormComponent"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { FormDataType } from "@/frontend/types/form-types"
import { ErrorBoundary } from "@/frontend/components/shared/ErrorBoundary"
import { LoadingState } from "@/frontend/components/shared/LoadingState"
import { useDataHook } from "@/frontend/lib/hooks/useDataHook"
import { Alert, AlertDescription, AlertTitle } from "@/frontend/components/ui/alert"

export default function FormPage() {
  const router = useRouter()
  const { data, isLoading, error } = useDataHook()

  const form = useForm<FormDataType>({
    defaultValues: {
      // Default values
    }
  })

  // Reset form when data is available
  useEffect(() => {
    if (!data || isLoading) {
      return
    }

    form.reset({
      // Map data to form values
    })
  }, [data, isLoading, form])

  const handleSubmit = async (formData: FormDataType) => {
    try {
      // Submit form data
      // Show success toast
      // Navigate to appropriate page
    } catch (error) {
      // Error handling
    }
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-10">
        {isLoading ? (
          <LoadingState message="Loading data..." />
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              <FormComponent form={form} />
              
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit">
                  Submit
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </ErrorBoundary>
  )
}
```

## Benefits of the New Architecture

1. **Separation of Concerns**:
   - Parent component handles data fetching and form state
   - Child component focuses on rendering form fields

2. **Improved Error Handling**:
   - Consistent error boundaries prevent the entire app from crashing
   - Proper error states for API failures

3. **Better User Experience**:
   - Consistent loading states across the application
   - Clear feedback during data fetching and form submission

4. **Maintainability**:
   - Standardized pattern makes code more predictable
   - Easier to debug and extend functionality

5. **Type Safety**:
   - Proper typing of form data and API responses
   - Reduced runtime errors 