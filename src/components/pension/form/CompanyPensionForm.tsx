"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"
import { FormData } from "@/types/pension-form"

/**
 * Form component for company-based pension plans.
 * Handles employer-specific pension details and matching contributions.
 * 
 * Features:
 * - Employer information
 * - Vesting period configuration
 * - Employer matching setup
 * - Start date selection
 * 
 * TODO: Add employer validation
 * TODO: Add vesting schedule configuration
 * TODO: Add matching contribution tiers
 * TODO: Add investment options selection
 * TODO: Add portability settings
 * TODO: Add tax benefit calculation
 * TODO: Add API integration for employer data
 * TODO: Add automatic contribution adjustment
 */
export function CompanyPensionForm({ form }: { form: UseFormReturn<FormData> }) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="employer"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Employer</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="vesting_period"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Vesting Period (Years)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0"
                step="1"
                {...field}
                onChange={e => field.onChange(parseInt(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="matching_percentage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Employer Matching (%)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0"
                max="100"
                step="1"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="max_employer_contribution"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maximum Employer Contribution (€)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0"
                step="100"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="start_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Start Date</FormLabel>
            <FormControl>
              <Input 
                type="date" 
                {...field}
                value={field.value ? field.value.toISOString().split('T')[0] : ''} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
} 