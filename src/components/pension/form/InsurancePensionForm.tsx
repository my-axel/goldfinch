"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"
import { FormData } from "@/types/pension-form"

interface InsurancePensionFormProps {
  form: UseFormReturn<FormData>
}

/**
 * Insurance-specific form fields for pension plans.
 * Includes provider and contract number fields.
 * 
 * TODO: Add guaranteed interest rate field
 * TODO: Add expected return rate field
 * TODO: Add insurance type selection
 * TODO: Add contract duration field
 * TODO: Add validation for contract number format
 */
export function InsurancePensionForm({ form }: InsurancePensionFormProps) {
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
        name="provider"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Provider</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="contract_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contract Number</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
} 