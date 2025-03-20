# Form Architecture Pattern

For forms, use a parent page component with a custom data hook for data fetching, pass the data to a child form component that uses useForm with proper default values, wrap everything in ErrorBoundary, and use LoadingState for loading states - never fetch or manage global state directly in form components.

## Detailed Implementation

### Parent Page Component

```tsx
"use client"

import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { FormComponent } from "@/frontend/components/path/to/FormComponent"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { FormDataType } from "@/frontend/types/form-types"
import { ErrorBoundary } from "@/frontend/components/shared/ErrorBoundary"
import { LoadingState } from "@/frontend/components/shared/LoadingState"
import { useDataHook } from "@/frontend/lib/hooks/useDataHook"
import { Alert, AlertDescription, AlertTitle } from "@/frontend/components/ui/alert"
import { useEffect } from "react"

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

### Child Form Component

```tsx
import { UseFormReturn } from "react-hook-form"
import { FormDataType } from "@/frontend/types/form-types"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { Input } from "@/frontend/components/ui/input"

interface FormComponentProps {
  form: UseFormReturn<FormDataType>
}

export function FormComponent({ form }: FormComponentProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="field1"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Field 1</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Additional form fields */}
    </div>
  )
}
```

### Data Fetching Hook

```tsx
import { useState, useEffect } from 'react'
import { useApi } from '@/frontend/hooks/useApi'

interface UseDataHookResult<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  mutate: () => Promise<void>
}

export function useDataHook<T>(): UseDataHookResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const api = useApi()

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.getData()
      setData(response)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const mutate = async () => {
    await fetchData()
  }

  return {
    data,
    isLoading,
    error,
    mutate
  }
}
```

## Benefits

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