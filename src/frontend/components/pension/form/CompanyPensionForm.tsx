"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { Input } from "@/frontend/components/ui/input"
import { UseFormReturn } from "react-hook-form"
import { FormData } from "@/frontend/types/pension-form"

interface CompanyPensionFormProps {
  form: UseFormReturn<FormData>
}

/**
 * Form component for company-specific pension fields.
 * Handles employer details, vesting period, and contribution matching.
 */
export function CompanyPensionForm({ form }: CompanyPensionFormProps) {
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
        name="start_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Start Date</FormLabel>
            <FormControl>
              <Input
                type="date"
                {...field}
                value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                onChange={(e) => field.onChange(new Date(e.target.value))}
              />
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
              <Input
                type="number"
                min="0"
                step="1"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="matching_percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employer Match (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
              <FormLabel>Max Employer Contribution (€)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
} 