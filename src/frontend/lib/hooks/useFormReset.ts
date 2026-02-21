import { useEffect } from 'react';
import { UseFormReturn, FieldValues, DefaultValues } from 'react-hook-form';

export interface FormResetOptions<ApiType, FormType extends FieldValues> {
  // Data to reset form with
  data: ApiType | null | undefined;
  
  // Form instance from react-hook-form
  form: UseFormReturn<FormType>;
  
  // Transform API data to form data
  apiToForm: (data: ApiType) => FormType;
  
  // Default values when data is null/undefined
  defaultValues?: DefaultValues<FormType>;
  
  // Additional dependencies that should trigger reset
  dependencies?: unknown[];
  
  // Optional callback after reset
  onReset?: (formData: FormType) => void;
}

const EMPTY_DEPENDENCIES: unknown[] = [];

/**
 * A reusable hook for handling form reset logic across the application.
 * Handles the transformation of API data to form data, including:
 * - Type mismatches between API and form data
 * - Complex nested data structures
 * - Date format conversions
 * - Default value handling
 * - Enum validation and transformation
 * 
 * @example
 * ```typescript
 * const form = useForm<InsurancePensionFormData>();
 * const { resetWithData } = useFormReset({
 *   data: pension,
 *   form,
 *   apiToForm: insurancePensionToForm,
 *   defaultValues: defaultInsurancePensionValues,
 *   dependencies: []
 * });
 * ```
 */
export function useFormReset<ApiType, FormType extends FieldValues>({
  data,
  form,
  apiToForm,
  defaultValues,
  dependencies = EMPTY_DEPENDENCIES,
  onReset
}: FormResetOptions<ApiType, FormType>) {
  useEffect(() => {
    if (data) {
      // Transform API data to form data
      const formData = apiToForm(data);
      
      // Reset form with transformed data
      form.reset(formData);
      
      // Call optional callback
      if (onReset) {
        onReset(formData);
      }
    } else if (defaultValues) {
      // Reset with default values if data is null/undefined
      form.reset(defaultValues);
    }
  }, [data, form, defaultValues, apiToForm, onReset, dependencies]);
  
  return {
    // Utility function to manually reset the form with new data
    resetWithData: (newData: ApiType) => {
      const formData = apiToForm(newData);
      form.reset(formData);
      if (onReset) {
        onReset(formData);
      }
    }
  };
} 
