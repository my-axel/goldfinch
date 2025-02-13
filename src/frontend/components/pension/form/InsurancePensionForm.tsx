"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { Input } from "@/frontend/components/ui/input"
import { UseFormReturn } from "react-hook-form"
import { FormData } from "@/frontend/types/pension-form"

/**
 * Form component for insurance-based pension plans.
 * Handles insurance-specific details and contract information.
 * 
 * Features:
 * - Insurance provider selection
 * - Contract number input
 * - Interest rate configuration
 * - Start date selection
 * 
 * TODO: Add provider validation
 * TODO: Add contract number format validation
 * TODO: Add provider-specific interest rate ranges
 * TODO: Add policy document upload
 * TODO: Add beneficiary management
 * TODO: Add premium payment schedule
 * TODO: Add surrender value calculation
 * TODO: Add API integration for provider data
 */
export function InsurancePensionForm({ form }: { form: UseFormReturn<FormData> }) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="provider"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Insurance Provider</FormLabel>
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

      <FormField
        control={form.control}
        name="guaranteed_interest"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Guaranteed Interest Rate (%)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                step="0.01"
                {...field}
                onChange={e => field.onChange(parseFloat(e.target.value) / 100)}
                value={(field.value * 100).toString()}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="expected_return"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Expected Return Rate (%)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                step="0.01"
                {...field}
                onChange={e => field.onChange(parseFloat(e.target.value) / 100)}
                value={(field.value * 100).toString()}
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