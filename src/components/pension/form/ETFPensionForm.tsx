"use client"

import { FormField, FormItem, FormLabel } from "@/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { FormData } from "@/types/pension-form"
import { ETFSearchCombobox } from "@/components/etf/ETFSearchCombobox"

interface ETFPensionFormProps {
  form: UseFormReturn<FormData>
}

/**
 * ETF-specific form fields for pension plans.
 * Currently only includes automatic rebalancing toggle.
 * 
 * TODO: Add ETF allocation fields with percentages
 * TODO: Add ETF selection from available ETFs
 * TODO: Add rebalancing frequency selection when automatic_rebalancing is true
 * TODO: Add validation for total allocation (must sum to 100%)
 */
export function ETFPensionForm({ form }: ETFPensionFormProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="etf_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>ETF Selection</FormLabel>
            <ETFSearchCombobox 
              value={field.value}
              onSelect={(etf) => {
                field.onChange(etf.id)
              }}
            />
          </FormItem>
        )}
      />
    </div>
  )
} 