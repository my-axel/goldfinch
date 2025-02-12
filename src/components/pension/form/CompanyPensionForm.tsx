"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"
import { FormData } from "@/types/pension-form"

interface CompanyPensionFormProps {
  form: UseFormReturn<FormData>
}

/**
 * Company-specific form fields for pension plans.
 * Includes employer and vesting period fields.
 * 
 * TODO: Add matching percentage field
 * TODO: Add maximum employer contribution field
 * TODO: Add contribution frequency selection
 * TODO: Add validation for vesting period (min/max values)
 * TODO: Add support for different vesting schedules
 */
export function CompanyPensionForm({ form }: CompanyPensionFormProps) {
  return (
    <div className="space-y-6">
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
            <FormLabel>Vesting Period (years)</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
} 