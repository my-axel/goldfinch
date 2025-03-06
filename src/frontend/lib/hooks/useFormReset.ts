import { useEffect } from 'react';
import { UseFormReturn, FieldValues, DefaultValues } from 'react-hook-form';
import { useSettings } from '@/frontend/context/SettingsContext';

export interface FormResetOptions<ApiType, FormType extends FieldValues> {
  // Data to reset form with
  data: ApiType | null | undefined;
  
  // Form instance from react-hook-form
  form: UseFormReturn<FormType>;
  
  // Transform API data to form data
  apiToForm: (data: ApiType, locale: string) => FormType;
  
  // Default values when data is null/undefined
  defaultValues?: DefaultValues<FormType>;
  
  // Additional dependencies that should trigger reset
  dependencies?: unknown[];
  
  // Optional callback after reset
  onReset?: (formData: FormType) => void;
}

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
 *   apiToForm: (data) => insurancePensionToForm(data, settings.number_locale),
 *   defaultValues: defaultInsurancePensionValues,
 *   dependencies: [settings.number_locale]
 * });
 * ```
 */
export function useFormReset<ApiType, FormType extends FieldValues>({
  data,
  form,
  apiToForm,
  defaultValues,
  dependencies = [],
  onReset
}: FormResetOptions<ApiType, FormType>) {
  const { settings } = useSettings();
  
  useEffect(() => {
    if (data) {
      // Transform API data to form data using the user's locale settings
      const formData = apiToForm(data, settings.number_locale);
      
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
  }, [data, form, settings.number_locale, ...dependencies]);
  
  return {
    // Utility function to manually reset the form with new data
    resetWithData: (newData: ApiType) => {
      const formData = apiToForm(newData, settings.number_locale);
      form.reset(formData);
      if (onReset) {
        onReset(formData);
      }
    }
  };
} 