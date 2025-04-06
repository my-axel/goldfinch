"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { SavingsPensionFormData } from "@/frontend/types/pension-form"
import { PercentInput } from "@/frontend/components/shared/inputs/PercentInput"

interface InterestRatesCardProps {
  form: UseFormReturn<SavingsPensionFormData>
}

/**
 * Component for editing savings pension interest rates.
 * Handles pessimistic, realistic, and optimistic rates.
 */
export function InterestRatesCard({ form }: InterestRatesCardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="pessimistic_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pessimistic Rate (%)</FormLabel>
              <FormControl>
                <PercentInput
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="e.g., 1.5"
                  min={0}
                  max={20}
                  decimals={1}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="realistic_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Realistic Rate (%)</FormLabel>
              <FormControl>
                <PercentInput
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="e.g., 3.0"
                  min={0}
                  max={20}
                  decimals={1}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="optimistic_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Optimistic Rate (%)</FormLabel>
              <FormControl>
                <PercentInput
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="e.g., 5.0"
                  min={0}
                  max={20}
                  decimals={1}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
} 