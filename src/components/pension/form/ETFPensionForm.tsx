"use client"

import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { UseFormReturn } from "react-hook-form"
import { FormData } from "@/types/pension-form"

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
    <FormField
      control={form.control}
      name="automatic_rebalancing"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel>Automatic Rebalancing</FormLabel>
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
} 