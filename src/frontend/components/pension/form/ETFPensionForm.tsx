"use client"

import { FormField, FormItem, FormLabel } from "@/frontend/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { FormData } from "@/frontend/types/pension-form"
import { ETFSearchCombobox } from "@/frontend/components/etf/ETFSearchCombobox"

interface ETFPensionFormProps {
  form: UseFormReturn<FormData>
}

/**
 * Form component for ETF-based pension plans.
 * Handles ETF selection and automatic rebalancing settings.
 * 
 * Features:
 * - ETF search and selection
 * - Automatic rebalancing toggle
 * - Current ETF price display
 * - Performance metrics
 * 
 * TODO: Add ETF performance history
 * TODO: Add portfolio allocation visualization
 * TODO: Add rebalancing schedule configuration
 * TODO: Add dividend reinvestment settings
 * TODO: Add cost basis tracking
 * TODO: Add API integration for real-time ETF data
 * TODO: Add validation for ETF selection
 * TODO: Add risk assessment metrics
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